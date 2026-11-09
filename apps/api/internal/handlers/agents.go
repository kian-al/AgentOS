// Package handlers — agent configuration endpoints.
package handlers

import (
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/agentos/api/internal/agentconfig"
	"github.com/agentos/api/internal/db"
	"github.com/agentos/api/internal/models"
	"github.com/go-chi/chi/v5"
)

// AgentsHandler manages agent configuration inspection and management.
type AgentsHandler struct {
	AgentsDir   string
	DB          *db.DB
	cacheMu     sync.RWMutex
	cachedList  []agentconfig.AgentConfig
	lastScanned time.Time
	cacheTTL    time.Duration
}

// NewAgentsHandler creates a new AgentsHandler instance.
func NewAgentsHandler(agentsDir string, database ...*db.DB) *AgentsHandler {
	var d *db.DB
	if len(database) > 0 {
		d = database[0]
	}
	return &AgentsHandler{
		AgentsDir: agentsDir,
		DB:        d,
		cacheTTL:  30 * time.Second,
	}
}

// ListAgents handles GET /api/agents.
// Returns an array of AgentConfig metadata parsed from .claude/agents/*.md.
// Accepts optional ?refresh=true query parameter to bypass cache.
func (h *AgentsHandler) ListAgents(w http.ResponseWriter, r *http.Request) {
	forceRefresh := r.URL.Query().Get("refresh") == "true"

	h.cacheMu.RLock()
	isCacheValid := !forceRefresh && h.cachedList != nil && time.Since(h.lastScanned) < h.cacheTTL
	cached := h.cachedList
	h.cacheMu.RUnlock()

	if isCacheValid {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(cached)
		return
	}

	h.cacheMu.Lock()
	defer h.cacheMu.Unlock()

	// Double check after write lock
	if !forceRefresh && h.cachedList != nil && time.Since(h.lastScanned) < h.cacheTTL {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(h.cachedList)
		return
	}

	agents, err := agentconfig.ParseAgentDir(h.AgentsDir)
	if err != nil {
		http.Error(w, `{"error":"failed to parse agent configs"}`, http.StatusInternalServerError)
		return
	}

	if agents == nil {
		agents = []agentconfig.AgentConfig{}
	}

	h.cachedList = agents
	h.lastScanned = time.Now()

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(agents)
}

// GetAgent handles GET /api/agents/{name}.
// Returns agent config combined with aggregated live SQL stats.
// Enforces SEC-02 param allowlist validation (regex: ^[a-zA-Z0-9_\-]{2,128}$).
func (h *AgentsHandler) GetAgent(w http.ResponseWriter, r *http.Request) {
	name := chi.URLParam(r, "name")
	if name == "" {
		name = r.URL.Query().Get("name")
	}

	// 1. Validate :name before use
	if err := ValidateAgentName(name); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	// 2. Load agent config from disk (404 if not found)
	cfg, err := agentconfig.GetAgentByName(h.AgentsDir, name)
	if err != nil {
		if os.IsNotExist(err) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "agent not found"})
			return
		}
		http.Error(w, `{"error":"failed to read agent config"}`, http.StatusInternalServerError)
		return
	}

	// 3. Aggregate live stats in SQL
	var stats models.AgentStats
	if h.DB != nil {
		stats, err = h.DB.AgentStats(cfg.Name)
		if err != nil {
			http.Error(w, `{"error":"failed to aggregate agent stats"}`, http.StatusInternalServerError)
			return
		}
	}

	response := models.AgentDetail{
		Config: *cfg,
		Stats:  stats,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(response)
}

// UpdateAgentRequest defines the expected payload for PUT /api/agents/{name}.
type UpdateAgentRequest struct {
	Description string   `json:"description"`
	Tools       []string `json:"tools"`
}

// UpdateAgent handles PUT /api/agents/{name}.
// Validates input, updates YAML frontmatter in disk file, preserves body content,
// invalidates cache, and returns updated AgentConfig.
func (h *AgentsHandler) UpdateAgent(w http.ResponseWriter, r *http.Request) {
	name := chi.URLParam(r, "name")
	if name == "" {
		name = r.URL.Query().Get("name")
	}

	// 1. Validate :name before use (SEC-02 allowlist)
	if err := ValidateAgentName(name); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	// 2. Decode JSON body
	var req UpdateAgentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "invalid JSON body"})
		return
	}

	// 3. Validation rules: description must be non-empty string
	trimmedDesc := strings.TrimSpace(req.Description)
	if trimmedDesc == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "description must be a non-empty string"})
		return
	}

	// Validation rules: tools must be non-empty string array with non-empty entries
	if len(req.Tools) == 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "tools must be a non-empty string array"})
		return
	}

	cleanedTools := make([]string, 0, len(req.Tools))
	for _, tool := range req.Tools {
		trimmedTool := strings.TrimSpace(tool)
		if trimmedTool == "" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "tools must not contain empty strings"})
			return
		}
		cleanedTools = append(cleanedTools, trimmedTool)
	}

	// 4. Locate existing agent config (404 if not found)
	cfg, err := agentconfig.GetAgentByName(h.AgentsDir, name)
	if err != nil {
		if os.IsNotExist(err) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "agent not found"})
			return
		}
		http.Error(w, `{"error":"failed to locate agent file"}`, http.StatusInternalServerError)
		return
	}

	// 5. Update frontmatter atomically on disk
	updatedCfg, err := agentconfig.UpdateAgentFile(cfg.FilePath, trimmedDesc, cleanedTools)
	if err != nil {
		http.Error(w, `{"error":"failed to update agent file"}`, http.StatusInternalServerError)
		return
	}

	// 6. Invalidate in-memory cache
	h.cacheMu.Lock()
	h.cachedList = nil
	h.lastScanned = time.Time{}
	h.cacheMu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(updatedCfg)
}

