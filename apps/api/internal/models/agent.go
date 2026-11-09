// Package models defines the core data structures for AgentOS.
package models

import "github.com/agentos/api/internal/agentconfig"

// AgentStats represents aggregated SQL metrics for an agent (Story 3.2).
type AgentStats struct {
	TotalTokens  int64   `json:"total_tokens"`
	TotalCostUSD float64 `json:"total_cost_usd"`
	TotalEvents  int64   `json:"total_events"`
	LastSeen     *string `json:"last_seen"`
}

// AgentDetail combines agent frontmatter config with runtime stats (Story 3.2).
type AgentDetail struct {
	Config agentconfig.AgentConfig `json:"config"`
	Stats  AgentStats              `json:"stats"`
}

