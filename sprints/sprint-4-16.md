# Sprint 5 — Hook Manager

**Goal:** Let users view, toggle, and edit Claude Code hooks
(PreToolUse, PostToolUse, Stop) from the UI.

---

## Story 5.1 — Hook Config Viewer

**As a** user,
**I want** to see all hooks defined in `.claude/hooks/hooks.json`,
**so that** I understand what automation fires during agent runs.

### Backend Tasks
1. Create `apps/api/internal/hookconfig/parser.go`
   - Read `.claude/hooks/hooks.json`.
   - Parse: `{ PreToolUse: [], PostToolUse: [], Stop: [] }`.
   - Each entry: `{ matcher, command, description }`.
   - Return `HookConfig{ PreToolUse, PostToolUse, Stop []HookEntry }`.

2. `GET /api/hooks` in `handlers/hooks.go`.
3. `TestHookParser` + `TestHooksHandler` with testdata.

### Frontend Tasks
1. `HookEntry`, `HookConfig` interfaces + `fetchHooks()` in `api.ts`.
2. `useHooks` hook.
3. Create `/hooks` route + "Hooks" Sidebar item (icon: `Zap`).
4. `apps/web/src/components/hooks/HookList.tsx`
   - Three sections: PreToolUse / PostToolUse / Stop.
   - Each hook row: type badge + matcher + command.
   - Type badge static classes:
     ```
     "pre":  "bg-chart-agent/15 text-chart-agent"
     "post": "bg-chart-tool/15 text-chart-tool"
     "stop": "bg-chart-error/15 text-chart-error"
     ```
   - `aria-label` on each row.
5. Vitest: `HookList.test.tsx`.
6. `accessibility-audit` on `/hooks`.

### ASCII Prototype

┌────────────────────────────────────────────────────────────┐ │ Hook Manager │ │ │ │ PreToolUse │ │ [PRE] *.go verify-build-on-write │ │ [PRE] * log-tool-usage │ │ │ │ PostToolUse │ │ [POST] *.tsx verify-types-on-tsx-write │ │ │ │ Stop │ │ [STOP] — session-end-summary │ └────────────────────────────────────────────────────────────┘

text


---

## Story 5.2 — Hook Editor & Toggle

**As a** user,
**I want** to enable/disable hooks and edit their commands,
**so that** I can customize automation without editing JSON manually.

### Backend Tasks
1. `PUT /api/hooks` — accepts full `HookConfig`, writes back to `hooks.json`.
2. Validation: hook types must be `PreToolUse | PostToolUse | Stop`.
   Matcher and command must be non-empty strings.
3. `TestHooksHandler_Update` using temp file.

### Frontend Tasks
1. `updateHooks(config)` in `api.ts`.
2. Toggle switch on each hook row (shadcn `<Switch>`).
   - Disabled hooks: command prefixed with `#` (comment) in JSON.
   - Optimistic UI update.
3. `apps/web/src/components/hooks/HookEditSheet.tsx`
   - Edit matcher and command fields.
   - Save/Cancel pattern (same as AgentEditForm).
4. "Add Hook" button → empty HookEditSheet.
5. "Delete" button (with confirmation dialog) on each row.
6. Vitest: `HookEditSheet.test.tsx`, toggle test.
7. `accessibility-audit` on `/hooks` (final pass).

---

## Sprint 5 Definition of Done

- [ ] `GET /api/hooks` reads and parses `hooks.json`.
- [ ] `PUT /api/hooks` writes updated config to disk.
- [ ] `/hooks` renders all three hook type sections.
- [ ] Toggle enables/disables hooks.
- [ ] Edit sheet saves changes with toast feedback.
- [ ] All build gates pass.
- [ ] All Vitest tests pass.
- [ ] `accessibility-audit` documented.

sprints/sprint-6.md

Markdown

# Sprint 6 — Skill & MCP Store

**Goal:** Browse installed skills and MCP servers, view their configs,
and discover new ones from a local registry.

---

## Story 6.1 — Skill Browser

**As a** user,
**I want** to see all skills in `.claude/skills/`,
**so that** I know what capabilities my agents have.

### Backend Tasks
1. `apps/api/internal/skillconfig/parser.go`
   - Scan `.claude/skills/*/` directories.
   - Read `README.md` (first H1 = name, first paragraph = description).
   - Return `[]SkillConfig{ Name, Description, Path, Files []string }`.
2. `GET /api/skills` in `handlers/skills.go`.
3. `TestSkillParser` + `TestSkillsHandler`.

### Frontend Tasks
1. `SkillConfig` interface + `fetchSkills()`.
2. `useSkills` hook.
3. Create `/skills` route + "Skills" Sidebar item (icon: `Sparkles`).
4. `SkillCard.tsx` — name, description, file count badge.
5. `SkillDetailSheet.tsx` — full README rendered as prose, file list.
6. Vitest + `accessibility-audit` on `/skills`.

---

## Story 6.2 — MCP Server Registry

**As a** user,
**I want** to see configured MCP servers and their status,
**so that** I can manage tool integrations.

### Backend Tasks
1. Read MCP config from `.claude/settings.json` or `mcp.json` (whichever exists).
2. `GET /api/mcp` — returns `[]MCPServer{ Name, URL, Type, Status }`.
3. Status check: HTTP HEAD or TCP ping to server URL (timeout 2s).
4. `TestMCPHandler`.

### Frontend Tasks
1. `MCPServer` interface + `fetchMCP()`.
2. `MCPServerList.tsx`
   - Status dot: `bg-chart-cache` (online), `bg-chart-error` (offline),
     `bg-slate-500` (unknown). Static literal map `MCP_STATUS_STYLES`.
3. Vitest + `accessibility-audit` on `/skills` (final pass for page).

---

## Sprint 6 Definition of Done

- [ ] `GET /api/skills` and `GET /api/mcp` return correct data.
- [ ] `/skills` page renders skill cards and MCP server list.
- [ ] Status dots use static Tailwind classes only.
- [ ] All build gates pass.
- [ ] All Vitest tests pass.

sprints/sprint-7.md

Markdown

# Sprint 7 — Visual Flow Graph

**Goal:** Render a live React Flow graph showing agents, their tool calls,
and session flows — giving a visual map of agent activity.

---

## Story 7.1 — Agent Topology Graph

**As a** user,
**I want** to see a graph of agents and their connections (tool calls, handoffs),
**so that** I can visualize how my agent system is structured.

### Backend Tasks
1. `GET /api/graph/topology`
   - SQL:
     ```sql
     SELECT agent, tool_name, COUNT(*) AS calls
     FROM events
     WHERE tool_name IS NOT NULL AND timestamp >= ?
     GROUP BY agent, tool_name
     ```
   - Build graph: nodes (agents + tools), edges (agent→tool with call count).
   - Return: `{ nodes: [{id, type, label, data}], edges: [{source, target, label}] }`.

2. `TestGraphHandler_Topology`.

### Frontend Tasks
1. `GraphData` interface + `fetchTopology()` in `api.ts`.
2. `useTopology` hook — 30s refresh.
3. Create `apps/web/src/app/flow/layout.tsx` + `page.tsx`
   - Page title: "Visual Flow".
   - Add "Flow" Sidebar item (icon: `GitBranch`).
4. `apps/web/src/components/flow/AgentFlowGraph.tsx`
   - React Flow canvas (full height).
   - Agent nodes: `bg-chart-agent/20 border-chart-agent` (static classes on node style).
   - Tool nodes: `bg-chart-tool/20 border-chart-tool`.
   - Edge labels: call count.
   - Mini-map bottom-right.
   - Zoom controls.
   - `aria-label="Agent topology graph"` on wrapper.
   - `sr-only` table: list of connections for screen readers.
5. Vitest: `AgentFlowGraph.test.tsx`
   - Renders correct node count.
   - `sr-only` table has correct row count.
6. `accessibility-audit` on `/flow`.

### ASCII Prototype

┌────────────────────────────────────────────────────────────┐ │ Visual Flow [🔍 Fit] │ │ │ │ [🤖 architect]──────────────▶[🔧 Read] │ │ │ │ │ └──────────────────────▶[🔧 Write] │ │ │ │ [🤖 frontend]───────────────▶[🔧 Bash] │ │ │ │ │ └──────────────────────▶[🔧 WebSearch] │ │ │ │ ┌─────────────┐ [minimap] │ │ │ Nodes: 8 │ │ │ │ Edges: 12 │ │ │ └─────────────┘ │ └────────────────────────────────────────────────────────────┘

text


---

## Story 7.2 — Session Flow Replay

**As a** user,
**I want** to replay a session as an animated flow graph,
**so that** I can understand the exact sequence of agent actions.

### Backend Tasks
1. `GET /api/graph/session/:session_id`
   - Returns ordered event nodes + edges for a single session.
   - Each event = one node: `{ id, event_type, agent, tool_name, timestamp, cost_usd }`.
   - Edges: sequential (event N → event N+1).

2. `TestGraphHandler_Session`.

### Frontend Tasks
1. `fetchSessionGraph(id)` in `api.ts`.
2. `useSessionGraph(id)` hook.
3. `apps/web/src/components/flow/SessionFlowGraph.tsx`
   - Horizontal timeline layout (left→right).
   - Play/Pause button: animates edges appearing one by one (500ms per step).
   - Speed control: 0.5x / 1x / 2x.
   - Current event highlighted with `ring-2 ring-blue-500` (static literal).
   - `sr-only` live region announcing current event during playback.
4. Add session selector dropdown to `/flow` page.
5. Vitest: `SessionFlowGraph.test.tsx`.
6. `accessibility-audit` on `/flow` (final pass).

---

## Sprint 7 Definition of Done

- [ ] `GET /api/graph/topology` returns valid graph JSON.
- [ ] `GET /api/graph/session/:id` returns ordered session nodes/edges.
- [ ] `/flow` page renders React Flow canvas.
- [ ] Session flow replay animates correctly.
- [ ] `sr-only` table and live region for screen readers.
- [ ] All build gates pass.
- [ ] All Vitest tests pass.

sprints/sprint-8.md

Markdown

# Sprint 8 — Chat-to-Config

**Goal:** Let users describe what they want in plain language and have
the UI generate agent config, hook entries, or slash commands automatically.

---

## Story 8.1 — Natural Language Config Generator

**As a** user,
**I want** to type "create an agent that reviews PRs and posts comments",
**so that** the system generates the agent `.md` file for me.

### Backend Tasks
1. `POST /api/chat/generate`
   - Body: `{ "prompt": "...", "target": "agent|hook|command" }`.
   - Calls Claude API (via `ANTHROPIC_API_KEY` env var) with a system prompt
     instructing it to output YAML frontmatter + markdown body.
   - Returns: `{ "content": "---\nname: ...\n---\n...", "target": "agent" }`.
   - If `ANTHROPIC_API_KEY` not set: return 503 with `{ "error": "API key not configured" }`.
   - Stream response over SSE (`text/event-stream`).

2. `TestChatHandler_Generate` — mock HTTP client, assert SSE output.

### Frontend Tasks
1. `generateConfig(prompt, target)` SSE consumer in `api.ts`.
2. `useConfigGenerator` hook — manages streaming state.
3. Create `apps/web/src/app/chat/layout.tsx` + `page.tsx`
   - Page title: "Chat-to-Config".
   - Add "Chat" Sidebar item (icon: `MessageSquare`).
4. `apps/web/src/components/chat/ChatInput.tsx`
   - Textarea + target selector (agent/hook/command).
   - Submit button with loading spinner.
5. `apps/web/src/components/chat/GeneratedPreview.tsx`
   - Shows streaming output in syntax-highlighted `<pre>`.
   - "Save to disk" button → calls `PUT /api/agents/:name` or equivalent.
   - "Copy" button → clipboard.
6. Vitest + `accessibility-audit` on `/chat`.

### ASCII Prototype

┌────────────────────────────────────────────────────────────┐ │ Chat-to-Config │ │ │ │ What would you like to create? │ │ ┌──────────────────────────────────────────────────┐ │ │ │ Create an agent that reviews Go code for │ │ │ │ security vulnerabilities │ │ │ └──────────────────────────────────────────────────┘ │ │ Target: [Agent ▼] [✨ Generate] │ │ │ │ Generated Output: │ │ ┌──────────────────────────────────────────────────┐ │ │ │ --- │ │ │ │ name: security-reviewer │ │ │ │ description: Reviews Go code for vulnerabilities │ │ │ │ tools: [Read, Bash] │ │ │ │ --- │ │ │ │ │ │ │ │ You are a security-focused code reviewer...▌ │ │ │ └──────────────────────────────────────────────────┘ │ │ [💾 Save Agent] [📋 Copy] │ └────────────────────────────────────────────────────────────┘

text


---

## Story 8.2 — Config Diff & Apply

**As a** user,
**I want** to see a diff between the generated config and the existing file
before saving,
**so that** I don't accidentally overwrite important settings.

### Frontend Tasks
1. `apps/web/src/components/chat/ConfigDiff.tsx`
   - Side-by-side diff view: "Current" (left) vs "Generated" (right).
   - Added lines: `bg-chart-cache/10 text-chart-cache` (static).
   - Removed lines: `bg-chart-error/10 text-chart-error` (static).
   - Unchanged lines: default.
2. "Apply Changes" button → calls save endpoint.
3. "Discard" button → goes back to generator.
4. Vitest: `ConfigDiff.test.tsx` — added/removed line classes, apply/discard.
5. `accessibility-audit` on `/chat` (final pass).

---

## Sprint 8 Definition of Done

- [ ] `POST /api/chat/generate` streams SSE response.
- [ ] 503 returned when API key not set.
- [ ] `/chat` page renders input + preview.
- [ ] Diff view shows changes before apply.
- [ ] All build gates pass.
- [ ] All Vitest tests pass.

sprints/sprint-9.md

Markdown

# Sprint 9 — Budget & Safety

**Goal:** Let users set spending budgets and safety limits for agents,
with real-time alerts when thresholds are crossed.

---

## Story 9.1 — Budget Configuration

**As a** user,
**I want** to set daily and monthly token/cost budgets per agent or globally,
**so that** I never accidentally overspend.

### Backend Tasks
1. Create `budgets` table in SQLite:
   ```sql
   CREATE TABLE budgets (
     id INTEGER PRIMARY KEY,
     scope TEXT NOT NULL,        -- "global" | agent name
     period TEXT NOT NULL,       -- "daily" | "monthly"
     limit_usd REAL,
     limit_tokens INTEGER,
     alert_pct INTEGER DEFAULT 80,
     created_at DATETIME DEFAULT CURRENT_TIMESTAMP
   );

    GET /api/budgets — returns all configured budgets.
    POST /api/budgets — creates/updates a budget.
    DELETE /api/budgets/:id.
    GET /api/budgets/status — returns each budget with current spend and pct_used (pure SQL: JOIN with events table, GROUP BY scope and period).
    Tests for all endpoints.

Frontend Tasks

    Interfaces + fetch helpers in api.ts.
    useBudgets and useBudgetStatus hooks.
    Create /budget route + "Budget" Sidebar item (icon: ShieldAlert).
    BudgetForm.tsx — scope selector, period, limit inputs, alert threshold slider.
    BudgetStatusList.tsx
        Progress bar per budget.
        Under 80%: bg-chart-cache (static).
        80–100%: bg-chart-tool (static).
        Over 100%: bg-chart-error (static). Static map BUDGET_STATUS_STYLES.
    Vitest + accessibility-audit on /budget.

Story 9.2 — Real-time Budget Alerts

As a user, I want to receive a UI notification when I hit 80% or 100% of a budget, so that I can take action before overspending.
Backend Tasks

    Background goroutine in cmd/api/main.go:
        Every 60s, check budget status.
        If any budget crosses alert threshold: broadcast WebSocket message: { "type": "budget_alert", "scope": "global", "pct_used": 83, "limit_usd": 10 }.

Frontend Tasks

    Filter budget_alert messages from useBeaconSocket.
    BudgetAlertToast.tsx — shadcn Toast with:
        Warning icon + "80% of daily budget used for agentOS-frontend".
        bg-chart-error/20 text-chart-error for over-limit (static).
        bg-chart-tool/20 text-chart-tool for warning (static).
    Alert history panel: last 10 alerts with timestamps.
    Vitest: BudgetAlertToast.test.tsx.
    accessibility-audit on /budget (final pass).

Sprint 9 Definition of Done

    budgets table created on startup.
    CRUD endpoints for budgets work.
    GET /api/budgets/status returns pct_used via pure SQL.
    Progress bars use correct color classes per threshold.
    WebSocket broadcasts budget alerts when thresholds crossed.
    All build gates pass.
    All Vitest tests pass.

text


---

# `sprints/sprint-10.md`

```markdown
# Sprint 10 — Session Explorer

**Goal:** Provide a full-featured session browser with search, filter,
and deep-dive replay capabilities beyond Sprint 2's basic session list.

---

## Story 10.1 — Advanced Session Search

**As a** user,
**I want** to search and filter sessions by agent, model, date range, and cost,
**so that** I can quickly find specific sessions.

### Backend Tasks
1. Enhance `GET /api/sessions` with query params:
   - `?agent=agentOS-frontend`
   - `?model=claude-opus-4`
   - `?min_cost=0.5&max_cost=2.0`
   - `?from=2026-11-01&to=2026-11-07`
   - `?q=search_term` (matches session_id prefix)
   - All filters combine with AND in SQL WHERE clause.
   - SQL aggregation only — no Go row iteration.
2. Update `TestSessionsHandler_List` to cover filter combinations.

### Frontend Tasks
1. Update `fetchSessions(filters)` in `api.ts`.
2. `SessionFilterBar.tsx`
   - Agent multiselect, model multiselect, date range picker, cost range.
   - "Clear filters" button.
   - Debounced — waits 300ms before fetching.
3. Enhance `SessionList.tsx` with filter bar above table.
4. Persistent filter state in URL search params.
5. Vitest: filter bar tests.
6. `accessibility-audit` on `/analytics` (session section).

---

## Story 10.2 — Session Comparison

**As a** user,
**I want** to select two sessions and compare their token usage side-by-side,
**so that** I can understand what made one session more expensive.

### Frontend Tasks
1. Checkbox on each session row (multi-select, max 2).
2. "Compare" button appears when 2 sessions selected.
3. `SessionComparisonSheet.tsx`
   - Side-by-side layout: Session A (left) | Session B (right).
   - For each: total tokens, cost, event count, model used.
   - Delta row: shows difference (green if A cheaper, red if A more expensive).
     Static classes: `text-chart-cache` / `text-chart-error`.
   - Stacked bar charts for both sessions (reuse SessionEventChart from Story 2.4).
4. Vitest: `SessionComparisonSheet.test.tsx`.
5. `accessibility-audit` on `/analytics` (final pass).

---

## Sprint 10 Definition of Done

- [ ] Session filtering by agent/model/date/cost works via SQL.
- [ ] Filter state persists in URL params.
- [ ] Two-session comparison works and shows deltas.
- [ ] All build gates pass.
- [ ] All Vitest tests pass.

sprints/sprint-11.md

Markdown

# Sprint 11 — Model Intelligence

**Goal:** Surface AI-powered insights about model usage patterns —
which model performs best for each agent, cost efficiency trends,
and automatic model recommendations.

---

## Story 11.1 — Model Performance Matrix

**As a** user,
**I want** to see a matrix of agents vs models showing efficiency scores,
**so that** I can find the best model for each agent.

### Backend Tasks
1. `GET /api/intelligence/matrix`
   - SQL:
     ```sql
     SELECT agent, model,
            COUNT(*) AS events,
            SUM(input_tokens+output_tokens) AS tokens,
            SUM(cost_usd) AS cost_usd,
            ROUND(SUM(cost_usd)/NULLIF(COUNT(*),0), 4) AS avg_cost_per_event
     FROM events
     WHERE timestamp >= ?
     GROUP BY agent, model
     ORDER BY agent, avg_cost_per_event ASC
     ```
   - Returns matrix data for heatmap rendering.
2. `TestIntelligenceHandler_Matrix`.

### Frontend Tasks
1. Create `/intelligence` route + "Intelligence" Sidebar item (icon: `Brain`).
2. `ModelPerformanceMatrix.tsx`
   - CSS grid table: agents as rows, models as columns.
   - Each cell: avg cost per event, colored by relative efficiency.
   - 5 static intensity classes (same pattern as heatmap).
   - Tooltip on hover: exact numbers.
   - `role="grid"` + `role="gridcell"` + `aria-label` on each cell.
3. Vitest + `accessibility-audit` on `/intelligence`.

---

## Story 11.2 — Model Recommendation Engine

**As a** user,
**I want** automatic recommendations for which model to use per agent,
**so that** I can optimize cost without manual analysis.

### Backend Tasks
1. `GET /api/intelligence/recommendations`
   - For each agent: find model with lowest `avg_cost_per_event` (SQL aggregation).
   - If current most-used model != cheapest model: flag as recommendation.
   - Return: `[{ agent, current_model, recommended_model, potential_savings_usd }]`.
   - `potential_savings_usd` computed in Go from aggregated SQL data.

2. `TestIntelligenceHandler_Recommendations`.

### Frontend Tasks
1. `RecommendationCard.tsx`
   - Agent name + current model → recommended model arrow.
   - Savings badge: `bg-chart-cache/20 text-chart-cache` (static).
   - "Apply" button → opens `AgentEditForm` pre-filled (links to Sprint 3).
2. Add to `/intelligence` page below matrix.
3. Vitest + `accessibility-audit` (final pass).

---

## Sprint 11 Definition of Done

- [ ] Matrix endpoint returns correct cross-tabulation.
- [ ] Recommendation endpoint returns savings calculations.
- [ ] `/intelligence` page renders matrix and recommendations.
- [ ] All build gates pass.
- [ ] All Vitest tests pass.

sprints/sprint-12.md

Markdown

# Sprint 12 — ROI Analytics

**Goal:** Calculate and visualize the return on investment of using
AI agents — time saved, cost per task, productivity metrics.

---

## Story 12.1 — ROI Dashboard

**As a** user,
**I want** to see estimated time saved and cost per completed session,
**so that** I can justify the cost of AI agents.

### Backend Tasks
1. Create `tasks` table:
   ```sql
   CREATE TABLE tasks (
     id INTEGER PRIMARY KEY,
     session_id TEXT,
     description TEXT,
     estimated_hours REAL,
     completed_at DATETIME
   );

    POST /api/tasks — log a completed task with time estimate.
    GET /api/roi/summary
        SQL: JOIN tasks with events (by session_id).
        Returns: { total_tasks, total_hours_saved, total_cost_usd, roi_ratio, cost_per_hour_saved }.
        roi_ratio = total_hours_saved * hourly_rate / total_cost_usd (hourly_rate from settings).
    TestROIHandler.

Frontend Tasks

    Create /roi route + "ROI" Sidebar item (icon: TrendingUp).
    ROISummaryCards.tsx — KPI cards: Tasks Completed, Hours Saved, ROI Ratio, Cost/Hour.
    TaskLogger.tsx — form to log a task (session selector, description, hours).
    ROITrendChart.tsx — Recharts LineChart of cumulative hours saved vs cost over time.
    Vitest + accessibility-audit on /roi.

Story 12.2 — Cost Attribution

As a user, I want to tag sessions with project/team labels and see cost per project, so that I can do internal cost attribution.
Backend Tasks

    labels table: { session_id, label, created_at }.
    POST /api/sessions/:id/labels, DELETE /api/sessions/:id/labels/:label.
    GET /api/roi/by-label — cost/tokens/events grouped by label (SQL GROUP BY).

Frontend Tasks

    Label input on SessionDrilldownSheet (from Sprint 2).
    CostByLabelChart.tsx — Recharts PieChart of cost by label. Colors via useChartColors().
    Add to /roi page.
    Vitest + accessibility-audit (final pass).

Sprint 12 Definition of Done

    tasks and labels tables created.
    ROI summary computed via SQL JOINs.
    Cost attribution by label works.
    /roi page renders all components.
    All build gates pass.
    All Vitest tests pass.

text


---

# `sprints/sprint-13.md`

```markdown
# Sprint 13 — Auto-Discovery

**Goal:** Automatically detect and onboard new agents, hooks, and skills
when files are added to the `.claude/` directory — without requiring a restart.

---

## Story 13.1 — File System Watcher

**As a** user,
**I want** new agents/hooks/skills to appear in the UI automatically
when I add their config files,
**so that** I don't have to restart the server.

### Backend Tasks
1. Add `fsnotify` dependency (Go file system watcher).
2. `apps/api/internal/watcher/watcher.go`
   - Watch `.claude/agents/`, `.claude/hooks/`, `.claude/skills/`, `.claude/commands/`.
   - On CREATE or WRITE: re-parse affected directory, broadcast WebSocket:
     `{ "type": "config_changed", "scope": "agents|hooks|skills|commands" }`.
   - Debounce: ignore events within 500ms of last event.
3. Start watcher in `cmd/api/main.go`.
4. `TestWatcher` — create temp file, assert event fired within 1s.

### Frontend Tasks
1. Listen for `config_changed` messages in `useBeaconSocket`.
2. On `config_changed` for `agents`: invalidate `useAgents` cache (force refetch).
3. Same for hooks, skills, commands.
4. Toast: "New agent detected: {name}" etc.
5. Vitest: mock WebSocket message, assert cache invalidation called.

---

## Story 13.2 — Discovery Dashboard

**As a** user,
**I want** a feed of recently discovered/changed configs,
**so that** I have an audit trail of configuration changes.

### Backend Tasks
1. `config_events` table:
   ```sql
   CREATE TABLE config_events (
     id INTEGER PRIMARY KEY,
     type TEXT,       -- "created" | "updated" | "deleted"
     scope TEXT,      -- "agent" | "hook" | "skill" | "command"
     name TEXT,
     timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
   );

    Watcher writes to this table on each event.
    GET /api/config-events?limit=50 — returns recent events.

Frontend Tasks

    ConfigEventFeed.tsx — chronological list of config changes. Type icons: FilePlus (created), FilePen (updated), FileX (deleted).
    Add to a new /discovery route or embed in Sidebar footer.
    Vitest + accessibility-audit.

Sprint 13 Definition of Done

    fsnotify watcher fires on file changes in .claude/.
    WebSocket broadcasts config_changed on file events.
    UI auto-refreshes relevant section on config_changed.
    config_events table records all changes.
    All build gates pass.
    All Vitest tests pass.

text


---

# `sprints/sprint-14.md`

```markdown
# Sprint 14 — Dependency Map

**Goal:** Show how agents depend on each other, which tools they share,
and identify bottlenecks or single points of failure in the agent system.

---

## Story 14.1 — Agent Dependency Graph

**As a** user,
**I want** to see which agents call each other or share tools,
**so that** I can understand coupling and reduce bottlenecks.

### Backend Tasks
1. `GET /api/graph/dependencies`
   - SQL: analyze events to find agent→agent co-occurrences within same session.
     ```sql
     SELECT a.agent AS from_agent, b.agent AS to_agent, COUNT(*) AS sessions
     FROM events a JOIN events b ON a.session_id = b.session_id
     WHERE a.agent < b.agent
     GROUP BY a.agent, b.agent
     HAVING sessions > 1
     ```
   - Also: shared tool analysis (agents using same tool_name).
   - Returns: `{ agent_links: [], tool_sharing: [] }`.

2. `TestGraphHandler_Dependencies`.

### Frontend Tasks
1. `DependencyGraph.tsx` (React Flow)
   - Agent nodes sized by event count.
   - Edge thickness = session co-occurrence count.
   - Color by coupling strength:
     Static class map: `COUPLING_STYLES` with low/medium/high string literals.
   - Highlight path between two selected agents.
2. Create `/flow/dependencies` sub-route.
3. Vitest + `accessibility-audit` on `/flow`.

---

## Story 14.2 — Bottleneck Detector

**As a** user,
**I want** to see which tools or agents are most critical (most depended-on),
**so that** I know where to focus reliability improvements.

### Backend Tasks
1. `GET /api/intelligence/bottlenecks`
   - SQL: rank agents/tools by in-degree (times referenced by others).
   - Return top 5 bottleneck agents and top 5 bottleneck tools.

### Frontend Tasks
1. `BottleneckList.tsx`
   - Two ranked lists: agents and tools.
   - Rank badge: `bg-chart-error` for rank 1 (static), `bg-chart-tool` for 2–3.
   - Risk score bar.
2. Add to `/intelligence` page (Sprint 11).
3. Vitest + `accessibility-audit` (final pass).

---

## Sprint 14 Definition of Done

- [ ] Dependency graph endpoint returns agent and tool links.
- [ ] Bottleneck endpoint ranks by in-degree.
- [ ] React Flow dependency graph renders with correct edge weights.
- [ ] All build gates pass.
- [ ] All Vitest tests pass.

sprints/sprint-15.md

Markdown

# Sprint 15 — Team & Marketplace

**Goal:** Enable team mode with PostgreSQL backend, user accounts,
shared dashboards, and a marketplace for sharing agent configs.

**⚠️ Note:** This sprint switches from SQLite to PostgreSQL when
`DATABASE_URL` env var is set. SQLite remains default for local mode.
All SQL must be compatible with both dialects (avoid SQLite-only syntax).

---

## Story 15.1 — Team Mode & PostgreSQL Support

**As a** team,
**I want** to connect AgentOS to a shared PostgreSQL database,
**so that** multiple developers can see each other's agent activity.

### Backend Tasks
1. Abstract DB layer: create `apps/api/internal/db/driver.go`
   - Interface `DBDriver` with methods matching current SQLite usage.
   - `SQLiteDriver` (existing).
   - `PostgresDriver` (new) — uses `lib/pq` or `pgx`.
   - `NewDB(databaseURL string) DBDriver` factory.
2. Update `cmd/api/main.go` to read `DATABASE_URL` env var.
3. All queries must work on both SQLite and PostgreSQL.
4. `TestPostgresDriver` — integration test using `testcontainers-go` (skip if Docker unavailable).

### Frontend Tasks
1. Settings page (`/settings`) — add "Database Mode" indicator.
2. `TeamModeIndicator.tsx` — badge showing "Local (SQLite)" or "Team (PostgreSQL)".
3. `GET /api/settings` endpoint returning `{ mode, version, uptime }`.
4. Vitest + `accessibility-audit` on `/settings`.

---

## Story 15.2 — Agent Marketplace

**As a** user,
**I want** to browse and install community agent configs,
**so that** I don't have to build everything from scratch.

### Backend Tasks
1. `GET /api/marketplace/agents`
   - Reads from a local `marketplace.json` registry file (bundled with the app).
   - Later: fetch from `https://registry.agentos.dev` (optional, timeout 3s, fallback to local).
   - Returns: `[{ name, description, tools, author, stars, downloads }]`.
2. `POST /api/marketplace/install/:name`
   - Copies agent template to `.claude/agents/{name}.md`.
   - Returns installed AgentConfig.

### Frontend Tasks
1. `MarketplaceGrid.tsx` — cards with star count, download count, install button.
2. Install confirmation dialog.
3. After install: `config_changed` WebSocket event triggers auto-discovery (Sprint 13).
4. Add "Marketplace" Sidebar item (icon: `Store`).
5. Vitest + `accessibility-audit` on `/marketplace`.

---

## Sprint 15 Definition of Done

- [ ] PostgreSQL driver works when `DATABASE_URL` is set.
- [ ] SQLite remains default with no config change.
- [ ] Marketplace lists and installs agents.
- [ ] Auto-discovery fires after install.
- [ ] All build gates pass on both DB modes.
- [ ] All Vitest tests pass.

sprints/sprint-16.md

Markdown

# Sprint 16 — What-If Simulator

**Goal:** Let users simulate the cost and token impact of switching models,
changing agent configurations, or running different workloads —
before making real changes.

---

## Story 16.1 — Model Switch Simulator

**As a** user,
**I want** to simulate "what if I used claude-haiku-3 instead of claude-opus-4
for all my frontend tasks?",
**so that** I can estimate savings before making the switch.

### Backend Tasks
1. `POST /api/simulate/model-switch`
   - Body: `{ "agent": "agentOS-frontend", "from_model": "claude-opus-4", "to_model": "claude-haiku-3", "range": "30d" }`
   - SQL: fetch actual token counts for that agent in range.
   - Apply target model's pricing (from a bundled `pricing.json`):
     ```json
     {
       "claude-opus-4":   { "input": 15.00, "output": 75.00 },
       "claude-sonnet-4": { "input":  3.00, "output": 15.00 },
       "claude-haiku-3":  { "input":  0.25, "output":  1.25 }
     }
     ```
     (prices per million tokens)
   - Return:
     ```json
     {
       "actual_cost_usd": 5.43,
       "simulated_cost_usd": 0.47,
       "savings_usd": 4.96,
       "savings_pct": 91.3,
       "token_count": 190879,
       "caveat": "Quality impact not modeled"
     }
     ```
   - All math in Go using SQL-aggregated token counts.

2. `TestSimulateHandler_ModelSwitch`.

### Frontend Tasks
1. Create `/simulate` route + "Simulate" Sidebar item (icon: `FlaskConical`).
2. `ModelSwitchSimulator.tsx`
   - Agent selector, from-model, to-model, range.
   - "Run Simulation" button.
   - Results card:
     - Actual cost vs Simulated cost (big numbers).
     - Savings badge: `bg-chart-cache/20 text-chart-cache` (static).
     - Savings % bar.
     - Caveat disclaimer in `<p className="text-slate-400 text-xs">`.
3. Vitest + `accessibility-audit` on `/simulate`.

### ASCII Prototype

┌────────────────────────────────────────────────────────────┐ │ What-If Simulator │ │ │ │ Agent: [agentOS-frontend ▼] │ │ Switch from [claude-opus-4 ▼] to [claude-haiku-3 ▼] │ │ Period: [30d ▼] [▶ Simulate] │ │ │ │ ┌─────────────────────────────────────────────────────┐ │ │ │ Actual Cost Simulated Cost Savings │ │ │ │ $5.43 $0.47 $4.96 (91.3%) │ │ │ │ │ │ │ │ ████████████████████░░░░░░░░░░░░░░░░░░░ 91% saved │ │ │ │ │ │ │ │ ⚠️ Quality impact not modeled │ │ │ └─────────────────────────────────────────────────────┘ │ └────────────────────────────────────────────────────────────┘

text


---

## Story 16.2 — Workload Simulator

**As a** user,
**I want** to simulate "what if I ran 10x more sessions next month?",
**so that** I can project infrastructure and budget needs.

### Backend Tasks
1. `POST /api/simulate/workload`
   - Body: `{ "multiplier": 10, "range": "30d" }`
   - SQL: fetch actual totals for range.
   - Return: `{ base_cost_usd, base_tokens, projected_cost_usd, projected_tokens, multiplier }`.

2. `TestSimulateHandler_Workload`.

### Frontend Tasks
1. `WorkloadSimulator.tsx`
   - Multiplier slider (1x → 100x).
   - Live-updating projected cost and token count as slider moves.
   - Recharts AreaChart: actual (solid) vs projected (dashed) cost curve.
     Actual: `stroke="var(--chart-cost)"`.
     Projected: `strokeDasharray="4 2" stroke="var(--chart-error)"`.
   - Budget warning if projected cost exceeds any configured budget (Sprint 9).
2. Add to `/simulate` page below `ModelSwitchSimulator`.
3. Vitest: `WorkloadSimulator.test.tsx`
   - Slider changes update projected values.
   - Budget warning appears when over limit.
4. `accessibility-audit` on `/simulate` (final pass).

---

## Story 16.3 — Simulation History

**As a** user,
**I want** to save and compare past simulations,
**so that** I can track my planning decisions over time.

### Backend Tasks
1. `simulations` table:
   ```sql
   CREATE TABLE simulations (
     id INTEGER PRIMARY KEY,
     type TEXT,              -- "model_switch" | "workload"
     params TEXT,            -- JSON
     result TEXT,            -- JSON
     created_at DATETIME DEFAULT CURRENT_TIMESTAMP
   );

    Auto-save every simulation run.
    GET /api/simulate/history?limit=20.
    TestSimulateHandler_History.

Frontend Tasks

    SimulationHistory.tsx — table of past simulations. Type badge: static class map SIM_TYPE_STYLES. Click row → restore params and show result.
    "Compare" mode: select two simulations, show side-by-side result diff.
    Add to /simulate page as collapsible section.
    Vitest + accessibility-audit (final pass for entire sprint).

Sprint 16 Definition of Done

    Model switch simulator returns correct savings calculation.
    Workload simulator scales actual data by multiplier.
    Simulations auto-saved to simulations table.
    History table with restore and compare.
    /simulate page renders all three components.
    Budget warning fires when projected cost exceeds limit.
    All build gates pass.
    All Vitest tests pass.
    accessibility-audit documented for /simulate.
    AgentOS is COMPLETE — all 17 sprints delivered.

🎉 Project Completion Checklist

When Sprint 16 Story 16.3 is marked DONE, verify:

    All 41 stories delivered across Sprints 0–16.
    go test -p 1 ./... passes on clean checkout.
    npm run test — all Vitest tests pass.
    npm run build — all pages build without error.
    Zero hardcoded hex values anywhere in the codebase.
    All Tailwind classes are complete static string literals.
    accessibility-audit documented for every page.
    sprints/ROADMAP.md — all stories marked ✅.
    README.md updated with full feature list and screenshots.
    MIT license confirmed in LICENSE.
