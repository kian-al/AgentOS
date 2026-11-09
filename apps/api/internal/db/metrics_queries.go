// Package db — SQL query helpers for telemetry metrics.
package db

import (
	"database/sql"
	"math"

	"github.com/agentos/api/internal/models"
)

// MetricsSummary queries the database for high-level KPIs and delta comparisons.
// Performs purely SQL-level aggregations without scanning rows into Go memory.
func (db *DB) MetricsSummary() (*models.MetricsSummary, error) {
	var summary models.MetricsSummary

	// 1. Total events count across the entire database
	err := db.QueryRow(`SELECT COUNT(*) FROM events`).Scan(&summary.EventsTotal)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}

	// 2. Active sessions: distinct sessions active in the last 15 minutes
	// Uses event timestamp if present, otherwise falls back to created_at
	err = db.QueryRow(`
		SELECT COUNT(DISTINCT session_id)
		FROM events
		WHERE COALESCE(NULLIF(timestamp, ''), created_at) >= datetime('now', '-15 minutes')
	`).Scan(&summary.ActiveSessions)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}

	// 3. Today's metrics (tokens, cost, distinct agents)
	// Considers events from start of current UTC day
	var tokensToday sql.NullInt64
	var costToday sql.NullFloat64
	var agentsSeen sql.NullInt64

	err = db.QueryRow(`
		SELECT 
			COALESCE(SUM(input_tokens + output_tokens), 0),
			COALESCE(SUM(cost_usd), 0.0),
			COUNT(DISTINCT NULLIF(agent, ''))
		FROM events
		WHERE date(COALESCE(NULLIF(timestamp, ''), created_at)) = date('now')
	`).Scan(&tokensToday, &costToday, &agentsSeen)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}

	summary.TokensToday = int(tokensToday.Int64)
	summary.CostTodayUSD = round2(costToday.Float64)
	summary.AgentsSeen = int(agentsSeen.Int64)

	// 4. Yesterday's window metrics for delta calculation:
	// From start of yesterday (00:00:00) up to the equivalent time yesterday
	var tokensYesterday sql.NullInt64
	var costYesterday sql.NullFloat64

	err = db.QueryRow(`
		SELECT 
			COALESCE(SUM(input_tokens + output_tokens), 0),
			COALESCE(SUM(cost_usd), 0.0)
		FROM events
		WHERE COALESCE(NULLIF(timestamp, ''), created_at) >= datetime('now', '-1 day', 'start of day')
		  AND COALESCE(NULLIF(timestamp, ''), created_at) <= datetime('now', '-1 day')
	`).Scan(&tokensYesterday, &costYesterday)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}

	yTokens := tokensYesterday.Int64
	yCost := costYesterday.Float64

	// Calculate percentage deltas
	if yTokens == 0 {
		if summary.TokensToday > 0 {
			summary.TokensDeltaPct = 100.0
		} else {
			summary.TokensDeltaPct = 0.0
		}
	} else {
		pct := (float64(summary.TokensToday-int(yTokens)) / float64(yTokens)) * 100.0
		summary.TokensDeltaPct = round1(pct)
	}

	if yCost == 0 {
		if summary.CostTodayUSD > 0 {
			summary.CostDeltaPct = 100.0
		} else {
			summary.CostDeltaPct = 0.0
		}
	} else {
		pct := ((summary.CostTodayUSD - yCost) / yCost) * 100.0
		summary.CostDeltaPct = round1(pct)
	}

	return &summary, nil
}

// GetTimelineBuckets returns time-series aggregated token usage and costs.
// Resolutions:
// - 24h: 1-hour buckets
// - 7d:  6-hour buckets
// - 30d: 1-day buckets
func (db *DB) GetTimelineBuckets(rangeKey string) ([]models.TimelineBucket, error) {
	var bucketExpr string
	var windowExpr string

	switch rangeKey {
	case "7d":
		bucketExpr = `strftime('%Y-%m-%d', COALESCE(NULLIF(timestamp, ''), created_at)) || 'T' || printf('%02d', (cast(strftime('%H', COALESCE(NULLIF(timestamp, ''), created_at)) AS integer) / 6) * 6) || ':00:00Z'`
		windowExpr = `datetime('now', '-7 days')`
	case "30d":
		bucketExpr = `strftime('%Y-%m-%dT00:00:00Z', COALESCE(NULLIF(timestamp, ''), created_at))`
		windowExpr = `datetime('now', '-30 days')`
	default: // 24h
		bucketExpr = `strftime('%Y-%m-%dT%H:00:00Z', COALESCE(NULLIF(timestamp, ''), created_at))`
		windowExpr = `datetime('now', '-24 hours')`
	}

	query := `
		SELECT 
			` + bucketExpr + ` AS bucket,
			COALESCE(SUM(input_tokens), 0),
			COALESCE(SUM(output_tokens), 0),
			COALESCE(SUM(cache_read_tokens), 0),
			COALESCE(SUM(cost_usd), 0.0)
		FROM events
		WHERE COALESCE(NULLIF(timestamp, ''), created_at) >= ` + windowExpr + `
		GROUP BY bucket
		ORDER BY bucket ASC
	`

	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	buckets := make([]models.TimelineBucket, 0)
	for rows.Next() {
		var b models.TimelineBucket
		if err := rows.Scan(&b.Bucket, &b.InputTokens, &b.OutputTokens, &b.CacheReadTokens, &b.CostUSD); err != nil {
			return nil, err
		}
		b.CostUSD = round4(b.CostUSD)
		buckets = append(buckets, b)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return buckets, nil
}

// BreakdownByModel returns token and cost breakdown aggregated by model.
// Sorted by cost_usd descending, computed entirely via SQL GROUP BY.
func (db *DB) BreakdownByModel(rangeKey string) ([]models.BreakdownItem, error) {
	return db.breakdownByColumn("model", rangeKey)
}

// BreakdownByAgent returns token and cost breakdown aggregated by agent.
// Sorted by cost_usd descending, computed entirely via SQL GROUP BY.
func (db *DB) BreakdownByAgent(rangeKey string) ([]models.BreakdownItem, error) {
	return db.breakdownByColumn("agent", rangeKey)
}

func (db *DB) breakdownByColumn(col string, rangeKey string) ([]models.BreakdownItem, error) {
	var windowExpr string
	switch rangeKey {
	case "7d":
		windowExpr = `datetime('now', '-7 days')`
	case "30d":
		windowExpr = `datetime('now', '-30 days')`
	default: // 24h
		windowExpr = `datetime('now', '-24 hours')`
	}

	if col != "model" && col != "agent" {
		col = "model"
	}

	query := `
		WITH totals AS (
			SELECT 
				COALESCE(NULLIF(` + col + `, ''), 'unknown') AS k,
				COALESCE(SUM(input_tokens + output_tokens), 0) AS tokens,
				COALESCE(SUM(cost_usd), 0.0) AS cost_usd,
				COUNT(*) AS events
			FROM events
			WHERE COALESCE(NULLIF(timestamp, ''), created_at) >= ` + windowExpr + `
			GROUP BY k
		),
		overall AS (
			SELECT 
				COALESCE(SUM(cost_usd), 0.0) AS total_cost,
				COALESCE(SUM(tokens), 0) AS total_tokens
			FROM totals
		)
		SELECT 
			t.k,
			t.tokens,
			t.cost_usd,
			t.events,
			CASE 
				WHEN o.total_cost > 0 THEN ROUND((t.cost_usd / o.total_cost) * 100.0, 1)
				WHEN o.total_tokens > 0 THEN ROUND((CAST(t.tokens AS REAL) / o.total_tokens) * 100.0, 1)
				ELSE 0.0
			END AS pct
		FROM totals t, overall o
		ORDER BY t.cost_usd DESC, t.tokens DESC
	`

	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]models.BreakdownItem, 0)
	for rows.Next() {
		var item models.BreakdownItem
		if err := rows.Scan(&item.Key, &item.Tokens, &item.CostUSD, &item.Events, &item.Pct); err != nil {
			return nil, err
		}
		item.CostUSD = round4(item.CostUSD)
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

// GetHeatmap returns daily aggregated token usage for the past 90 or 180 days.
// Pure SQL aggregation using DATE() and SUM(input_tokens + output_tokens).
func (db *DB) GetHeatmap(rangeKey string) ([]models.HeatmapDay, error) {
	windowExpr := `datetime('now', '-90 days')`
	if rangeKey == "180d" {
		windowExpr = `datetime('now', '-180 days')`
	}

	query := `
		SELECT 
			DATE(COALESCE(NULLIF(timestamp, ''), created_at)) AS day,
			COALESCE(SUM(input_tokens + output_tokens), 0) AS tokens
		FROM events
		WHERE COALESCE(NULLIF(timestamp, ''), created_at) >= ` + windowExpr + `
		  AND DATE(COALESCE(NULLIF(timestamp, ''), created_at)) IS NOT NULL
		GROUP BY day
		ORDER BY day ASC
	`

	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	days := make([]models.HeatmapDay, 0)
	for rows.Next() {
		var d models.HeatmapDay
		if err := rows.Scan(&d.Day, &d.Tokens); err != nil {
			return nil, err
		}
		days = append(days, d)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return days, nil
}

// GetModelStats returns comparative metrics for models within the given time window (24h, 7d, 30d).
// Pure SQL aggregation without Go row-iteration loops.
func (db *DB) GetModelStats(rangeKey string) ([]models.ModelStat, error) {
	var windowExpr string
	switch rangeKey {
	case "7d":
		windowExpr = `datetime('now', '-7 days')`
	case "30d":
		windowExpr = `datetime('now', '-30 days')`
	default: // 24h
		windowExpr = `datetime('now', '-24 hours')`
	}

	query := `
		SELECT 
			COALESCE(NULLIF(model, ''), 'unknown') AS model,
			COUNT(*) AS events,
			COALESCE(SUM(input_tokens + output_tokens), 0) AS tokens,
			COALESCE(SUM(cost_usd), 0.0) AS cost_usd,
			COALESCE(ROUND((SUM(cost_usd) / NULLIF(SUM(input_tokens + output_tokens), 0)) * 1000000.0, 4), 0.0) AS cost_per_million
		FROM events
		WHERE COALESCE(NULLIF(timestamp, ''), created_at) >= ` + windowExpr + `
		GROUP BY model
		ORDER BY cost_usd DESC, tokens DESC
	`

	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	stats := make([]models.ModelStat, 0)
	for rows.Next() {
		var s models.ModelStat
		if err := rows.Scan(&s.Model, &s.Events, &s.Tokens, &s.CostUSD, &s.CostPerMillion); err != nil {
			return nil, err
		}
		s.CostUSD = round4(s.CostUSD)
		s.CostPerMillion = round4(s.CostPerMillion)
		stats = append(stats, s)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return stats, nil
}

// GetProjectionDailyAggregates returns daily cost and token aggregates for the last 30 days.
// Pure SQL aggregation via GROUP BY DATE(timestamp).
func (db *DB) GetProjectionDailyAggregates() ([]models.ProjectionDailyAggregate, error) {
	query := `
		SELECT 
			DATE(COALESCE(NULLIF(timestamp, ''), created_at)) AS day,
			COALESCE(SUM(cost_usd), 0.0) AS cost_usd,
			COALESCE(SUM(input_tokens + output_tokens), 0) AS tokens
		FROM events
		WHERE COALESCE(NULLIF(timestamp, ''), created_at) >= datetime('now', '-30 days')
		GROUP BY day
		ORDER BY day ASC
	`

	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	points := make([]models.ProjectionDailyAggregate, 0)
	for rows.Next() {
		var p models.ProjectionDailyAggregate
		if err := rows.Scan(&p.Date, &p.CostUSD, &p.Tokens); err != nil {
			return nil, err
		}
		p.CostUSD = round4(p.CostUSD)
		points = append(points, p)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return points, nil
}

func round1(val float64) float64 {
	return math.Round(val*10) / 10
}

func round2(val float64) float64 {
	return math.Round(val*100) / 100
}

func round4(val float64) float64 {
	return math.Round(val*10000) / 10000
}
