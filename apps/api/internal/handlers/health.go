// Package handlers — health check endpoint.
package handlers

import (
	"encoding/json"
	"net/http"
)

// HealthResponse is the JSON payload returned by GET /api/health.
type HealthResponse struct {
	Status  string `json:"status"`
	Version string `json:"version"`
}

// Health handles GET /api/health.
// Returns 200 OK with application status and version.
func Health(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(HealthResponse{
		Status:  "ok",
		Version: "0.1.0",
	})
}

