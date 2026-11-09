package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"sync"
	"testing"
	"time"

	chi "github.com/go-chi/chi/v5"

	"github.com/agentos/api/internal/commandconfig"
)

type mockHub struct {
	mu       sync.Mutex
	messages [][]byte
	notifyCh chan []byte
}

func newMockHub() *mockHub {
	return &mockHub{
		notifyCh: make(chan []byte, 100),
	}
}

func (m *mockHub) Broadcast(data []byte) {
	m.mu.Lock()
	m.messages = append(m.messages, data)
	m.mu.Unlock()
	select {
	case m.notifyCh <- data:
	default:
	}
}

func (m *mockHub) getMessages() [][]byte {
	m.mu.Lock()
	defer m.mu.Unlock()
	copied := make([][]byte, len(m.messages))
	copy(copied, m.messages)
	return copied
}

func TestCommandsHandler(t *testing.T) {
	tempDir := t.TempDir()

	cmdContent := `# /sprint — Execute Sprint Story

Run a sprint story end-to-end using the full agent loop.

## Usage
/sprint [SPRINT] [STORY]
`
	if err := os.WriteFile(filepath.Join(tempDir, "sprint.md"), []byte(cmdContent), 0644); err != nil {
		t.Fatalf("failed to write test command: %v", err)
	}

	handler := NewCommandsHandler(tempDir)

	t.Run("returns 200 and list of commands", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/commands", nil)
		rec := httptest.NewRecorder()

		handler.ListCommands(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected status 200, got %d", rec.Code)
		}

		contentType := rec.Header().Get("Content-Type")
		if contentType != "application/json" {
			t.Errorf("expected Content-Type application/json, got %s", contentType)
		}

		var commands []commandconfig.CommandConfig
		if err := json.NewDecoder(rec.Body).Decode(&commands); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if len(commands) != 1 {
			t.Fatalf("expected 1 command, got %d", len(commands))
		}

		if commands[0].Name != "sprint" {
			t.Errorf("expected name 'sprint', got '%s'", commands[0].Name)
		}
		if commands[0].Title != "/sprint — Execute Sprint Story" {
			t.Errorf("expected title '/sprint — Execute Sprint Story', got '%s'", commands[0].Title)
		}
		if commands[0].Description != "Run a sprint story end-to-end using the full agent loop." {
			t.Errorf("unexpected description: '%s'", commands[0].Description)
		}
	})

	t.Run("supports refresh=true query parameter", func(t *testing.T) {
		// Add a second command dynamically
		secondCmd := `# /beacon-check — Verify Pipeline

Check the beacon telemetry pipeline status.
`
		if err := os.WriteFile(filepath.Join(tempDir, "beacon-check.md"), []byte(secondCmd), 0644); err != nil {
			t.Fatalf("failed to write second command: %v", err)
		}

		// Cached request returns 1 command
		reqCached := httptest.NewRequest(http.MethodGet, "/api/commands", nil)
		recCached := httptest.NewRecorder()
		handler.ListCommands(recCached, reqCached)

		var cached []commandconfig.CommandConfig
		_ = json.NewDecoder(recCached.Body).Decode(&cached)
		if len(cached) != 1 {
			t.Errorf("expected cached count 1, got %d", len(cached))
		}

		// Refresh request returns 2 commands
		reqRefresh := httptest.NewRequest(http.MethodGet, "/api/commands?refresh=true", nil)
		recRefresh := httptest.NewRecorder()
		handler.ListCommands(recRefresh, reqRefresh)

		if recRefresh.Code != http.StatusOK {
			t.Fatalf("expected status 200, got %d", recRefresh.Code)
		}

		var refreshed []commandconfig.CommandConfig
		_ = json.NewDecoder(recRefresh.Body).Decode(&refreshed)
		if len(refreshed) != 2 {
			t.Errorf("expected refreshed count 2, got %d", len(refreshed))
		}
	})

	t.Run("returns empty array for missing directory", func(t *testing.T) {
		emptyHandler := NewCommandsHandler(filepath.Join(tempDir, "non-existent-dir"))
		req := httptest.NewRequest(http.MethodGet, "/api/commands", nil)
		rec := httptest.NewRecorder()

		emptyHandler.ListCommands(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected status 200, got %d", rec.Code)
		}

		var commands []commandconfig.CommandConfig
		if err := json.NewDecoder(rec.Body).Decode(&commands); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}
		if len(commands) != 0 {
			t.Errorf("expected 0 commands, got %d", len(commands))
		}
	})

	t.Run("returns 400 for unrecognized query parameter", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/commands?invalid_param=1", nil)
		rec := httptest.NewRecorder()

		handler.ListCommands(rec, req)

		if rec.Code != http.StatusBadRequest {
			t.Errorf("expected status 400, got %d", rec.Code)
		}
	})

	t.Run("returns 400 for invalid refresh parameter value", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/commands?refresh=bad", nil)
		rec := httptest.NewRecorder()

		handler.ListCommands(rec, req)

		if rec.Code != http.StatusBadRequest {
			t.Errorf("expected status 400, got %d", rec.Code)
		}
	})
}

func TestCommandsHandler_Run(t *testing.T) {
	tempDir := t.TempDir()

	cmdContent := `# /sprint — Execute Sprint Story
Run sprint story end-to-end.
`
	if err := os.WriteFile(filepath.Join(tempDir, "sprint.md"), []byte(cmdContent), 0644); err != nil {
		t.Fatalf("failed to write test command: %v", err)
	}

	t.Run("successful run streams output and completes with exit code 0", func(t *testing.T) {
		hub := newMockHub()
		handler := NewCommandsHandler(tempDir, hub)

		var capturedArgs []string
		handler.Runner = func(ctx context.Context, bin string, args []string, onLine func(string)) (int, error) {
			capturedArgs = args
			onLine("Reading sprint-4.md...")
			onLine("Executing Story 4.2...")
			return 0, nil
		}

		body := bytes.NewBufferString(`{"args": "4 2"}`)
		req := httptest.NewRequest(http.MethodPost, "/api/commands/sprint/run", body)
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("name", "sprint")
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		rec := httptest.NewRecorder()
		handler.RunCommand(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected status 200, got %d: %s", rec.Code, rec.Body.String())
		}

		var resp map[string]string
		if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}
		if resp["status"] != "running" || resp["command"] != "/sprint" {
			t.Errorf("unexpected response: %+v", resp)
		}

		// Wait for broadcast messages via channel
		doneReceived := false
		var receivedLines []string
		timeout := time.After(2 * time.Second)

		for !doneReceived {
			select {
			case msg := <-hub.notifyCh:
				var m map[string]interface{}
				if err := json.Unmarshal(msg, &m); err == nil {
					if m["type"] == "command_output" {
						receivedLines = append(receivedLines, m["line"].(string))
					} else if m["type"] == "command_done" {
						doneReceived = true
						if int(m["exit_code"].(float64)) != 0 {
							t.Errorf("expected exit_code 0, got %v", m["exit_code"])
						}
					}
				}
			case <-timeout:
				t.Fatal("timed out waiting for command_done message")
			}
		}

		if len(receivedLines) != 2 {
			t.Fatalf("expected 2 output lines, got %d: %v", len(receivedLines), receivedLines)
		}
		if receivedLines[0] != "Reading sprint-4.md..." || receivedLines[1] != "Executing Story 4.2..." {
			t.Errorf("unexpected output lines: %v", receivedLines)
		}

		expectedArgs := []string{"/sprint", "4", "2"}
		if len(capturedArgs) != len(expectedArgs) {
			t.Fatalf("expected %d args, got %v", len(expectedArgs), capturedArgs)
		}
		for i, a := range expectedArgs {
			if capturedArgs[i] != a {
				t.Errorf("arg[%d] expected %s, got %s", i, a, capturedArgs[i])
			}
		}
	})

	t.Run("concurrency guard returns 409 when command already running", func(t *testing.T) {
		hub := newMockHub()
		handler := NewCommandsHandler(tempDir, hub)

		startedCh := make(chan struct{})
		releaseCh := make(chan struct{})

		handler.Runner = func(ctx context.Context, bin string, args []string, onLine func(string)) (int, error) {
			close(startedCh)
			<-releaseCh
			return 0, nil
		}

		// First request starts command
		req1 := httptest.NewRequest(http.MethodPost, "/api/commands/sprint/run", bytes.NewBufferString(`{}`))
		rctx1 := chi.NewRouteContext()
		rctx1.URLParams.Add("name", "sprint")
		req1 = req1.WithContext(context.WithValue(req1.Context(), chi.RouteCtxKey, rctx1))

		rec1 := httptest.NewRecorder()
		handler.RunCommand(rec1, req1)
		if rec1.Code != http.StatusOK {
			t.Fatalf("expected first run 200, got %d", rec1.Code)
		}

		// Wait until first runner is executing
		<-startedCh

		// Second request should get 409 Conflict
		req2 := httptest.NewRequest(http.MethodPost, "/api/commands/sprint/run", bytes.NewBufferString(`{}`))
		rctx2 := chi.NewRouteContext()
		rctx2.URLParams.Add("name", "sprint")
		req2 = req2.WithContext(context.WithValue(req2.Context(), chi.RouteCtxKey, rctx2))

		rec2 := httptest.NewRecorder()
		handler.RunCommand(rec2, req2)

		if rec2.Code != http.StatusConflict {
			t.Fatalf("expected status 409 Conflict, got %d: %s", rec2.Code, rec2.Body.String())
		}

		var errResp map[string]string
		_ = json.NewDecoder(rec2.Body).Decode(&errResp)
		if errResp["error"] != "another command is currently running" {
			t.Errorf("unexpected error message: %s", errResp["error"])
		}

		// Release first runner
		close(releaseCh)

		// Wait for completion
		select {
		case <-hub.notifyCh:
		case <-time.After(2 * time.Second):
			t.Fatal("timed out waiting for runner completion")
		}
	})

	t.Run("returns 404 for unknown command", func(t *testing.T) {
		hub := newMockHub()
		handler := NewCommandsHandler(tempDir, hub)

		req := httptest.NewRequest(http.MethodPost, "/api/commands/non-existent/run", nil)
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("name", "non-existent")
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		rec := httptest.NewRecorder()
		handler.RunCommand(rec, req)

		if rec.Code != http.StatusNotFound {
			t.Fatalf("expected status 404, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("returns 400 for invalid command name", func(t *testing.T) {
		hub := newMockHub()
		handler := NewCommandsHandler(tempDir, hub)

		req := httptest.NewRequest(http.MethodPost, "/api/commands/bad!name/run", nil)
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("name", "bad!name")
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		rec := httptest.NewRecorder()
		handler.RunCommand(rec, req)

		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected status 400, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("broadcasts non-zero exit code on process failure", func(t *testing.T) {
		hub := newMockHub()
		handler := NewCommandsHandler(tempDir, hub)

		handler.Runner = func(ctx context.Context, bin string, args []string, onLine func(string)) (int, error) {
			onLine("Command encountered fatal error")
			return 1, nil
		}

		req := httptest.NewRequest(http.MethodPost, "/api/commands/sprint/run", nil)
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("name", "sprint")
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		rec := httptest.NewRecorder()
		handler.RunCommand(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected status 200, got %d", rec.Code)
		}

		// Wait for command_done message
		doneReceived := false
		timeout := time.After(2 * time.Second)

		for !doneReceived {
			select {
			case msg := <-hub.notifyCh:
				var m map[string]interface{}
				if err := json.Unmarshal(msg, &m); err == nil && m["type"] == "command_done" {
					doneReceived = true
					if int(m["exit_code"].(float64)) != 1 {
						t.Errorf("expected exit_code 1, got %v", m["exit_code"])
					}
				}
			case <-timeout:
				t.Fatal("timed out waiting for command_done message")
			}
		}
	})
}
