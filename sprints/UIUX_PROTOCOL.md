# AgentOS UI/UX Engineering Protocol

This protocol applies to every Sprint 3+ story in AgentOS.

AgentOS is a local-first AI agent monitoring and configuration platform:
**"The Operating System for AI Agents"**

It is a professional developer-facing SaaS-style dashboard for observing,
configuring, analyzing, and improving Claude Code agents.

---

## Current Project State

### Completed Sprints

- Sprint 0 — Foundation & Architecture ✅
- Sprint 1 — Overview Dashboard ✅
- Sprint 2 — Token Analytics ✅

### Current Major Routes

- `/dashboard`
- `/analytics`
- `/agents` — Sprint 3
- `/commands` — Sprint 4
- `/hooks` — Sprint 5
- `/skills` — Sprint 6
- `/flow` — Sprint 7
- `/chat` — Sprint 8
- `/budget` — Sprint 9
- `/intelligence` — Sprint 11
- `/roi` — Sprint 12
- `/simulate` — Sprint 16

---

## Current Technology Stack

- Frontend: Next.js 14 App Router
- Language: TypeScript, strict mode
- Styling: Tailwind CSS
- Component primitives: shadcn/ui + Radix
- Charts: Recharts
- Graphs: React Flow
- State: Zustand
- Motion: framer-motion
- Icons: lucide-react
- Testing: Vitest + React Testing Library
- Backend: Go + Chi
- Database: SQLite local-first, PostgreSQL in team mode later
- Realtime: WebSocket

---

## Existing UI/UX Infrastructure

The following already exist and must be reused:

- `apps/web/src/lib/animations.ts`
- `apps/web/src/hooks/useReducedMotion.ts`
- `apps/web/src/components/shared/Skeleton.tsx`
- `apps/web/src/components/shared/DataTooltip.tsx`
- `apps/web/src/components/shared/EmptyState.tsx`
- `apps/web/src/components/shared/ErrorBoundary.tsx`
- `docs/design-system/MASTER.md`
- `docs/design-system/COMPONENTS.md`
- `docs/design-system/ACCESSIBILITY.md`
- `docs/design-system/RESPONSIVE.md`
- `docs/design-system/ANIMATIONS.md`

---

# Mandatory UI/UX Story Protocol

Every story that adds or changes frontend code must follow these phases.

---

## Phase 1 — Understand the Current Project Delta

Before implementation:

1. Read:
   - `sprints/ROADMAP.md`
   - current sprint file
   - `sprints/UIUX_PROTOCOL.md`
   - `.claude/CLAUDE.md`
   - relevant design-system docs
2. Inspect the route/component being modified.
3. Identify:
   - Existing visual pattern
   - Existing responsive behavior
   - Existing loading/empty/error state pattern
   - Existing motion behavior
   - Existing accessibility semantics
4. Do not redesign globally unless explicitly requested.

Completion Report must mention what was inspected.

---

## Phase 2 — Apply Installed UI/UX Skills

Do not reinstall skills unless missing.

Use the already installed project-level skills:

- `frontend-design`
- `ui-ux-pro-max`
- `bencium-controlled-ux`
- `web-design-guidelines`
- `react-best-practices`
- `composition-patterns`
- `accessibility-audit`

For every frontend story:

1. Use UI/UX Pro Max for visual/system consistency.
2. Use Frontend Design for product visual direction.
3. Use Bencium Controlled UX for enterprise developer-tool behavior.
4. Use Web Design Guidelines for layout, responsive, and page structure.
5. Use React Best Practices and Composition Patterns for implementation.
6. Run accessibility-audit on every new page or major component.

---

## Phase 3 — Design System Alignment

Every new component must align with:

- Existing dark dashboard visual language.
- Static Tailwind class strings only.
- Existing CSS variables and chart tokens.
- Existing spacing scale.
- Existing card/table/sheet patterns.
- Existing motion tokens.
- Existing skeleton, empty, error, tooltip primitives.

Do not introduce duplicate primitives unless necessary.

---

## Phase 4 — Visual Design Requirements

Every new feature must include:

- Clear hierarchy.
- Professional density suitable for developer dashboards.
- No decorative noise.
- Consistent cards, tables, sheets, tooltips, and badges.
- Loading skeleton if data is async.
- Empty state if data can be absent.
- ErrorBoundary if component fetches or renders remote data.
- Responsive layout for mobile/tablet/desktop.

---

## Phase 5 — Interaction & Motion Requirements

Use motion only when it communicates state or improves comprehension.

Allowed motion patterns:

- `slideUp` for list/card entry.
- `scaleIn` for badges and status chips.
- `fadeIn` for empty/loading transitions.
- `staggerContainer` / `staggerItem` for grids.
- `layoutId` for active nav/range pills.
- Row layout animation for sorting/reordering.
- Reduced motion fallback via `useReducedMotion`.

Do not add arbitrary or slow animations.

All animation must respect:

- `prefers-reduced-motion`
- `useReducedMotion()`
- WCAG 2.3.3

---

## Phase 6 — Accessibility Requirements

Every new or modified UI must verify:

- Keyboard navigation.
- Enter/Space activation for clickable rows/cards.
- Escape closes sheets/dialogs.
- Focus visible.
- Semantic headings and landmarks.
- ARIA labels on icon-only controls.
- `aria-sort` on sortable tables.
- `role="grid"` / `role="gridcell"` for grid data visualizations.
- `sr-only` alternatives for charts.
- Skeletons use `aria-hidden="true"` or `role="status"` as appropriate.
- Tooltips are keyboard accessible.
- Touch targets are usable on mobile.

---

## Phase 7 — Engineering Requirements

All frontend stories must include Vitest tests.

Required test categories:

- Component renders expected content.
- Empty state.
- Loading state if async.
- Error state if boundary used.
- Keyboard interaction.
- ARIA attributes.
- Sorting/filtering interactions if applicable.
- Reduced motion hook behavior if animation logic is significant.

All backend stories must include Go tests.

---

## Phase 8 — Security & Hygiene Requirements

Always validate:

- Query params via allowlists.
- Path params via regex.
- Session IDs using:
  `^[a-zA-Z0-9_\-]{4,128}$`
- Ranges using known allowlist.
- No SQL injection via dynamic identifiers.
- No raw filesystem path traversal.
- No command execution without allowlist.

---

## Mandatory Color Rules

Never use:

- hardcoded hex
- raw `rgb(`
- raw `rgba(`
- raw numeric `hsl(`
- dynamic Tailwind class construction

Forbidden examples:

```ts
`bg-chart-${type}`
"rgba(59,130,246,0.3)"
"#3b82f6"
"hsl(217 91% 60%)"

Allowed examples:

TypeScript

"bg-chart-agent/20 text-chart-agent border-chart-agent/30"
"shadow-[0_0_8px_hsl(var(--chart-agent)/0.35)]"
"stroke-[hsl(var(--chart-cost))]"

Every completion report must include proof:

Bash

grep -RInE "#[0-9a-fA-F]{3,8}|rgba?\(|hsl\([0-9]" apps/web/src/components apps/web/src/lib apps/web/src/hooks apps/web/src/app

Expected: no matches.
Mandatory Build Gates

Every story must run:

Bash

cd apps/api
go build ./...
go test -p 1 ./...

cd apps/web
npm run test
npm run type-check
npm run build

All must exit 0.
Mandatory Completion Report Sections

Every story report must include:

    Executive Summary
    Instruction Coverage Table
    UI/UX Skill Application Summary
    Backend Proof
    Frontend Proof
    Accessibility Audit Summary
    Design System Updates
    Security/Hygiene Notes
    Test & Build Terminal Proof
    Raw Color / Static Tailwind Proof
    Next Steps

The Instruction Coverage Table must list every task from the prompt with:

    DONE
    SKIPPED
    BLOCKED

and must include terminal proof.

The Next Steps section must quote the next story ID and title verbatim from sprints/ROADMAP.md.

text


---

## `sprints/sprint-3.md`

```markdown
# Sprint 3 — Agent Manager

**Goal:** Give users full visibility and control over Claude Code agents by reading,
displaying, inspecting, and editing `.claude/agents/*.md`.

**Status:** NEXT UP

**Important:** `GET /api/agents` belongs to this sprint only.

---

## Sprint-Level UI/UX Requirements

All stories must follow:

- `sprints/UIUX_PROTOCOL.md`
- Existing AgentOS motion system
- Existing Skeleton, EmptyState, ErrorBoundary, DataTooltip primitives
- accessibility-audit on `/agents`
- static Tailwind class literals only
- zero raw hex/rgb/rgba/numeric hsl

The `/agents` page should feel like a professional configuration console:
dense enough for developers, but visually structured and safe for editing.

---

## Story 3.1 — Agent Config Reader

**As a** user,  
**I want** to see all configured Claude Code agents,  
**so that** I can understand what agents exist and what tools they can use.

### Backend Tasks

1. Create `apps/api/internal/agentconfig/parser.go`.
2. Scan `.claude/agents/*.md` from a configurable base path.
3. Parse YAML frontmatter:
   - `name`
   - `description`
   - `tools`
4. Return:

```go
type AgentConfig struct {
    Name        string    `json:"name"`
    Description string    `json:"description"`
    Tools       []string  `json:"tools"`
    FilePath    string    `json:"file_path"`
    UpdatedAt   time.Time `json:"updated_at"`
}

    If .claude/agents/ does not exist, return [], not error.
    Add GET /api/agents.
    Support ?refresh=true if cache exists.
    Add:
        TestAgentConfigParser
        TestAgentsHandler

Frontend Tasks

    Add AgentConfig interface and fetchAgents() in api.ts.
    Create useAgents hook:
        60s polling
        clearInterval cleanup
        WebSocket refresh on config_changed if available
    Create:
        apps/web/src/app/agents/layout.tsx
        apps/web/src/app/agents/page.tsx
    Add "Agents" nav item to Sidebar with Bot icon.
    Create components/agents/AgentCard.tsx.
        name
        description
        tools
        updated time
        aria-label="Agent: {name}"
        keyboard accessible if clickable
        subtle slideUp entrance
    Create components/agents/AgentGrid.tsx.
        responsive grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
        loading skeletons
        empty state with Bot icon
        ErrorBoundary wrapper

UI/UX Requirements

    Use card grid with professional config-console density.
    Tool badges use static classes: bg-chart-tool/15 text-chart-tool border-chart-tool/30
    Add DataTooltip explaining tool permissions.
    Use staggered card reveal.
    Reduced motion must disable entrance motion.

Tests

    AgentCard.test.tsx
    AgentGrid.test.tsx
    useAgents.test.ts if hook has non-trivial logic
    backend parser and handler tests

Accessibility

Run accessibility-audit on /agents.

Document in:

txt

docs/design-system/AUDIT-sprint3.md

Story 3.2 — Agent Detail & Live Stats

As a user,
I want to click an agent and see its full config plus live usage stats,
so that I can understand each agent's activity and cost.
Backend Tasks

    Add GET /api/agents/:name.
    Return:

JSON

{
  "config": {
    "name": "agentOS-frontend",
    "description": "...",
    "tools": [],
    "file_path": "...",
    "updated_at": "..."
  },
  "stats": {
    "total_tokens": 141635,
    "total_cost_usd": 1.6605,
    "total_events": 44,
    "last_seen": "2026-11-07T12:04:00Z"
  }
}

    SQL aggregation:

SQL

SELECT
  SUM(input_tokens + output_tokens),
  SUM(cost_usd),
  COUNT(*),
  MAX(timestamp)
FROM events
WHERE agent = ?

    Validate :name.
    Return 404 if config not found.
    Add TestAgentsHandler_Detail.

Frontend Tasks

    Add AgentDetail interface and fetchAgentDetail(name).
    Create useAgentDetail(name).
    Create AgentDetailSheet.tsx.
        shadcn Sheet
        agent name
        description
        raw frontmatter preview
        stats grid
        tools list
        close button with aria-label
    Clicking / Enter / Space on AgentCard opens sheet.
    Use Skeleton while detail loads.

UI/UX Requirements

    Sheet enters from right using existing sheet motion.
    Stats use existing KPI/card visual language.
    ErrorBoundary isolates sheet content.
    Include sr-only summary of agent stats.

Tests

    AgentDetailSheet.test.tsx
    keyboard open test from AgentCard

Accessibility

Re-run accessibility-audit on /agents.
Story 3.3 — Agent Config Editor

As a user,
I want to edit an agent's frontmatter in the UI,
so that I can tune agent behavior without opening a text editor.
Backend Tasks

    Add PUT /api/agents/:name.
    Body:

JSON

{
  "description": "...",
  "tools": ["Read", "Write", "Bash"]
}

    Preserve markdown body after frontmatter.
    Replace only YAML frontmatter.
    Validate:
        agent exists
        description non-empty
        tools is non-empty string array
    Use temp directory in tests.
    Add TestAgentsHandler_Update.

Frontend Tasks

    Add updateAgent(name, patch) in api.ts.
    Create AgentEditForm.tsx.
        Textarea description
        Input tools comma-separated
        Save / Cancel
        loading state
        success/error toast
    Integrate edit mode into AgentDetailSheet.
    After save, refresh AgentGrid and detail.

UI/UX Requirements

    Form validation inline.
    Save button disabled while invalid/loading.
    Motion: edit form uses fadeIn, not large transitions.
    Keep destructive edits visually cautious.

Tests

    AgentEditForm.test.tsx
    save success
    validation
    cancel resets
    error toast

Accessibility

Final accessibility-audit on /agents.
Sprint 3 Definition of Done

    GET /api/agents
    GET /api/agents/:name
    PUT /api/agents/:name
    /agents route implemented
    Agent grid, detail sheet, and edit form implemented
    Skeleton, EmptyState, ErrorBoundary used
    Motion respects reduced motion
    Static Tailwind classes only
    No hex/rgb/rgba/numeric hsl
    Vitest tests pass
    Go tests pass
    Type-check passes
    Build passes
    accessibility-audit documented

text


---

## `sprints/sprint-4.md`

```markdown
# Sprint 4 — Command Center

**Goal:** Let users browse, inspect, and run Claude Code slash commands from AgentOS.

---

## Sprint-Level UI/UX Requirements

Follow `sprints/UIUX_PROTOCOL.md`.

The Command Center must feel like a safe local execution console:
clear, restrained, keyboard-friendly, and explicit about command risk.

---

## Story 4.1 — Command Library Browser

**As a** user,  
**I want** to browse `.claude/commands/*.md`,  
**so that** I know what slash commands are available.

### Backend Tasks

1. Create `internal/commandconfig/parser.go`.
2. Scan `.claude/commands/*.md`.
3. Parse:
   - filename as command name
   - optional frontmatter
   - first H1 as title
   - first paragraph as description
   - full body
4. Add `GET /api/commands`.
5. Add parser and handler tests.

### Frontend Tasks

1. Add `CommandConfig` and `fetchCommands()`.
2. Add `useCommands()` with 60s polling and cleanup.
3. Create `/commands`.
4. Add Sidebar item with `Terminal` icon.
5. Create:
   - `CommandList.tsx`
   - `CommandDetailSheet.tsx`
6. Command rows:
   - clickable
   - Enter/Space support
   - `aria-label="Open command /{name}"`
7. Detail sheet:
   - full markdown body in readable code/prose area
   - Run button disabled until Story 4.2

### UI/UX Requirements

- Use monospace command labels.
- Use Skeleton rows while loading.
- EmptyState if no commands.
- DataTooltip explaining local-only command execution.
- Motion: row `slideUp`, sheet standard right slide.

### Tests

- `CommandList.test.tsx`
- `CommandDetailSheet.test.tsx`

### Accessibility

Run accessibility-audit on `/commands`.

---

## Story 4.2 — Command Runner with Live Output

**As a** user,  
**I want** to run a slash command and see live output,  
**so that** I can trigger workflows without leaving AgentOS.

### Backend Tasks

1. Add `POST /api/commands/:name/run`.
2. Body:

```json
{ "args": "1 4" }

    Allowlist command names from parsed command files.
    Spawn local Claude command.
    Stream stdout/stderr over WebSocket:

JSON

{
  "type": "command_output",
  "command": "/sprint",
  "line": "...",
  "ts": "..."
}

    On exit:

JSON

{
  "type": "command_done",
  "command": "/sprint",
  "exit_code": 0
}

    Only one command at a time. Return 409 if busy.
    Timeout after 300s.
    Tests must mock subprocess execution.

Frontend Tasks

    Add runCommand(name, args).
    Create CommandRunner.tsx.
        args input
        Run button
        busy state
        live terminal output
        Clear button
        exit badge
    Integrate into CommandDetailSheet.

UI/UX Requirements

    Terminal output uses monospace.
    Output area uses role="log" and aria-live="polite".
    Busy state uses subtle pulse, not distracting animation.
    Exit badges use static style map:
        success: bg-chart-cache/20 text-chart-cache
        failure: bg-chart-error/20 text-chart-error

Tests

    CommandRunner.test.tsx
    backend run handler tests

Accessibility

Final accessibility-audit on /commands.
Sprint 4 Definition of Done

    GET /api/commands
    POST /api/commands/:name/run
    WebSocket command output streaming
    /commands route implemented
    Command runner accessible
    Live output terminal accessible
    All tests/build gates pass

text


---

## `sprints/sprint-5.md`

```markdown
# Sprint 5 — Hook Manager

**Goal:** Let users view, toggle, edit, add, and delete Claude Code hooks.

---

## Sprint-Level UI/UX Requirements

Follow `sprints/UIUX_PROTOCOL.md`.

Hook Manager must communicate automation clearly and safely.
Users must understand when hooks execute and what command they run.

---

## Story 5.1 — Hook Config Viewer

**As a** user,  
**I want** to see hooks from `.claude/hooks/hooks.json`,  
**so that** I understand automation attached to my agent workflow.

### Backend Tasks

1. Create `internal/hookconfig/parser.go`.
2. Read `.claude/hooks/hooks.json`.
3. Parse hook groups:
   - `PreToolUse`
   - `PostToolUse`
   - `Stop`
4. Add `GET /api/hooks`.
5. Add parser and handler tests.

### Frontend Tasks

1. Add `HookEntry`, `HookConfig`, and `fetchHooks()`.
2. Add `useHooks()`.
3. Create `/hooks`.
4. Add Sidebar item with `Zap` icon.
5. Create `HookList.tsx`.

### UI/UX Requirements

- Three clear sections.
- Hook type badges:
  - pre: `bg-chart-agent/15 text-chart-agent border-chart-agent/30`
  - post: `bg-chart-tool/15 text-chart-tool border-chart-tool/30`
  - stop: `bg-chart-error/15 text-chart-error border-chart-error/30`
- Command text monospace.
- DataTooltip explains hook lifecycle.
- Skeleton and EmptyState required.

### Tests

- `HookList.test.tsx`

### Accessibility

Run accessibility-audit on `/hooks`.

---

## Story 5.2 — Hook Editor & Toggle

**As a** user,  
**I want** to enable/disable and edit hooks,  
**so that** I can customize automation safely.

### Backend Tasks

1. Add `PUT /api/hooks`.
2. Validate full hook config.
3. Reject empty matcher or command.
4. Write to temp file in tests.
5. Add `TestHooksHandler_Update`.

### Frontend Tasks

1. Add `updateHooks(config)`.
2. Add toggle switch on each hook row.
3. Create `HookEditSheet.tsx`.
4. Add Hook button.
5. Delete with confirmation dialog.

### UI/UX Requirements

- Destructive delete requires confirmation.
- Toggle must show immediate feedback.
- Edit sheet uses form validation.
- Disabled hooks visually muted but readable.
- Reduced motion respected.

### Tests

- `HookEditSheet.test.tsx`
- toggle test
- delete confirmation test

### Accessibility

Final accessibility-audit on `/hooks`.

---

## Sprint 5 Definition of Done

- [ ] `GET /api/hooks`
- [ ] `PUT /api/hooks`
- [ ] `/hooks` route
- [ ] Hook viewer, editor, toggle, add, delete
- [ ] Accessibility documented
- [ ] All build gates pass

sprints/sprint-6.md

Markdown

# Sprint 6 — Skill & MCP Store

**Goal:** Browse installed skills and configured MCP servers.

---

## Sprint-Level UI/UX Requirements

Follow `sprints/UIUX_PROTOCOL.md`.

This sprint exposes capability inventory. The UI must help users understand
what their agents can do and what external integrations are available.

---

## Story 6.1 — Skill Browser

**As a** user,  
**I want** to see installed skills under `.claude/skills`,  
**so that** I understand available agent capabilities.

### Backend Tasks

1. Create `internal/skillconfig/parser.go`.
2. Scan `.claude/skills/*/`.
3. Read README or SKILL.md.
4. Return:

```json
[
  {
    "name": "accessibility-audit",
    "description": "...",
    "path": "...",
    "files": []
  }
]

    Add GET /api/skills.
    Add parser and handler tests.

Frontend Tasks

    Add SkillConfig, fetchSkills(), useSkills().
    Create /skills.
    Add Sidebar item with Sparkles.
    Create:
        SkillCard.tsx
        SkillDetailSheet.tsx

UI/UX Requirements

    Cards show name, description, file count.
    Detail sheet shows README/SKILL content.
    Skeleton grid.
    EmptyState with Sparkles icon.
    Motion: staggered card reveal.

Tests

    SkillCard.test.tsx
    SkillDetailSheet.test.tsx

Accessibility

Run accessibility-audit on /skills.
Story 6.2 — MCP Server Registry

As a user,
I want to see MCP servers and their status,
so that I know which integrations are available.
Backend Tasks

    Read MCP config from .claude/settings.json or mcp.json.
    Add GET /api/mcp.
    Return:

JSON

[
  {
    "name": "github",
    "url": "...",
    "type": "stdio|http",
    "status": "online|offline|unknown"
  }
]

    Status check timeout: 2s.
    Add handler tests.

Frontend Tasks

    Add MCPServer, fetchMCP(), useMCP().
    Create MCPServerList.tsx.
    Add to /skills.

UI/UX Requirements

    Status style map:
        online: bg-chart-cache
        offline: bg-chart-error
        unknown: bg-slate-500
    Status dot has aria-label.
    DataTooltip explains MCP transport.

Tests

    MCPServerList.test.tsx

Accessibility

Final accessibility-audit on /skills.
Sprint 6 Definition of Done

    GET /api/skills
    GET /api/mcp
    /skills route
    Skill cards and MCP status list
    Tests/build/a11y pass

text


---

## `sprints/sprint-7.md`

```markdown
# Sprint 7 — Visual Flow Graph

**Goal:** Render live and replayable React Flow graphs of agent activity.

---

## Sprint-Level UI/UX Requirements

Follow `sprints/UIUX_PROTOCOL.md`.

Graphs must always include accessible non-visual alternatives.
Every graph must provide either an `sr-only` table or textual summary.

---

## Story 7.1 — Agent Topology Graph

**As a** user,  
**I want** to see agents connected to tools,  
**so that** I can understand system topology.

### Backend Tasks

1. Add `GET /api/graph/topology`.
2. SQL aggregation:

```sql
SELECT agent, tool_name, COUNT(*) AS calls
FROM events
WHERE tool_name IS NOT NULL
GROUP BY agent, tool_name

    Return React Flow-compatible nodes and edges.
    Add TestGraphHandler_Topology.

Frontend Tasks

    Add graph types and fetchTopology().
    Add useTopology().
    Create /flow.
    Add Sidebar item with GitBranch.
    Create AgentFlowGraph.tsx.

UI/UX Requirements

    Agent nodes use agent token styling.
    Tool nodes use tool token styling.
    Edge labels show call count.
    MiniMap and controls.
    Skeleton while loading.
    EmptyState if no graph data.
    sr-only table of connections.
    ErrorBoundary around graph.

Tests

    AgentFlowGraph.test.tsx

Accessibility

Run accessibility-audit on /flow.
Story 7.2 — Session Flow Replay

As a user,
I want to replay a session as a flow graph,
so that I understand execution sequence.
Backend Tasks

    Add GET /api/graph/session/:session_id.
    Validate session_id.
    Return ordered event nodes and sequential edges.
    Add TestGraphHandler_Session.

Frontend Tasks

    Add fetchSessionGraph(id).
    Add useSessionGraph(id).
    Create SessionFlowGraph.tsx.
    Add session selector on /flow.

UI/UX Requirements

    Play/Pause controls.
    Speed selector: 0.5x, 1x, 2x.
    Current event highlight.
    aria-live region announces current event.
    Reduced motion disables automatic animation and shows step controls.

Tests

    SessionFlowGraph.test.tsx

Accessibility

Final accessibility-audit on /flow.
Sprint 7 Definition of Done

    Topology graph endpoint
    Session graph endpoint
    /flow route
    React Flow canvas
    Replay controls
    Accessible text alternative
    Tests/build/a11y pass

text


---

## `sprints/sprint-8.md`

```markdown
# Sprint 8 — Chat-to-Config

**Goal:** Generate agent, hook, or command configuration from natural language.

---

## Sprint-Level UI/UX Requirements

Follow `sprints/UIUX_PROTOCOL.md`.

This sprint involves generated configuration. The UI must clearly separate:
prompt, generated output, diff, and final apply action.

---

## Story 8.1 — Natural Language Config Generator

**As a** user,  
**I want** to describe a config in natural language,  
**so that** AgentOS can generate the correct file content.

### Backend Tasks

1. Add `POST /api/chat/generate`.
2. Body:

```json
{
  "prompt": "...",
  "target": "agent|hook|command"
}

    Use ANTHROPIC_API_KEY.
    Return 503 if key missing.
    Stream response over SSE.
    Add mocked HTTP client tests.

Frontend Tasks

    Add SSE consumer in api.ts.
    Add useConfigGenerator().
    Create /chat.
    Add Sidebar item with MessageSquare.
    Create:
        ChatInput.tsx
        GeneratedPreview.tsx

UI/UX Requirements

    Prompt input large enough for multi-line intent.
    Target selector explicit.
    Streaming output uses monospace preview.
    Loading state shows streaming cursor.
    EmptyState before generation.
    ErrorBoundary around preview.

Tests

    ChatInput.test.tsx
    GeneratedPreview.test.tsx

Accessibility

Run accessibility-audit on /chat.
Story 8.2 — Config Diff & Apply

As a user,
I want to review a diff before saving,
so that generated config does not overwrite important settings blindly.
Frontend Tasks

    Create ConfigDiff.tsx.
    Side-by-side current vs generated.
    Add:
        Apply Changes
        Discard
        Copy
    Wire apply to appropriate save endpoint.

UI/UX Requirements

    Added lines: bg-chart-cache/10 text-chart-cache
    Removed lines: bg-chart-error/10 text-chart-error
    Diff must be keyboard navigable.
    Destructive overwrite requires confirmation.
    sr-only summary of diff counts.

Tests

    ConfigDiff.test.tsx

Accessibility

Final accessibility-audit on /chat.
Sprint 8 Definition of Done

    SSE generation endpoint
    /chat route
    Streaming preview
    Diff before apply
    Safe confirmation flow
    Tests/build/a11y pass

text


---

## `sprints/sprint-9.md`

```markdown
# Sprint 9 — Budget & Safety

**Goal:** Set spending budgets and receive real-time safety alerts.

---

## Sprint-Level UI/UX Requirements

Follow `sprints/UIUX_PROTOCOL.md`.

Budget UI must prioritize clarity, safety, and quick interpretation.

---

## Story 9.1 — Budget Configuration

**As a** user,  
**I want** to configure token and cost budgets,  
**so that** I avoid overspending.

### Backend Tasks

1. Create `budgets` table.
2. Add:
   - `GET /api/budgets`
   - `POST /api/budgets`
   - `DELETE /api/budgets/:id`
   - `GET /api/budgets/status`
3. Status query uses SQL aggregation.
4. Add endpoint tests.

### Frontend Tasks

1. Add budget API types/helpers.
2. Add `useBudgets()` and `useBudgetStatus()`.
3. Create `/budget`.
4. Add Sidebar item with `ShieldAlert`.
5. Create:
   - `BudgetForm.tsx`
   - `BudgetStatusList.tsx`

### UI/UX Requirements

- Progress bars:
  - safe: `bg-chart-cache`
  - warning: `bg-chart-tool`
  - over: `bg-chart-error`
- Numeric inputs have validation.
- EmptyState if no budgets.
- Form error messages are inline.
- Skeleton for status list.

### Tests

- `BudgetForm.test.tsx`
- `BudgetStatusList.test.tsx`

### Accessibility

Run accessibility-audit on `/budget`.

---

## Story 9.2 — Real-Time Budget Alerts

**As a** user,  
**I want** alerts when budget thresholds are crossed,  
**so that** I can respond before overspending.

### Backend Tasks

1. Background checker every 60s.
2. Broadcast WebSocket message:

```json
{
  "type": "budget_alert",
  "scope": "global",
  "pct_used": 83,
  "limit_usd": 10
}

    Prevent duplicate spam per threshold window.
    Add tests for alert logic.

Frontend Tasks

    Listen for budget_alert.
    Create BudgetAlertToast.tsx.
    Create alert history panel.

UI/UX Requirements

    Warning uses chart-tool styling.
    Over-limit uses chart-error styling.
    Toast must be dismissible.
    role="status" / aria-live="polite".

Tests

    BudgetAlertToast.test.tsx

Accessibility

Final accessibility-audit on /budget.
Sprint 9 Definition of Done

    Budget CRUD
    Budget status
    Realtime budget alerts
    /budget route
    Tests/build/a11y pass

text


---

## `sprints/sprint-10.md`

```markdown
# Sprint 10 — Session Explorer

**Goal:** Provide advanced session search, filtering, and comparison.

---

## Sprint-Level UI/UX Requirements

Follow `sprints/UIUX_PROTOCOL.md`.

Session Explorer must support dense data workflows without overwhelming users.

---

## Story 10.1 — Advanced Session Search

**As a** user,  
**I want** to filter sessions by agent, model, date, cost, and query,  
**so that** I can find relevant sessions quickly.

### Backend Tasks

1. Enhance `GET /api/sessions`.
2. Support:
   - `agent`
   - `model`
   - `min_cost`
   - `max_cost`
   - `from`
   - `to`
   - `q`
3. SQL filters combine with AND.
4. Validate query params.
5. Add tests for filter combinations.

### Frontend Tasks

1. Update `fetchSessions(filters)`.
2. Create `SessionFilterBar.tsx`.
3. Add URL search param persistence.
4. Add debounce of 300ms.

### UI/UX Requirements

- Filters are collapsible on mobile.
- Clear filters button.
- Active filter chips.
- Keyboard accessible controls.
- Skeleton list during fetch.

### Tests

- `SessionFilterBar.test.tsx`
- URL param persistence test

### Accessibility

Run accessibility-audit on `/analytics` session section.

---

## Story 10.2 — Session Comparison

**As a** user,  
**I want** to compare two sessions,  
**so that** I can understand cost and token differences.

### Frontend Tasks

1. Add checkbox selection to SessionList.
2. Limit selection to 2.
3. Create `SessionComparisonSheet.tsx`.
4. Reuse `SessionEventChart`.

### UI/UX Requirements

- Side-by-side layout.
- Delta badges:
  - better: `text-chart-cache`
  - worse: `text-chart-error`
- `sr-only` comparison summary.
- Mobile stacks vertically.

### Tests

- `SessionComparisonSheet.test.tsx`

### Accessibility

Final accessibility-audit on `/analytics`.

---

## Sprint 10 Definition of Done

- [ ] Advanced filtering
- [ ] URL-persisted filters
- [ ] Session comparison
- [ ] Tests/build/a11y pass

sprints/sprint-11.md

Markdown

# Sprint 11 — Model Intelligence

**Goal:** Surface model efficiency insights and recommendations.

---

## Sprint-Level UI/UX Requirements

Follow `sprints/UIUX_PROTOCOL.md`.

This sprint should feel analytical and advisory, not magical.
Every recommendation must show supporting evidence.

---

## Story 11.1 — Model Performance Matrix

**As a** user,  
**I want** an agent-by-model efficiency matrix,  
**so that** I can identify efficient model choices.

### Backend Tasks

1. Add `GET /api/intelligence/matrix`.
2. SQL groups by agent and model.
3. Return events, tokens, cost, avg cost/event.
4. Add tests.

### Frontend Tasks

1. Create `/intelligence`.
2. Add Sidebar item with `Brain`.
3. Create `ModelPerformanceMatrix.tsx`.

### UI/UX Requirements

- Grid with agents as rows and models as columns.
- Cell intensity uses static classes.
- Tooltip shows exact stats.
- `role="grid"` and `role="gridcell"`.
- `sr-only` table alternative.

### Tests

- `ModelPerformanceMatrix.test.tsx`

### Accessibility

Run accessibility-audit on `/intelligence`.

---

## Story 11.2 — Model Recommendation Engine

**As a** user,  
**I want** automatic recommendations per agent,  
**so that** I can reduce cost with evidence.

### Backend Tasks

1. Add `GET /api/intelligence/recommendations`.
2. Determine current most-used model vs cheapest model.
3. Compute potential savings from aggregated SQL data.
4. Add tests.

### Frontend Tasks

1. Create `RecommendationCard.tsx`.
2. Add recommendations below matrix.
3. Link Apply to Agent Manager edit flow.

### UI/UX Requirements

- Recommendation includes:
  - current model
  - recommended model
  - savings estimate
  - confidence/explanation
- Savings badge:
  `bg-chart-cache/20 text-chart-cache`
- No recommendation should appear without evidence.

### Tests

- `RecommendationCard.test.tsx`

### Accessibility

Final accessibility-audit on `/intelligence`.

---

## Sprint 11 Definition of Done

- [ ] Matrix endpoint
- [ ] Recommendations endpoint
- [ ] `/intelligence` route
- [ ] Evidence-backed recommendation cards
- [ ] Tests/build/a11y pass

sprints/sprint-12.md

Markdown

# Sprint 12 — ROI Analytics

**Goal:** Estimate productivity ROI, time saved, and cost attribution.

---

## Sprint-Level UI/UX Requirements

Follow `sprints/UIUX_PROTOCOL.md`.

ROI metrics must communicate assumptions clearly.
Do not present estimates as exact truth.

---

## Story 12.1 — ROI Dashboard

**As a** user,  
**I want** to estimate time saved and ROI,  
**so that** I can justify agent usage.

### Backend Tasks

1. Create `tasks` table.
2. Add `POST /api/tasks`.
3. Add `GET /api/roi/summary`.
4. Join tasks and events by session_id.
5. Add tests.

### Frontend Tasks

1. Create `/roi`.
2. Add Sidebar item with `TrendingUp`.
3. Create:
   - `ROISummaryCards.tsx`
   - `TaskLogger.tsx`
   - `ROITrendChart.tsx`

### UI/UX Requirements

- Show assumptions clearly.
- KPI cards use existing KpiCard pattern.
- TaskLogger form validates required fields.
- Chart includes `sr-only` summary.
- Skeletons while loading.

### Tests

- `ROISummaryCards.test.tsx`
- `TaskLogger.test.tsx`

### Accessibility

Run accessibility-audit on `/roi`.

---

## Story 12.2 — Cost Attribution

**As a** user,  
**I want** to label sessions by project/team,  
**so that** I can attribute cost.

### Backend Tasks

1. Create `labels` table.
2. Add:
   - `POST /api/sessions/:id/labels`
   - `DELETE /api/sessions/:id/labels/:label`
   - `GET /api/roi/by-label`
3. SQL GROUP BY label.
4. Add tests.

### Frontend Tasks

1. Add labels UI to SessionDrilldownSheet.
2. Create `CostByLabelChart.tsx`.
3. Add chart to `/roi`.

### UI/UX Requirements

- Labels use badge pattern.
- Add/remove labels keyboard accessible.
- Pie chart uses `useChartColors()`.
- `sr-only` table for chart data.

### Tests

- `CostByLabelChart.test.tsx`
- label interaction test

### Accessibility

Final accessibility-audit on `/roi`.

---

## Sprint 12 Definition of Done

- [ ] Tasks table
- [ ] ROI summary
- [ ] Labels
- [ ] Cost by label
- [ ] `/roi` route
- [ ] Tests/build/a11y pass

sprints/sprint-13.md

Markdown

# Sprint 13 — Auto-Discovery

**Goal:** Detect new/changed agents, hooks, skills, and commands automatically.

---

## Sprint-Level UI/UX Requirements

Follow `sprints/UIUX_PROTOCOL.md`.

Auto-discovery should feel transparent and trustworthy.
Users need visibility into what changed and when.

---

## Story 13.1 — File System Watcher

**As a** user,  
**I want** config changes to appear automatically,  
**so that** I do not need to restart AgentOS.

### Backend Tasks

1. Add `fsnotify`.
2. Watch:
   - `.claude/agents`
   - `.claude/hooks`
   - `.claude/skills`
   - `.claude/commands`
3. Debounce events by 500ms.
4. Broadcast WebSocket:

```json
{
  "type": "config_changed",
  "scope": "agents"
}

    Add watcher tests with temp directory.

Frontend Tasks

    Listen for config_changed.
    Invalidate relevant hooks:
        agents
        hooks
        skills
        commands
    Show toast: "Agent config changed".

UI/UX Requirements

    Toasts are informative, not spammy.
    Status indicator in relevant pages shows last refresh.
    Motion: subtle scaleIn toast.

Tests

    WebSocket message invalidation test

Accessibility

Audit affected pages.
Story 13.2 — Discovery Dashboard

As a user,
I want a feed of config changes,
so that I can audit configuration changes.
Backend Tasks

    Create config_events table.
    Watcher writes events.
    Add GET /api/config-events?limit=50.
    Add tests.

Frontend Tasks

    Create /discovery.
    Add Sidebar item with FileSearch.
    Create ConfigEventFeed.tsx.

UI/UX Requirements

    Timeline/feed layout.
    Type icons:
        created
        updated
        deleted
    EmptyState if no events.
    Feed uses role="feed".

Tests

    ConfigEventFeed.test.tsx

Accessibility

Run accessibility-audit on /discovery.
Sprint 13 Definition of Done

    fsnotify watcher
    config_changed WebSocket
    UI invalidation
    config_events table
    discovery feed
    Tests/build/a11y pass

text


---

## `sprints/sprint-14.md`

```markdown
# Sprint 14 — Dependency Map

**Goal:** Reveal coupling between agents, tools, sessions, and dependencies.

---

## Sprint-Level UI/UX Requirements

Follow `sprints/UIUX_PROTOCOL.md`.

Dependency visuals must help users find bottlenecks and coupling risk.
Graphs must always include accessible summaries.

---

## Story 14.1 — Agent Dependency Graph

**As a** user,  
**I want** to see agent coupling and shared tools,  
**so that** I can reduce bottlenecks.

### Backend Tasks

1. Add `GET /api/graph/dependencies`.
2. Analyze:
   - agent co-occurrence by session
   - shared tool usage
3. Return graph data.
4. Add tests.

### Frontend Tasks

1. Create `/flow/dependencies`.
2. Create `DependencyGraph.tsx`.
3. Add link/tab inside Flow page.

### UI/UX Requirements

- Edge thickness indicates coupling.
- Coupling style map:
  - low
  - medium
  - high
- Selected agent path highlight.
- `sr-only` dependency table.
- Skeleton and EmptyState.

### Tests

- `DependencyGraph.test.tsx`

### Accessibility

Run accessibility-audit on `/flow/dependencies`.

---

## Story 14.2 — Bottleneck Detector

**As a** user,  
**I want** to see critical agents/tools,  
**so that** I know where reliability matters most.

### Backend Tasks

1. Add `GET /api/intelligence/bottlenecks`.
2. Rank agents/tools by dependency count.
3. Return top 5 agents and top 5 tools.
4. Add tests.

### Frontend Tasks

1. Create `BottleneckList.tsx`.
2. Add to `/intelligence`.

### UI/UX Requirements

- Ranked list.
- Risk score bars.
- Rank 1 uses chart-error.
- Ranks 2–3 use chart-tool.
- Explanation tooltip for score.

### Tests

- `BottleneckList.test.tsx`

### Accessibility

Re-run accessibility-audit on `/intelligence`.

---

## Sprint 14 Definition of Done

- [ ] Dependency graph endpoint
- [ ] Bottleneck endpoint
- [ ] Graph UI
- [ ] Bottleneck UI
- [ ] Accessible summaries
- [ ] Tests/build/a11y pass

sprints/sprint-15.md

Markdown

# Sprint 15 — Team & Marketplace

**Goal:** Add team mode with PostgreSQL and a local-first marketplace.

---

## Sprint-Level UI/UX Requirements

Follow `sprints/UIUX_PROTOCOL.md`.

Team mode must clearly communicate local vs shared state.
Marketplace install actions must be safe and reversible where possible.

---

## Story 15.1 — Team Mode & PostgreSQL Support

**As a** team,  
**I want** PostgreSQL-backed shared telemetry,  
**so that** multiple developers can collaborate.

### Backend Tasks

1. Abstract DB layer.
2. Add SQLite driver.
3. Add PostgreSQL driver.
4. Use `DATABASE_URL` when set.
5. SQLite remains default.
6. Add `GET /api/settings`.
7. Add integration tests, skip if Docker unavailable.

### Frontend Tasks

1. Upgrade `/settings`.
2. Create `TeamModeIndicator.tsx`.
3. Show:
   - Local SQLite
   - Team PostgreSQL
   - uptime
   - version

### UI/UX Requirements

- Local vs Team badge.
- Explanation text for data location.
- Warning if team mode is enabled.
- Skeleton while loading.

### Tests

- `TeamModeIndicator.test.tsx`

### Accessibility

Run accessibility-audit on `/settings`.

---

## Story 15.2 — Agent Marketplace

**As a** user,  
**I want** to install community agent templates,  
**so that** I can bootstrap new workflows quickly.

### Backend Tasks

1. Add `GET /api/marketplace/agents`.
2. Read local `marketplace.json`.
3. Optional remote fetch with timeout and local fallback.
4. Add `POST /api/marketplace/install/:name`.
5. Copy template into `.claude/agents`.
6. Broadcast `config_changed`.
7. Add tests.

### Frontend Tasks

1. Create `/marketplace`.
2. Add Sidebar item with `Store`.
3. Create `MarketplaceGrid.tsx`.
4. Install confirmation dialog.

### UI/UX Requirements

- Marketplace cards show:
  - name
  - description
  - tools
  - author
  - stars/downloads
- Install action requires confirmation.
- Installed state visible.
- Empty/error fallback if registry unavailable.

### Tests

- `MarketplaceGrid.test.tsx`
- install confirmation test

### Accessibility

Run accessibility-audit on `/marketplace`.

---

## Sprint 15 Definition of Done

- [ ] SQLite default preserved
- [ ] PostgreSQL team mode
- [ ] Settings indicator
- [ ] Marketplace list
- [ ] Marketplace install
- [ ] Tests/build/a11y pass

sprints/sprint-16.md

Markdown

# Sprint 16 — What-If Simulator

**Goal:** Simulate cost and token impact before changing models or workloads.

---

## Sprint-Level UI/UX Requirements

Follow `sprints/UIUX_PROTOCOL.md`.

Simulation results must be clearly labeled as estimates.
Users must see caveats and assumptions.

---

## Story 16.1 — Model Switch Simulator

**As a** user,  
**I want** to simulate switching models for an agent,  
**so that** I can estimate savings before making changes.

### Backend Tasks

1. Add `POST /api/simulate/model-switch`.
2. Body:

```json
{
  "agent": "agentOS-frontend",
  "from_model": "claude-opus-4",
  "to_model": "claude-haiku-3",
  "range": "30d"
}

    Aggregate actual token counts in SQL.
    Apply model pricing from pricing.json.
    Return actual cost, simulated cost, savings.
    Add tests.

Frontend Tasks

    Create /simulate.
    Add Sidebar item with FlaskConical.
    Create ModelSwitchSimulator.tsx.

UI/UX Requirements

    Clear inputs.
    Results card with:
        actual cost
        simulated cost
        savings
        caveat
    Savings badge: bg-chart-cache/20 text-chart-cache
    Run button disabled until valid.

Tests

    ModelSwitchSimulator.test.tsx

Accessibility

Run accessibility-audit on /simulate.
Story 16.2 — Workload Simulator

As a user,
I want to simulate increased workload,
so that I can estimate future budget needs.
Backend Tasks

    Add POST /api/simulate/workload.
    Body:

JSON

{
  "multiplier": 10,
  "range": "30d"
}

    Aggregate base totals.
    Scale cost and tokens.
    Add tests.

Frontend Tasks

    Create WorkloadSimulator.tsx.
    Add multiplier slider.
    Add projected results and chart.
    Show budget warning if projected exceeds budget.

UI/UX Requirements

    Slider keyboard accessible.
    Chart uses CSS variables.
    Warning badge if over budget.
    sr-only projection summary.

Tests

    WorkloadSimulator.test.tsx

Accessibility

Re-run accessibility-audit on /simulate.
Story 16.3 — Simulation History

As a user,
I want to save and compare simulations,
so that I can track planning decisions.
Backend Tasks

    Create simulations table.
    Auto-save every simulation run.
    Add GET /api/simulate/history?limit=20.
    Add tests.

Frontend Tasks

    Create SimulationHistory.tsx.
    Select two simulations to compare.
    Restore previous params.

UI/UX Requirements

    Type badges use static style map.
    History table sortable.
    Compare view side-by-side.
    EmptyState if no simulations.
    Final accessibility audit for entire /simulate.

Tests

    SimulationHistory.test.tsx

Accessibility

Final accessibility-audit on /simulate.
Sprint 16 Definition of Done

    Model switch simulator
    Workload simulator
    Simulation history
    /simulate complete
    Tests/build/a11y pass
    AgentOS complete

Final Project Completion Checklist

After Story 16.3:

    All sprints 0–16 complete
    All 41 stories complete
    go test -p 1 ./... passes
    npm run test passes
    npm run type-check passes
    npm run build passes
    No hardcoded hex/rgb/rgba/numeric hsl
    No dynamic Tailwind class strings
    accessibility-audit documented for every page
    README updated
    LICENSE confirmed
    AgentOS is COMPLETE
