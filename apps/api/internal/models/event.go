// Package models defines the core data structures for AgentOS.
package models

// RawEvent is the raw JSONL line from the Beacon telemetry source.
// Schema: ~/.beacon/endpoint/logs/runtime.jsonl
type RawEvent struct {
	EventType  string     `json:"event_type"`
	SessionID  string     `json:"session_id"`
	Agent      string     `json:"agent"`
	Timestamp  string     `json:"timestamp"`
	TokenUsage TokenUsage `json:"token_usage"`
	Model      string     `json:"model"`
	CostUSD    float64    `json:"cost_usd"`
	Tool       *ToolInfo  `json:"tool,omitempty"`
}

// TokenUsage represents per-event token counts.
type TokenUsage struct {
	Input     int `json:"input"`
	Output    int `json:"output"`
	CacheRead int `json:"cache_read"`
}

// ToolInfo represents an optional tool call embedded in an event.
type ToolInfo struct {
	Name  string `json:"name"`
	Input any    `json:"input"`
}

// Event is the normalized AgentOS event as stored in SQLite.
type Event struct {
	ID               int64   `json:"id"`
	EventType        string  `json:"event_type"`
	SessionID        string  `json:"session_id"`
	Agent            string  `json:"agent,omitempty"`
	Timestamp        string  `json:"timestamp"`
	InputTokens      int     `json:"input_tokens"`
	OutputTokens     int     `json:"output_tokens"`
	CacheReadTokens  int     `json:"cache_read_tokens"`
	Model            string  `json:"model,omitempty"`
	CostUSD          float64 `json:"cost_usd"`
	ToolName         string  `json:"tool_name,omitempty"`
	RawJSON          string  `json:"raw_json"`
	CreatedAt        string  `json:"created_at"`
}

// SessionSummary is a lightweight summary per session_id.
type SessionSummary struct {
	SessionID   string  `json:"session_id"`
	EventCount  int     `json:"event_count"`
	TotalCost   float64 `json:"total_cost_usd"`
	LastSeen    string  `json:"last_seen"`
	AgentName   string  `json:"agent,omitempty"`
}

// SessionItem represents aggregated metrics for a single session (Story 2.4).
type SessionItem struct {
	SessionID string  `json:"session_id"`
	Events    int     `json:"events"`
	Tokens    int64   `json:"tokens"`
	CostUSD   float64 `json:"cost_usd"`
	StartedAt string  `json:"started_at"`
	EndedAt   string  `json:"ended_at"`
}

// SessionDetailEvent represents an individual event within a session drilldown.
type SessionDetailEvent struct {
	ID                  int64   `json:"id"`
	EventType           string  `json:"event_type"`
	Agent               string  `json:"agent"`
	Model               string  `json:"model"`
	ToolName            string  `json:"tool_name"`
	TokenUsageInput     int     `json:"token_usage_input"`
	TokenUsageOutput    int     `json:"token_usage_output"`
	TokenUsageCacheRead int     `json:"token_usage_cache_read"`
	CostUSD             float64 `json:"cost_usd"`
	Timestamp           string  `json:"timestamp"`
}


