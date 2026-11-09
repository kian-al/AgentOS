# Sprint 0 — Foundation & Live Telemetry Pipeline

## Goal
Build the core AgentOS platform: a local-first AI agent monitoring system that
captures Beacon JSONL telemetry, persists it in SQLite, exposes a REST + WebSocket
API, and displays it in a Next.js dashboard.

---

## Story 1 — Beacon Telemetry Ingestion Pipeline

**As a** developer running Claude Code sessions,  
**I want** AgentOS to watch `~/.beacon/endpoint/logs/runtime.jsonl` in real-time,  
**So that** every agent event is captured, stored, and streamed to the dashboard
without manual intervention.

### Acceptance Criteria

1. **Beacon JSONL Parser** (`apps/api/internal/beacon/parser.go`)
   - Parses each JSONL line into a typed `RawEvent` struct
   - Fields: `event_type`, `session_id`, `agent`, `timestamp`, `token_usage` (input/output/cache_read), `model`, `cost_usd`, `tool` (name + input)
   - Returns parse error on malformed JSON — does not crash

2. **File Watcher** (`apps/api/internal/beacon/watcher.go`)
   - Uses `fsnotify` to watch the JSONL file for `WRITE` events
   - On each write: reads only NEW lines since last read position (tail mode)
   - On file not found: waits and retries — does not crash
   - Emits parsed events to a Go channel

3. **SQLite Persistence** (`apps/api/internal/db/db.go`)
   - SQLite database at path from config (`./agentOS.db`)
   - Table `events` with columns: id, event_type, session_id, agent, timestamp,
     input_tokens, output_tokens, cache_read_tokens, model, cost_usd, tool_name, raw_json, created_at
   - Auto-creates schema on startup (migration via `CREATE TABLE IF NOT EXISTS`)

4. **REST API** (`apps/api/internal/handlers/`)
   - `GET /api/health` → `{"status":"ok","version":"0.1.0"}`
   - `GET /api/events/latest?limit=N` → returns last N events as JSON array
   - `GET /api/events/sessions` → distinct session_ids with event count + total cost
   - Proper CORS headers for `http://localhost:3000`

5. **WebSocket Broadcaster** (`apps/api/internal/ws/hub.go`)
   - Hub manages client connections at `ws://localhost:8080/ws`
   - When watcher emits a new event → broadcast JSON to all connected WebSocket clients
   - Auto-cleanup disconnected clients

6. **Main entrypoint** (`apps/api/cmd/api/main.go`)
   - Starts HTTP server on port 8080 (configurable via env `PORT`)
   - Initializes DB, starts watcher goroutine, registers routes
   - Graceful shutdown on SIGINT/SIGTERM

7. **Frontend Dashboard** (`apps/web/src/app/dashboard/page.tsx`)
   - Already has WebSocket hook and event display — ensure it compiles cleanly
   - `useBeaconSocket` hook connects to `ws://localhost:8080/ws`
   - Live event feed updates without page reload
   - Shows: event_type, agent, model, token count, cost_usd per event

8. **Build verifications**
   - `cd apps/api && go build ./...` exits 0
   - `cd apps/web && npm run type-check` exits 0

### Out of Scope (future sprints)
- Authentication
- Multi-user support
- Advanced analytics (Sprint 2)
- Session replay (Sprint 10)

---

## Story 0.2 — Base UI Shell & Navigation

**As a** developer monitoring AI agents,  
**I want** a responsive, consistent application shell with real-time health indicator and sidebar navigation,  
**So that** I can seamlessly navigate across all AgentOS features with instant visibility into Beacon status.

### Acceptance Criteria
1. Sidebar with navigation links: Dashboard, Analytics, Agents, Commands, Hooks, Skills, Sessions, Settings
2. Active route highlighted in sidebar using Next.js `usePathname()` (accent color + bold)
3. TopBar shows: "🧠 AgentOS" logo + current page title + Beacon status badge (🟢/🔴)
4. Beacon status badge polls `GET http://localhost:8080/api/health` every 10 seconds via `useHealthCheck` hook
5. `AppShell` layout wraps all `/dashboard/*` pages via `apps/web/src/app/dashboard/layout.tsx`
6. Responsive design: sidebar collapses on mobile (hamburger menu)
7. Dark mode support via Tailwind `dark:` classes
8. Empty state component shown for pages not yet implemented
9. `npm run type-check` and `npm run build` exit code 0

---

## Story 2 — Agent Config Reader (Sprint 0 continuation)

**As a** developer,  
**I want** AgentOS to read my `.claude/agents/*.md` files,  
**So that** I can see my configured agents in the dashboard.

### Acceptance Criteria
1. `GET /api/agents` → reads `~/.claude/agents/` and returns agent list (name, description, tools)
2. Dashboard `/dashboard/agents` page renders agent cards
3. Each card shows: name, description excerpt, tool list

---

## Definition of Done (Sprint 0)
- [ ] Go API compiles and starts without errors
- [ ] Beacon JSONL watcher runs (even if file doesn't exist yet)
- [ ] SQLite schema auto-created on startup
- [ ] `/api/health` returns 200
- [ ] `/api/events/latest` returns events array
- [ ] WebSocket broadcasts new events within 1 second of JSONL write
- [ ] Frontend dashboard connects to WebSocket and displays events
- [ ] `go build ./...` exits 0
- [ ] `npm run type-check` exits 0

