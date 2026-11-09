package beacon

import (
	"testing"
)

func TestParseLine_Valid(t *testing.T) {
	line := []byte(`{"event_type":"agent_action","session_id":"sess-123","agent":"backend","timestamp":"2026-11-05T01:00:00Z","token_usage":{"input":100,"output":50,"cache_read":10},"model":"claude-3-5-sonnet","cost_usd":0.0025,"tool":{"name":"bash","input":{"cmd":"ls"}}}`)

	raw, err := ParseLine(line)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if raw.EventType != "agent_action" {
		t.Errorf("expected event_type agent_action, got %s", raw.EventType)
	}
	if raw.SessionID != "sess-123" {
		t.Errorf("expected session_id sess-123, got %s", raw.SessionID)
	}
	if raw.Agent != "backend" {
		t.Errorf("expected agent backend, got %s", raw.Agent)
	}
	if raw.TokenUsage.Input != 100 || raw.TokenUsage.Output != 50 || raw.TokenUsage.CacheRead != 10 {
		t.Errorf("unexpected token usage: %+v", raw.TokenUsage)
	}
	if raw.Model != "claude-3-5-sonnet" {
		t.Errorf("expected model claude-3-5-sonnet, got %s", raw.Model)
	}
	if raw.CostUSD != 0.0025 {
		t.Errorf("expected cost 0.0025, got %f", raw.CostUSD)
	}
	if raw.Tool == nil || raw.Tool.Name != "bash" {
		t.Fatalf("expected tool bash, got %+v", raw.Tool)
	}

	evt := NormalizeEvent(raw, string(line))
	if evt.ToolName != "bash" {
		t.Errorf("expected tool_name bash, got %s", evt.ToolName)
	}
	if evt.InputTokens != 100 || evt.OutputTokens != 50 {
		t.Errorf("expected tokens 100/50, got %d/%d", evt.InputTokens, evt.OutputTokens)
	}
}

func TestParseLine_Empty(t *testing.T) {
	_, err := ParseLine([]byte(""))
	if err == nil {
		t.Error("expected error on empty line, got nil")
	}

	_, err = ParseLine([]byte("   \r\n\t  "))
	if err == nil {
		t.Error("expected error on whitespace line, got nil")
	}
}

func TestParseLine_InvalidJSON(t *testing.T) {
	_, err := ParseLine([]byte("{not valid json}"))
	if err == nil {
		t.Error("expected error on invalid json, got nil")
	}
}

