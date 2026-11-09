// Package handlers — session query endpoints and event drilldown.
package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/agentos/api/internal/db"
	"github.com/go-chi/chi/v5"
)

// SessionsHandler handles session listing and event drilldown requests.
type SessionsHandler struct {
	DB *db.DB
}

// List handles GET /api/sessions.
// Returns the 50 most recent sessions with aggregated metrics.
func (h *SessionsHandler) List(w http.ResponseWriter, r *http.Request) {
	sessions, err := h.DB.GetSessions(50)
	if err != nil {
		http.Error(w, `{"error":"failed to retrieve sessions"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(sessions)
}

// Events handles GET /api/sessions/{session_id}/events.
// Returns chronological event log for the specified session_id.
// Enforces SEC-02 param allowlist validation (regex: ^[a-zA-Z0-9_\-]{4,128}$).
func (h *SessionsHandler) Events(w http.ResponseWriter, r *http.Request) {
	sessionID := chi.URLParam(r, "session_id")
	if sessionID == "" {
		sessionID = r.URL.Query().Get("session_id")
	}

	// SEC-02: validate parameter format
	if err := ValidateSessionID(sessionID); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	events, err := h.DB.GetSessionEvents(sessionID)
	if err != nil {
		http.Error(w, `{"error":"failed to retrieve session events"}`, http.StatusInternalServerError)
		return
	}

	// 404 if session not found (zero rows)
	if len(events) == 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "session not found"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(events)
}

