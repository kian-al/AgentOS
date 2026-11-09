package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/agentos/api/internal/agentconfig"
	"github.com/agentos/api/internal/db"
	"github.com/agentos/api/internal/models"
	"github.com/go-chi/chi/v5"
)

func TestAgentsHandler(t *testing.T) {
	tempDir := t.TempDir()

	// Create test agent file
	agent1 := `---
name: agent-alpha
description: Primary testing agent
tools: Read, Write, Bash
---
System instructions`
	if err := os.WriteFile(filepath.Join(tempDir, "agent-alpha.md"), []byte(agent1), 0644); err != nil {
		t.Fatalf("failed to write test agent: %v", err)
	}

	handler := NewAgentsHandler(tempDir)

	t.Run("returns 200 and list of agents", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/agents", nil)
		rec := httptest.NewRecorder()

		handler.ListAgents(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected status 200, got %d", rec.Code)
		}

		contentType := rec.Header().Get("Content-Type")
		if contentType != "application/json" {
			t.Errorf("expected Content-Type application/json, got %s", contentType)
		}

		var agents []agentconfig.AgentConfig
		if err := json.NewDecoder(rec.Body).Decode(&agents); err != nil {
			t.Fatalf("failed to decode json response: %v", err)
		}

		if len(agents) != 1 {
			t.Fatalf("expected 1 agent, got %d", len(agents))
		}

		if agents[0].Name != "agent-alpha" {
			t.Errorf("expected name 'agent-alpha', got '%s'", agents[0].Name)
		}
		if len(agents[0].Tools) != 3 {
			t.Errorf("expected 3 tools, got %d", len(agents[0].Tools))
		}
	})

	t.Run("supports refresh=true query parameter", func(t *testing.T) {
		// Add second agent
		agent2 := `---
name: agent-beta
description: Secondary agent added dynamically
tools: Glob, LS
---
Instructions`
		if err := os.WriteFile(filepath.Join(tempDir, "agent-beta.md"), []byte(agent2), 0644); err != nil {
			t.Fatalf("failed to write second agent: %v", err)
		}

		// Request without refresh will hit cache (1 agent)
		reqCached := httptest.NewRequest(http.MethodGet, "/api/agents", nil)
		recCached := httptest.NewRecorder()
		handler.ListAgents(recCached, reqCached)

		var cachedAgents []agentconfig.AgentConfig
		if err := json.NewDecoder(recCached.Body).Decode(&cachedAgents); err != nil {
			t.Fatalf("failed to decode cached json: %v", err)
		}
		if len(cachedAgents) != 1 {
			t.Errorf("expected cached count 1, got %d", len(cachedAgents))
		}

		// Request with refresh=true forces scan (2 agents)
		reqRefresh := httptest.NewRequest(http.MethodGet, "/api/agents?refresh=true", nil)
		recRefresh := httptest.NewRecorder()
		handler.ListAgents(recRefresh, reqRefresh)

		if recRefresh.Code != http.StatusOK {
			t.Fatalf("expected status 200 on refresh, got %d", recRefresh.Code)
		}

		var refreshedAgents []agentconfig.AgentConfig
		if err := json.NewDecoder(recRefresh.Body).Decode(&refreshedAgents); err != nil {
			t.Fatalf("failed to decode refreshed json: %v", err)
		}
		if len(refreshedAgents) != 2 {
			t.Errorf("expected refreshed count 2, got %d", len(refreshedAgents))
		}
	})

	t.Run("returns empty array for missing directory", func(t *testing.T) {
		emptyHandler := NewAgentsHandler(filepath.Join(tempDir, "empty-dir"))
		req := httptest.NewRequest(http.MethodGet, "/api/agents", nil)
		rec := httptest.NewRecorder()

		emptyHandler.ListAgents(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected status 200, got %d", rec.Code)
		}

		var agents []agentconfig.AgentConfig
		if err := json.NewDecoder(rec.Body).Decode(&agents); err != nil {
			t.Fatalf("failed to decode json: %v", err)
		}
		if len(agents) != 0 {
			t.Errorf("expected 0 agents, got %d", len(agents))
		}
	})
}

func TestAgentsHandler_Detail(t *testing.T) {
	tempDir := t.TempDir()

	// 1. Set up temporary SQLite database
	dbPath := filepath.Join(tempDir, "test.db")
	database, err := db.Init(dbPath)
	if err != nil {
		t.Fatalf("failed to init test database: %v", err)
	}
	defer database.Close()

	// 2. Write test agent config markdown file
	agentAlphaContent := `---
name: agent-alpha
description: Core autonomous agent
tools: Read, Write, Bash
---
Agent body instructions`
	if err := os.WriteFile(filepath.Join(tempDir, "agent-alpha.md"), []byte(agentAlphaContent), 0644); err != nil {
		t.Fatalf("failed to write test agent file: %v", err)
	}

	// 3. Seed telemetry events for agent-alpha
	now := "2026-11-07T12:04:00Z"
	earlier := "2026-11-07T10:00:00Z"

	evt1 := &models.Event{
		EventType:       "message",
		SessionID:       "sess-001",
		Agent:           "agent-alpha",
		Timestamp:       earlier,
		InputTokens:     40000,
		OutputTokens:    10000,
		CacheReadTokens: 5000,
		Model:           "claude-3-7-sonnet",
		CostUSD:         0.5000,
		CreatedAt:       earlier,
	}
	evt2 := &models.Event{
		EventType:       "tool_use",
		SessionID:       "sess-001",
		Agent:           "agent-alpha",
		Timestamp:       now,
		InputTokens:     60000,
		OutputTokens:    31635,
		CacheReadTokens: 10000,
		Model:           "claude-3-7-sonnet",
		CostUSD:         1.1605,
		ToolName:        "Bash",
		CreatedAt:       now,
	}
	if err := database.InsertEvent(evt1); err != nil {
		t.Fatalf("failed to insert event 1: %v", err)
	}
	if err := database.InsertEvent(evt2); err != nil {
		t.Fatalf("failed to insert event 2: %v", err)
	}

	handler := NewAgentsHandler(tempDir, database)

	// Subtest 1: Valid existing agent with aggregated SQL stats
	t.Run("valid existing agent with stats aggregation", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/agents/agent-alpha", nil)
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("name", "agent-alpha")
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		rec := httptest.NewRecorder()
		handler.GetAgent(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected status 200, got %d. Body: %s", rec.Code, rec.Body.String())
		}

		var detail models.AgentDetail
		if err := json.NewDecoder(rec.Body).Decode(&detail); err != nil {
			t.Fatalf("failed to decode detail response: %v", err)
		}

		// Verify config
		if detail.Config.Name != "agent-alpha" {
			t.Errorf("expected config name 'agent-alpha', got '%s'", detail.Config.Name)
		}
		if detail.Config.Description != "Core autonomous agent" {
			t.Errorf("expected description 'Core autonomous agent', got '%s'", detail.Config.Description)
		}
		if len(detail.Config.Tools) != 3 {
			t.Errorf("expected 3 tools, got %d", len(detail.Config.Tools))
		}

		// Verify aggregated stats
		expectedTokens := int64(40000 + 10000 + 60000 + 31635) // 141635
		if detail.Stats.TotalTokens != expectedTokens {
			t.Errorf("expected TotalTokens %d, got %d", expectedTokens, detail.Stats.TotalTokens)
		}
		expectedCost := 1.6605
		if detail.Stats.TotalCostUSD != expectedCost {
			t.Errorf("expected TotalCostUSD %.4f, got %.4f", expectedCost, detail.Stats.TotalCostUSD)
		}
		if detail.Stats.TotalEvents != 2 {
			t.Errorf("expected TotalEvents 2, got %d", detail.Stats.TotalEvents)
		}
		if detail.Stats.LastSeen == nil || *detail.Stats.LastSeen != now {
			t.Errorf("expected LastSeen '%s', got '%v'", now, detail.Stats.LastSeen)
		}
	})

	// Subtest 2: 404 unknown agent
	t.Run("returns 404 for unknown agent", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/agents/non-existent-agent", nil)
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("name", "non-existent-agent")
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		rec := httptest.NewRecorder()
		handler.GetAgent(rec, req)

		if rec.Code != http.StatusNotFound {
			t.Fatalf("expected status 404, got %d", rec.Code)
		}

		var errResp map[string]string
		if err := json.NewDecoder(rec.Body).Decode(&errResp); err != nil {
			t.Fatalf("failed to decode error response: %v", err)
		}
		if errResp["error"] != "agent not found" {
			t.Errorf("expected 'agent not found', got '%s'", errResp["error"])
		}
	})

	// Subtest 3: 400 invalid name (fails regex allowlist)
	t.Run("returns 400 for invalid agent name", func(t *testing.T) {
		invalidNames := []string{"bad@name!", "a", "agent/traversal", "agent;DROP"}
		for _, invalidName := range invalidNames {
			req := httptest.NewRequest(http.MethodGet, "/api/agents/"+invalidName, nil)
			rctx := chi.NewRouteContext()
			rctx.URLParams.Add("name", invalidName)
			req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

			rec := httptest.NewRecorder()
			handler.GetAgent(rec, req)

			if rec.Code != http.StatusBadRequest {
				t.Errorf("expected status 400 for name '%s', got %d", invalidName, rec.Code)
			}
		}
	})
}

func TestAgentsHandler_Update(t *testing.T) {
	tempDir := t.TempDir()

	bodyContent := "# System Prompt\nThis is the original body content that MUST be preserved.\nLine 2 of prompt."
	agentFileContent := "---\nname: test-agent\ndescription: Original description\ntools:\n  - Read\n  - Bash\n---\n" + bodyContent

	filePath := filepath.Join(tempDir, "test-agent.md")
	if err := os.WriteFile(filePath, []byte(agentFileContent), 0644); err != nil {
		t.Fatalf("failed to write test agent file: %v", err)
	}

	handler := NewAgentsHandler(tempDir, nil)

	// Subtest 1: Successful update returns updated config and preserves body
	t.Run("successful update returns updated config and preserves body", func(t *testing.T) {
		reqBody := `{"description":"Updated description for agent","tools":["Read","Write","Bash"]}`
		req := httptest.NewRequest(http.MethodPut, "/api/agents/test-agent", bytes.NewBufferString(reqBody))
		req.Header.Set("Content-Type", "application/json")
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("name", "test-agent")
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		rec := httptest.NewRecorder()
		handler.UpdateAgent(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected status 200, got %d. Body: %s", rec.Code, rec.Body.String())
		}

		var updated agentconfig.AgentConfig
		if err := json.NewDecoder(rec.Body).Decode(&updated); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if updated.Name != "test-agent" {
			t.Errorf("expected name 'test-agent', got '%s'", updated.Name)
		}
		if updated.Description != "Updated description for agent" {
			t.Errorf("expected description 'Updated description for agent', got '%s'", updated.Description)
		}
		if len(updated.Tools) != 3 || updated.Tools[1] != "Write" {
			t.Errorf("expected tools ['Read','Write','Bash'], got %v", updated.Tools)
		}

		// Verify on-disk file has updated frontmatter and preserved body
		diskData, err := os.ReadFile(filePath)
		if err != nil {
			t.Fatalf("failed to read file from disk: %v", err)
		}
		diskContent := string(diskData)
		if !strings.Contains(diskContent, "description: Updated description for agent") {
			t.Errorf("file on disk does not contain updated description: %s", diskContent)
		}
		if !strings.Contains(diskContent, bodyContent) {
			t.Errorf("body content was not preserved on disk! Got: %s", diskContent)
		}
	})

	// Subtest 2: 404 for unknown agent
	t.Run("returns 404 for unknown agent", func(t *testing.T) {
		reqBody := `{"description":"Some desc","tools":["Read"]}`
		req := httptest.NewRequest(http.MethodPut, "/api/agents/non-existent-agent", bytes.NewBufferString(reqBody))
		req.Header.Set("Content-Type", "application/json")
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("name", "non-existent-agent")
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		rec := httptest.NewRecorder()
		handler.UpdateAgent(rec, req)

		if rec.Code != http.StatusNotFound {
			t.Fatalf("expected status 404, got %d", rec.Code)
		}
	})

	// Subtest 3: 400 for invalid name
	t.Run("returns 400 for invalid agent name", func(t *testing.T) {
		reqBody := `{"description":"Some desc","tools":["Read"]}`
		req := httptest.NewRequest(http.MethodPut, "/api/agents/bad@name!", bytes.NewBufferString(reqBody))
		req.Header.Set("Content-Type", "application/json")
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("name", "bad@name!")
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		rec := httptest.NewRecorder()
		handler.UpdateAgent(rec, req)

		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected status 400, got %d", rec.Code)
		}
	})

	// Subtest 4: 400 for empty description
	t.Run("returns 400 for empty description", func(t *testing.T) {
		reqBody := `{"description":"   ","tools":["Read"]}`
		req := httptest.NewRequest(http.MethodPut, "/api/agents/test-agent", bytes.NewBufferString(reqBody))
		req.Header.Set("Content-Type", "application/json")
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("name", "test-agent")
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		rec := httptest.NewRecorder()
		handler.UpdateAgent(rec, req)

		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected status 400, got %d", rec.Code)
		}
	})

	// Subtest 5: 400 for empty tools array
	t.Run("returns 400 for empty tools array", func(t *testing.T) {
		reqBody := `{"description":"Valid desc","tools":[]}`
		req := httptest.NewRequest(http.MethodPut, "/api/agents/test-agent", bytes.NewBufferString(reqBody))
		req.Header.Set("Content-Type", "application/json")
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("name", "test-agent")
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		rec := httptest.NewRecorder()
		handler.UpdateAgent(rec, req)

		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected status 400, got %d", rec.Code)
		}
	})

	// Subtest 6: 400 for tools array with empty string element
	t.Run("returns 400 for tools array with empty element", func(t *testing.T) {
		reqBody := `{"description":"Valid desc","tools":["Read","  "]}`
		req := httptest.NewRequest(http.MethodPut, "/api/agents/test-agent", bytes.NewBufferString(reqBody))
		req.Header.Set("Content-Type", "application/json")
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("name", "test-agent")
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		rec := httptest.NewRecorder()
		handler.UpdateAgent(rec, req)

		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected status 400, got %d", rec.Code)
		}
	})
}

