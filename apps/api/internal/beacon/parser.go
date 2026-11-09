// Package beacon provides JSONL parsing for the Agent Beacon telemetry format.
package beacon

import (
	"encoding/json"
	"fmt"

	"github.com/agentos/api/internal/models"
)

// ParseLine parses a single JSONL line into a RawEvent.
// Returns an error if the line is empty, whitespace-only, or invalid JSON.
// A parse error does NOT crash the watcher — callers should log and continue.
func ParseLine(line []byte) (*models.RawEvent, error) {
	if len(line) == 0 {
		return nil, fmt.Errorf("empty line")
	}

	// Trim whitespace
	trimmed := line
	for len(trimmed) > 0 && (trimmed[0] == ' ' || trimmed[0] == '\t' || trimmed[0] == '\r' || trimmed[0] == '\n') {
		trimmed = trimmed[1:]
	}
	if len(trimmed) == 0 {
		return nil, fmt.Errorf("blank line")
	}

	var evt models.RawEvent
	if err := json.Unmarshal(trimmed, &evt); err != nil {
		return nil, fmt.Errorf("json unmarshal: %w", err)
	}

	// Require at minimum an event_type
	if evt.EventType == "" {
		evt.EventType = "unknown"
	}
	// Require a session_id
	if evt.SessionID == "" {
		evt.SessionID = "default"
	}

	return &evt, nil
}

// NormalizeEvent converts a RawEvent into a models.Event ready for DB insertion.
// rawJSON is the original JSON bytes for audit purposes.
func NormalizeEvent(raw *models.RawEvent, rawJSON string) *models.Event {
	toolName := ""
	if raw.Tool != nil {
		toolName = raw.Tool.Name
	}
	return &models.Event{
		EventType:       raw.EventType,
		SessionID:       raw.SessionID,
		Agent:           raw.Agent,
		Timestamp:       raw.Timestamp,
		InputTokens:     raw.TokenUsage.Input,
		OutputTokens:    raw.TokenUsage.Output,
		CacheReadTokens: raw.TokenUsage.CacheRead,
		Model:           raw.Model,
		CostUSD:         raw.CostUSD,
		ToolName:        toolName,
		RawJSON:         rawJSON,
	}
}

