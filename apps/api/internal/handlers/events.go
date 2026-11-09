// Package handlers — event query endpoints.
package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/agentos/api/internal/db"
	"github.com/agentos/api/internal/models"
)

// EventsHandler holds a reference to the database for event queries.
type EventsHandler struct {
	DB *db.DB
}

// LatestEvents handles GET /api/events/latest?limit=N.
// Returns the N most-recent events (default 20, max 500).
func (h *EventsHandler) LatestEvents(w http.ResponseWriter, r *http.Request) {
	limit := 20
	if lStr := r.URL.Query().Get("limit"); lStr != "" {
		if l, err := strconv.Atoi(lStr); err == nil && l > 0 {
			limit = l
		}
	}
	if limit > 500 {
		limit = 500
	}

	events, err := h.DB.LatestEvents(limit)
	if err != nil {
		http.Error(w, `{"error":"db query failed"}`, http.StatusInternalServerError)
		return
	}

	// Return empty array instead of null when no events exist
	if events == nil {
		events = []models.Event{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(events)
}

// Sessions handles GET /api/events/sessions.
// Returns aggregated session summaries.
func (h *EventsHandler) Sessions(w http.ResponseWriter, r *http.Request) {
	sessions, err := h.DB.SessionSummaries()
	if err != nil {
		http.Error(w, `{"error":"db query failed"}`, http.StatusInternalServerError)
		return
	}

	if sessions == nil {
		sessions = []models.SessionSummary{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sessions)
}
