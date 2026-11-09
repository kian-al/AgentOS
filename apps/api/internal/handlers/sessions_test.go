package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/agentos/api/internal/db"
	"github.com/agentos/api/internal/models"
	"github.com/go-chi/chi/v5"
)

func TestSessionsHandler_List(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "agentos-sessions-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	dbPath := filepath.Join(tmpDir, "test.db")
	database, err := db.Init(dbPath)
	if err != nil {
		t.Fatalf("failed to init db: %v", err)
	}
	defer database.Close()

	h := &SessionsHandler{DB: database}

	// 1. Test empty db
	reqEmpty := httptest.NewRequest(http.MethodGet, "/api/sessions", nil)
	rrEmpty := httptest.NewRecorder()
	h.List(rrEmpty, reqEmpty)

	if rrEmpty.Code != http.StatusOK {
		t.Fatalf("expected 200 on empty db, got %d", rrEmpty.Code)
	}
	var emptySessions []models.SessionItem
	if err := json.Unmarshal(rrEmpty.Body.Bytes(), &emptySessions); err != nil {
		t.Fatalf("failed to unmarshal JSON: %v", err)
	}
	if len(emptySessions) != 0 {
		t.Errorf("expected 0 sessions, got %d", len(emptySessions))
	}

	// 2. Seed events across two sessions
	now := time.Now().UTC()
	events := []*models.Event{
		{
			ID:           1,
			EventType:    "tool_use",
			SessionID:    "sess_alpha",
			Agent:        "agentOS-architect",
			Model:        "claude-opus-4",
			ToolName:     "read_file",
			InputTokens:  1000,
			OutputTokens: 500,
			CostUSD:      0.05,
			Timestamp:    now.Add(-2 * time.Hour).Format(time.RFC3339),
			CreatedAt:    now.Add(-2 * time.Hour).Format(time.RFC3339),
		},
		{
			ID:           2,
			EventType:    "agent_turn",
			SessionID:    "sess_alpha",
			Agent:        "agentOS-architect",
			Model:        "claude-opus-4",
			InputTokens:  2000,
			OutputTokens: 1000,
			CostUSD:      0.10,
			Timestamp:    now.Add(-1 * time.Hour).Format(time.RFC3339),
			CreatedAt:    now.Add(-1 * time.Hour).Format(time.RFC3339),
		},
		{
			ID:           3,
			EventType:    "session_start",
			SessionID:    "sess_beta",
			Agent:        "agentOS-frontend",
			Model:        "claude-sonnet-4",
			InputTokens:  500,
			OutputTokens: 200,
			CostUSD:      0.02,
			Timestamp:    now.Format(time.RFC3339),
			CreatedAt:    now.Format(time.RFC3339),
		},
	}

	for _, evt := range events {
		if err := database.InsertEvent(evt); err != nil {
			t.Fatalf("failed to insert event: %v", err)
		}
	}

	// 3. Test list endpoint
	req := httptest.NewRequest(http.MethodGet, "/api/sessions", nil)
	rr := httptest.NewRecorder()
	h.List(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	var sessions []models.SessionItem
	if err := json.Unmarshal(rr.Body.Bytes(), &sessions); err != nil {
		t.Fatalf("failed to parse JSON: %v", err)
	}

	if len(sessions) != 2 {
		t.Fatalf("expected 2 sessions, got %d", len(sessions))
	}

	// Find sess_alpha
	var alpha *models.SessionItem
	for i := range sessions {
		if sessions[i].SessionID == "sess_alpha" {
			alpha = &sessions[i]
		}
	}

	if alpha == nil {
		t.Fatalf("expected to find sess_alpha in sessions")
	}
	if alpha.Events != 2 {
		t.Errorf("expected 2 events for sess_alpha, got %d", alpha.Events)
	}
	if alpha.Tokens != 4500 {
		t.Errorf("expected 4500 tokens for sess_alpha (1000+500 + 2000+1000), got %d", alpha.Tokens)
	}
	if alpha.CostUSD != 0.15 {
		t.Errorf("expected 0.15 cost for sess_alpha, got %.2f", alpha.CostUSD)
	}
}

func TestSessionsHandler_Events(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "agentos-sessions-events-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	dbPath := filepath.Join(tmpDir, "test.db")
	database, err := db.Init(dbPath)
	if err != nil {
		t.Fatalf("failed to init db: %v", err)
	}
	defer database.Close()

	h := &SessionsHandler{DB: database}

	// 1. Seed events for sess_drilldown
	now := time.Now().UTC()
	err = database.InsertEvent(&models.Event{
		ID:              1,
		EventType:       "tool_use",
		SessionID:       "sess_drilldown",
		Agent:           "agentOS-backend",
		Model:           "claude-opus-4",
		ToolName:        "exec_cmd",
		InputTokens:     3000,
		OutputTokens:    1200,
		CacheReadTokens: 800,
		CostUSD:         0.12,
		Timestamp:       now.Format(time.RFC3339),
		CreatedAt:       now.Format(time.RFC3339),
	})
	if err != nil {
		t.Fatalf("failed to insert event: %v", err)
	}

	// 2. Test valid session retrieval via chi URL param
	req := httptest.NewRequest(http.MethodGet, "/api/sessions/sess_drilldown/events", nil)
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("session_id", "sess_drilldown")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	rr := httptest.NewRecorder()
	h.Events(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var detailEvents []models.SessionDetailEvent
	if err := json.Unmarshal(rr.Body.Bytes(), &detailEvents); err != nil {
		t.Fatalf("failed to parse JSON: %v", err)
	}

	if len(detailEvents) != 1 {
		t.Fatalf("expected 1 event, got %d", len(detailEvents))
	}
	e := detailEvents[0]
	if e.EventType != "tool_use" || e.Agent != "agentOS-backend" || e.ToolName != "exec_cmd" {
		t.Errorf("unexpected event attributes: %+v", e)
	}
	if e.TokenUsageInput != 3000 || e.TokenUsageOutput != 1200 || e.TokenUsageCacheRead != 800 {
		t.Errorf("unexpected token usage: %+v", e)
	}

	// 3. Test 404 on non-existent session
	req404 := httptest.NewRequest(http.MethodGet, "/api/sessions/sess_nonexistent/events", nil)
	rctx404 := chi.NewRouteContext()
	rctx404.URLParams.Add("session_id", "sess_nonexistent")
	req404 = req404.WithContext(context.WithValue(req404.Context(), chi.RouteCtxKey, rctx404))

	rr404 := httptest.NewRecorder()
	h.Events(rr404, req404)

	if rr404.Code != http.StatusNotFound {
		t.Errorf("expected 404 for non-existent session, got %d", rr404.Code)
	}

	// 4. Test 400 on invalid session ID (SEC-02 parameter allowlist validation)
	invalidIDs := []string{
		"abc", // too short (<4)
		"sess' OR 1=1--",
		"sess;DROP TABLE events;--",
		"sess<script>",
	}
	for _, badID := range invalidIDs {
		reqBad := httptest.NewRequest(http.MethodGet, "/api/sessions/check/events", nil)
		rctxBad := chi.NewRouteContext()
		rctxBad.URLParams.Add("session_id", badID)
		reqBad = reqBad.WithContext(context.WithValue(reqBad.Context(), chi.RouteCtxKey, rctxBad))

		rrBad := httptest.NewRecorder()
		h.Events(rrBad, reqBad)

		if rrBad.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for malicious/invalid session_id '%s', got %d", badID, rrBad.Code)
		}
	}
}

