// Package handlers — metrics HTTP endpoints.
package handlers

import (
	"encoding/json"
	"math"
	"net/http"

	"github.com/agentos/api/internal/db"
	"github.com/agentos/api/internal/models"
)

// MetricsHandler handles metric queries.
type MetricsHandler struct {
	DB *db.DB
}

// Summary handles GET /api/metrics/summary.
// Returns tokens_today, cost_today_usd, active_sessions, agents_seen, events_total, and deltas.
func (h *MetricsHandler) Summary(w http.ResponseWriter, r *http.Request) {
	summary, err := h.DB.MetricsSummary()
	if err != nil {
		http.Error(w, `{"error":"failed to compute metrics summary"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(summary)
}

// Timeline handles GET /api/metrics/timeline?range=24h|7d|30d.
// Returns time-series aggregated token usage and costs.
func (h *MetricsHandler) Timeline(w http.ResponseWriter, r *http.Request) {
	rangeParam, err := ValidateRange(r.URL.Query().Get("range"), "24h")
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	buckets, err := h.DB.GetTimelineBuckets(rangeParam)
	if err != nil {
		http.Error(w, `{"error":"failed to compute timeline metrics"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(buckets)
}

// Breakdown handles GET /api/metrics/breakdown?by=model|agent&range=24h|7d|30d.
// Returns breakdown aggregated by model or agent sorted by cost_usd descending.
func (h *MetricsHandler) Breakdown(w http.ResponseWriter, r *http.Request) {
	by, err := ValidateBreakdownBy(r.URL.Query().Get("by"))
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	rangeParam, err := ValidateRange(r.URL.Query().Get("range"), "24h")
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	var items []models.BreakdownItem

	if by == "agent" {
		items, err = h.DB.BreakdownByAgent(rangeParam)
	} else {
		items, err = h.DB.BreakdownByModel(rangeParam)
	}

	if err != nil {
		http.Error(w, `{"error":"failed to compute breakdown metrics"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(items)
}

// Heatmap handles GET /api/metrics/heatmap?range=90d|180d.
// Returns daily token sums for calendar heatmap rendering.
func (h *MetricsHandler) Heatmap(w http.ResponseWriter, r *http.Request) {
	rangeParam, err := ValidateRange(r.URL.Query().Get("range"), "90d")
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	days, err := h.DB.GetHeatmap(rangeParam)
	if err != nil {
		http.Error(w, `{"error":"failed to compute heatmap metrics"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(days)
}

// Models handles GET /api/metrics/models?range=24h|7d|30d.
// Returns comparative metrics for all models sorted by cost descending.
func (h *MetricsHandler) Models(w http.ResponseWriter, r *http.Request) {
	rangeParam, err := ValidateRange(r.URL.Query().Get("range"), "24h")
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	stats, err := h.DB.GetModelStats(rangeParam)
	if err != nil {
		http.Error(w, `{"error":"failed to compute model comparison metrics"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(stats)
}

// Projection handles GET /api/metrics/projection.
// Fetches daily cost aggregates over the last 30 days via SQL, then executes
// linear regression in Go to calculate monthly spend forecast and confidence.
func (h *MetricsHandler) Projection(w http.ResponseWriter, r *http.Request) {
	dailyPoints, err := h.DB.GetProjectionDailyAggregates()
	if err != nil {
		http.Error(w, `{"error":"failed to compute projection metrics"}`, http.StatusInternalServerError)
		return
	}

	result := ComputeProjection(dailyPoints)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

// ComputeProjection executes linear regression slope (least-squares) on daily cost aggregates.
func ComputeProjection(points []models.ProjectionDailyAggregate) models.ProjectionResult {
	n := len(points)
	if n == 0 {
		return models.ProjectionResult{
			DailyAvgUSD:          0,
			TrendSlope:           0,
			ProjectedMonthUSD:    0,
			ProjectedMonthTokens: 0,
			Confidence:           "low",
			DataPoints:           0,
			History:              []models.ProjectionDailyAggregate{},
		}
	}

	var sumCost float64
	var sumTokens int64
	for _, p := range points {
		sumCost += p.CostUSD
		sumTokens += p.Tokens
	}

	dailyAvgCost := sumCost / float64(n)
	dailyAvgTokens := float64(sumTokens) / float64(n)

	var slope float64
	if n >= 2 {
		meanX := float64(n-1) / 2.0
		meanY := dailyAvgCost

		var numerator float64
		var denominator float64
		for i, p := range points {
			xDiff := float64(i) - meanX
			yDiff := p.CostUSD - meanY
			numerator += xDiff * yDiff
			denominator += xDiff * xDiff
		}

		if denominator != 0 {
			slope = numerator / denominator
		}
	}

	// Determine confidence level:
	// "low" if < 7 data points, "medium" if 7–20, "high" if > 20.
	confidence := "low"
	if n > 20 {
		confidence = "high"
	} else if n >= 7 {
		confidence = "medium"
	}

	// Projected monthly spend:
	// Based on 30-day projection with linear trend adjustment.
	projectedMonthCost := math.Max(0, (dailyAvgCost * 30.0) + (slope * 50.0))
	projectedMonthTokens := int64(math.Max(0, math.Round(dailyAvgTokens * 30.0)))

	return models.ProjectionResult{
		DailyAvgUSD:          math.Round(dailyAvgCost*100) / 100,
		TrendSlope:           math.Round(slope*10000) / 10000,
		ProjectedMonthUSD:    math.Round(projectedMonthCost*100) / 100,
		ProjectedMonthTokens: projectedMonthTokens,
		Confidence:           confidence,
		DataPoints:           n,
		History:              points,
	}
}



