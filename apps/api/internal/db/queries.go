// Package db — SQL query helpers for AgentOS events.
package db

import (
	"database/sql"
	"time"

	"github.com/agentos/api/internal/models"
)

// InsertEvent persists a normalized event into SQLite.
func (db *DB) InsertEvent(evt *models.Event) error {
	now := time.Now().UTC().Format(time.RFC3339)
	_, err := db.Exec(`
		INSERT INTO events
			(event_type, session_id, agent, timestamp,
			 input_tokens, output_tokens, cache_read_tokens,
			 model, cost_usd, tool_name, raw_json, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		evt.EventType, evt.SessionID, evt.Agent, evt.Timestamp,
		evt.InputTokens, evt.OutputTokens, evt.CacheReadTokens,
		evt.Model, evt.CostUSD, evt.ToolName, evt.RawJSON, now,
	)
	return err
}

// LatestEvents returns the most recent N events ordered by id DESC.
func (db *DB) LatestEvents(limit int) ([]models.Event, error) {
	if limit <= 0 {
		limit = 20
	}
	rows, err := db.Query(`
		SELECT id, event_type, session_id, COALESCE(agent,''), timestamp,
		       input_tokens, output_tokens, cache_read_tokens,
		       COALESCE(model,''), cost_usd, COALESCE(tool_name,''), raw_json, created_at
		FROM events
		ORDER BY id DESC
		LIMIT ?`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []models.Event
	for rows.Next() {
		var e models.Event
		if err := rows.Scan(
			&e.ID, &e.EventType, &e.SessionID, &e.Agent, &e.Timestamp,
			&e.InputTokens, &e.OutputTokens, &e.CacheReadTokens,
			&e.Model, &e.CostUSD, &e.ToolName, &e.RawJSON, &e.CreatedAt,
		); err != nil {
			return nil, err
		}
		events = append(events, e)
	}
	return events, rows.Err()
}

// SessionSummaries returns aggregated statistics per session_id.
func (db *DB) SessionSummaries() ([]models.SessionSummary, error) {
	rows, err := db.Query(`
		SELECT session_id,
		       COUNT(*)           AS event_count,
		       SUM(cost_usd)      AS total_cost,
		       MAX(created_at)    AS last_seen,
		       COALESCE(MAX(agent),'')  AS agent
		FROM events
		GROUP BY session_id
		ORDER BY last_seen DESC
		LIMIT 100`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []models.SessionSummary
	for rows.Next() {
		var s models.SessionSummary
		if err := rows.Scan(&s.SessionID, &s.EventCount, &s.TotalCost, &s.LastSeen, &s.AgentName); err != nil {
			return nil, err
		}
		sessions = append(sessions, s)
	}
	return sessions, rows.Err()
}

// GetSessions returns aggregated metrics for the most recent sessions (limit 50).
func (db *DB) GetSessions(limit int) ([]models.SessionItem, error) {
	if limit <= 0 {
		limit = 50
	}
	rows, err := db.Query(`
		SELECT 
			session_id,
			COUNT(*) AS events,
			COALESCE(SUM(input_tokens + output_tokens), 0) AS tokens,
			COALESCE(SUM(cost_usd), 0.0) AS cost_usd,
			COALESCE(MIN(NULLIF(timestamp, '')), MIN(created_at), '') AS started_at,
			COALESCE(MAX(NULLIF(timestamp, '')), MAX(created_at), '') AS ended_at
		FROM events
		GROUP BY session_id
		ORDER BY started_at DESC
		LIMIT ?`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	sessions := make([]models.SessionItem, 0)
	for rows.Next() {
		var s models.SessionItem
		if err := rows.Scan(&s.SessionID, &s.Events, &s.Tokens, &s.CostUSD, &s.StartedAt, &s.EndedAt); err != nil {
			return nil, err
		}
		s.CostUSD = round4(s.CostUSD)
		sessions = append(sessions, s)
	}
	return sessions, rows.Err()
}

// GetSessionEvents retrieves chronological events for a specific session ID.
func (db *DB) GetSessionEvents(sessionID string) ([]models.SessionDetailEvent, error) {
	rows, err := db.Query(`
		SELECT 
			id,
			event_type,
			COALESCE(agent, '') AS agent,
			COALESCE(model, '') AS model,
			COALESCE(tool_name, '') AS tool_name,
			COALESCE(input_tokens, 0) AS token_usage_input,
			COALESCE(output_tokens, 0) AS token_usage_output,
			COALESCE(cache_read_tokens, 0) AS token_usage_cache_read,
			COALESCE(cost_usd, 0.0) AS cost_usd,
			COALESCE(NULLIF(timestamp, ''), created_at) AS timestamp
		FROM events
		WHERE session_id = ?
		ORDER BY timestamp ASC, id ASC`, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	events := make([]models.SessionDetailEvent, 0)
	for rows.Next() {
		var e models.SessionDetailEvent
		if err := rows.Scan(
			&e.ID,
			&e.EventType,
			&e.Agent,
			&e.Model,
			&e.ToolName,
			&e.TokenUsageInput,
			&e.TokenUsageOutput,
			&e.TokenUsageCacheRead,
			&e.CostUSD,
			&e.Timestamp,
		); err != nil {
			return nil, err
		}
		e.CostUSD = round4(e.CostUSD)
		events = append(events, e)
	}
	return events, rows.Err()
}

// AgentStats aggregates total tokens, cost, event count, and latest timestamp for an agent in SQL (Story 3.2).
func (db *DB) AgentStats(agentName string) (models.AgentStats, error) {
	var (
		totalTokens  int64
		totalCostUSD float64
		totalEvents  int64
		lastSeen     sql.NullString
	)

	row := db.QueryRow(`
		SELECT
			COALESCE(SUM(input_tokens + output_tokens), 0),
			COALESCE(SUM(cost_usd), 0),
			COUNT(*),
			MAX(timestamp)
		FROM events
		WHERE agent = ?`, agentName)

	if err := row.Scan(&totalTokens, &totalCostUSD, &totalEvents, &lastSeen); err != nil {
		return models.AgentStats{}, err
	}

	var lastSeenPtr *string
	if lastSeen.Valid && lastSeen.String != "" {
		val := lastSeen.String
		lastSeenPtr = &val
	}

	return models.AgentStats{
		TotalTokens:  totalTokens,
		TotalCostUSD: round4(totalCostUSD),
		TotalEvents:  totalEvents,
		LastSeen:     lastSeenPtr,
	}, nil
}


