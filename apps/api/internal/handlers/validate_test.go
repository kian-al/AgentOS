package handlers

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestValidateParams(t *testing.T) {
	// 1. Test SessionID validation (SEC-02: ^[a-zA-Z0-9_\-]{4,128}$)
	validIDs := []string{
		"sess_1234",
		"session-abc-def",
		"SESS_ABC_123",
		"0000",
		strings.Repeat("a", 128),
	}
	for _, id := range validIDs {
		if err := ValidateSessionID(id); err != nil {
			t.Errorf("expected valid session_id '%s', got error: %v", id, err)
		}
	}

	invalidIDs := []string{
		"",
		"a",
		"abc",
		strings.Repeat("a", 129),
		"sess;DROP TABLE events;--",
		"sess' OR 1=1--",
		"sess<script>",
		"sess id with spaces",
		"sess/with/slashes",
	}
	for _, id := range invalidIDs {
		if err := ValidateSessionID(id); err == nil {
			t.Errorf("expected error for invalid session_id '%s', got nil", id)
		}
	}

	// 2. Test Range validation (SEC-02 extended)
	validRanges := []string{"24h", "7d", "30d", "90d", "180d"}
	for _, vr := range validRanges {
		r, err := ValidateRange(vr, "24h")
		if err != nil || r != vr {
			t.Errorf("expected range '%s' to be valid, got '%s', err: %v", vr, r, err)
		}
	}

	// Empty range returns default
	rDef, err := ValidateRange("", "24h")
	if err != nil || rDef != "24h" {
		t.Errorf("expected empty range to return default '24h', got '%s', err: %v", rDef, err)
	}

	invalidRanges := []string{"1h", "12h", "1y", "all", "24h; DROP TABLE", "999d"}
	for _, ir := range invalidRanges {
		if _, err := ValidateRange(ir, "24h"); err == nil {
			t.Errorf("expected error for invalid range '%s', got nil", ir)
		}
	}

	// 3. Test Breakdown by validation (SEC-02 extended)
	byModel, err := ValidateBreakdownBy("model")
	if err != nil || byModel != "model" {
		t.Errorf("expected 'model' to be valid, got '%s', err: %v", byModel, err)
	}
	byAgent, err := ValidateBreakdownBy("agent")
	if err != nil || byAgent != "agent" {
		t.Errorf("expected 'agent' to be valid, got '%s', err: %v", byAgent, err)
	}
	byEmpty, err := ValidateBreakdownBy("")
	if err != nil || byEmpty != "model" {
		t.Errorf("expected empty by to default to 'model', got '%s', err: %v", byEmpty, err)
	}

	invalidBys := []string{"user", "tool", "session", "model;--", "DROP"}
	for _, ib := range invalidBys {
		if _, err := ValidateBreakdownBy(ib); err == nil {
			t.Errorf("expected error for invalid by '%s', got nil", ib)
		}
	}

	// 4. Test ValidateParams on HTTP requests
	validReq := httptest.NewRequest(http.MethodGet, "/api/metrics/breakdown?by=agent&range=7d", nil)
	if err := ValidateParams(validReq); err != nil {
		t.Errorf("expected valid request params to pass, got error: %v", err)
	}

	invalidReqRange := httptest.NewRequest(http.MethodGet, "/api/metrics/breakdown?range=invalid", nil)
	if err := ValidateParams(invalidReqRange); err == nil {
		t.Errorf("expected invalid range in request to fail, got nil")
	}

	invalidReqBy := httptest.NewRequest(http.MethodGet, "/api/metrics/breakdown?by=malicious", nil)
	if err := ValidateParams(invalidReqBy); err == nil {
		t.Errorf("expected invalid by in request to fail, got nil")
	}

	// 5. Test AgentName validation (SEC-02: ^[a-zA-Z0-9_\-]{2,128}$)
	validAgentNames := []string{
		"agent-alpha",
		"agentOS-architect",
		"agent_42",
		"ab",
		strings.Repeat("x", 128),
	}
	for _, name := range validAgentNames {
		if err := ValidateAgentName(name); err != nil {
			t.Errorf("expected valid agent name '%s', got error: %v", name, err)
		}
	}

	invalidAgentNames := []string{
		"",
		"a",
		strings.Repeat("a", 129),
		"agent;DROP TABLE",
		"agent<script>",
		"agent with spaces",
		"../path/traversal",
		"agent/sub",
	}
	for _, name := range invalidAgentNames {
		if err := ValidateAgentName(name); err == nil {
			t.Errorf("expected error for invalid agent name '%s', got nil", name)
		}
	}
}

