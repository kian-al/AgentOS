// AgentOS API — The Operating System for AI Agents
// main.go wires together DB, Beacon watcher, WebSocket hub, and HTTP routes.
package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	chi "github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"

	"github.com/agentos/api/internal/beacon"
	"github.com/agentos/api/internal/db"
	"github.com/agentos/api/internal/handlers"
	"github.com/agentos/api/internal/models"
	"github.com/agentos/api/internal/ws"
)

func main() {
	// ── Config ────────────────────────────────────────────────────────────────
	port := getEnv("PORT", "8080")
	dbPath := getEnv("DB_PATH", "./agentOS.db")
	beaconPath := getEnv("BEACON_JSONL", "~/.beacon/endpoint/logs/runtime.jsonl")

	log.SetFlags(log.Ltime | log.Lshortfile)
	log.Println("▶  AgentOS API starting — The Operating System for AI Agents")
	log.Printf("   port=%s  db=%s  beacon=%s", port, dbPath, beaconPath)

	// ── Database ──────────────────────────────────────────────────────────────
	database, err := db.Init(dbPath)
	if err != nil {
		log.Fatalf("[DB] Init failed: %v", err)
	}
	defer database.Close()

	// ── WebSocket Hub ─────────────────────────────────────────────────────────
	hub := ws.NewHub()

	// ── Beacon Watcher ────────────────────────────────────────────────────────
	watcher := beacon.NewWatcher(beaconPath)
	go watcher.Start(func(evt *models.Event, rawJSON string) {
		// 1. Persist to SQLite
		if err := database.InsertEvent(evt); err != nil {
			log.Printf("[Watcher] DB insert error: %v", err)
		}
		// 2. Broadcast to all WebSocket clients
		data, _ := json.Marshal(evt)
		hub.Broadcast(data)
		log.Printf("[Watcher] Event: type=%s agent=%s model=%s cost=$%.4f",
			evt.EventType, evt.Agent, evt.Model, evt.CostUSD)
	})

	// ── HTTP Router ───────────────────────────────────────────────────────────
	r := chi.NewRouter()
	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)
	r.Use(corsMiddleware)

	// Health check
	r.Get("/api/health", handlers.Health)

	// Event endpoints
	evtHandler := &handlers.EventsHandler{DB: database}
	r.Get("/api/events/latest", evtHandler.LatestEvents)
	r.Get("/api/events/sessions", evtHandler.Sessions)

	// Metrics endpoints
	metricsHandler := &handlers.MetricsHandler{DB: database}
	r.Get("/api/metrics/summary", metricsHandler.Summary)
	r.Get("/api/metrics/timeline", metricsHandler.Timeline)
	r.Get("/api/metrics/breakdown", metricsHandler.Breakdown)
	r.Get("/api/metrics/heatmap", metricsHandler.Heatmap)
	r.Get("/api/metrics/models", metricsHandler.Models)
	r.Get("/api/metrics/projection", metricsHandler.Projection)

	// Sessions endpoints (Story 2.4)
	sessionsHandler := &handlers.SessionsHandler{DB: database}
	r.Get("/api/sessions", sessionsHandler.List)
	r.Get("/api/sessions/{session_id}/events", sessionsHandler.Events)

	// Agent Manager endpoints (Story 3.1, 3.2 & 3.3)
	agentsDir := getEnv("AGENTOS_AGENTS_DIR", ".claude/agents")
	agentsHandler := handlers.NewAgentsHandler(agentsDir, database)
	r.Get("/api/agents", agentsHandler.ListAgents)
	r.Get("/api/agents/{name}", agentsHandler.GetAgent)
	r.Put("/api/agents/{name}", agentsHandler.UpdateAgent)

	// Command Center endpoints (Story 4.1 & 4.2)
	commandsDir := getEnv("AGENTOS_COMMANDS_DIR", ".claude/commands")
	commandsHandler := handlers.NewCommandsHandler(commandsDir, hub)
	r.Get("/api/commands", commandsHandler.ListCommands)
	r.Post("/api/commands/{name}/run", commandsHandler.RunCommand)

	// WebSocket endpoint
	wsHandler := &handlers.WSHandler{Hub: hub}
	r.Get("/ws", wsHandler.ServeHTTP)

	// ── HTTP Server ───────────────────────────────────────────────────────────
	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 60 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	// Graceful shutdown
	idleConnsClosed := make(chan struct{})
	go func() {
		quit := make(chan os.Signal, 1)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		sig := <-quit
		log.Printf("Received signal %v — shutting down...", sig)
		watcher.Stop()

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := srv.Shutdown(ctx); err != nil {
			log.Printf("HTTP shutdown error: %v", err)
		}
		close(idleConnsClosed)
	}()

	log.Printf("✅  AgentOS API listening on http://localhost:%s", port)
	if err := srv.ListenAndServe(); err != http.ErrServerClosed {
		log.Fatalf("HTTP server error: %v", err)
	}
	<-idleConnsClosed
	log.Println("AgentOS API stopped.")
}

// corsMiddleware adds CORS headers for the Next.js frontend at localhost:3000.
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin == "" {
			origin = "http://localhost:3000"
		}
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

