// Package models — metrics data models.
package models

// MetricsSummary represents aggregate KPI values and delta percentages.
type MetricsSummary struct {
	TokensToday    int     `json:"tokens_today"`
	CostTodayUSD   float64 `json:"cost_today_usd"`
	ActiveSessions int     `json:"active_sessions"`
	AgentsSeen     int     `json:"agents_seen"`
	EventsTotal    int     `json:"events_total"`
	TokensDeltaPct float64 `json:"tokens_delta_pct"`
	CostDeltaPct   float64 `json:"cost_delta_pct"`
}

// TimelineBucket represents aggregated token counts and costs within a time window.
type TimelineBucket struct {
	Bucket          string  `json:"bucket"`
	InputTokens     int64   `json:"input_tokens"`
	OutputTokens    int64   `json:"output_tokens"`
	CacheReadTokens int64   `json:"cache_read_tokens"`
	CostUSD         float64 `json:"cost_usd"`
}

// BreakdownItem represents an aggregated metric entity grouped by model or agent.
type BreakdownItem struct {
	Key     string  `json:"key"`
	Tokens  int64   `json:"tokens"`
	CostUSD float64 `json:"cost_usd"`
	Events  int     `json:"events"`
	Pct     float64 `json:"pct"`
}

// HeatmapDay represents aggregate token volume for a single calendar day.
type HeatmapDay struct {
	Day    string `json:"day"`
	Tokens int64  `json:"tokens"`
}

// ModelStat represents comparative metrics for an individual LLM model.
type ModelStat struct {
	Model          string  `json:"model"`
	Events         int     `json:"events"`
	Tokens         int64   `json:"tokens"`
	CostUSD        float64 `json:"cost_usd"`
	CostPerMillion float64 `json:"cost_per_million"`
}

// ProjectionDailyAggregate represents daily cost and token aggregates fetched from SQL.
type ProjectionDailyAggregate struct {
	Date    string  `json:"date"`
	CostUSD float64 `json:"cost_usd"`
	Tokens  int64   `json:"tokens"`
}

// ProjectionResult represents the linear regression forecast for monthly spending.
type ProjectionResult struct {
	DailyAvgUSD          float64                    `json:"daily_avg_usd"`
	TrendSlope           float64                    `json:"trend_slope"`
	ProjectedMonthUSD    float64                    `json:"projected_month_usd"`
	ProjectedMonthTokens int64                      `json:"projected_month_tokens"`
	Confidence           string                     `json:"confidence"`
	DataPoints           int                        `json:"data_points"`
	History              []ProjectionDailyAggregate `json:"history,omitempty"`
}





