# Sprint 3 — Agent Manager

**Goal:** Give users full visibility and control over their Claude Code agents —
read configs from .claude/agents/*.md, display them, and allow live editing.

**Acceptance Criteria (Sprint-level):**
- All stories pass go build, go test -p 1 ./..., npm run type-check, npm run build (exit 0).
- No hardcoded hex values — all colors via CSS variables and static Tailwind literals.
- SQL aggregation only in Go (no row-iteration loops).
- Vitest tests for every story that adds frontend code.
- accessibility-audit skill on every new page or major component.
- GET /api/agents belongs to THIS sprint — not Sprint 0 or 1. Do not implement it elsewhere.

---

## Story 3.1 — Agent Config Reader

**As a** user,
**I want** to see all my Claude Code agents listed with their frontmatter metadata,
**so that** I can understand what agents are configured and what tools they use.

### Backend Tasks
1. Create `apps/api/internal/agentconfig/parser.go`
   - Scan `.claude/agents/*.md` files from a configurable base path.
   - Parse YAML frontmatter: `name`, `description`, `tools` (string array).
   - Return `[]AgentConfig{ Name, Description, Tools, FilePath, UpdatedAt }`.
   - If `.claude/agents/` does not exist, return empty array (not error).

2. Add `GET /api/agents` in `apps/api/internal/handlers/agents.go`
   - Calls parser, returns JSON array.
   - Query param: `?refresh=true` forces re-scan (bypass any cache).

3. Add `TestAgentConfigParser` in `apps/api/internal/agentconfig/parser_test.go`
   - Use testdata: create `testdata/agents/test-agent.md` with known frontmatter.
   - Assert Name, Description, Tools parsed correctly.
   - Assert empty array returned if directory missing.

4. Add `TestAgentsHandler` in `apps/api/internal/handlers/agents_test.go`.

### Frontend Tasks
1. `AgentConfig` interface + `fetchAgents()` in `api.ts`.
2. `useAgents` hook — polls every 60s.
3. Create `apps/web/src/app/agents/layout.tsx` + `apps/web/src/app/agents/page.tsx`
   - Page title: "Agent Manager".
   - Add "Agents" nav item to `Sidebar.tsx` (icon: `Bot`).
4. Create `apps/web/src/components/agents/AgentCard.tsx`
   - Card per agent: name (bold), description, tool badges.
   - Tool badge: static class `bg-chart-tool/15 text-chart-tool` (complete literal).
   - `aria-label="Agent: {name}"`.
   - Empty state if no agents found.
5. Create `apps/web/src/components/agents/AgentGrid.tsx`
   - Responsive grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`.
6. Vitest: `AgentCard.test.tsx` — renders name, description, tools, empty state.
7. Run `accessibility-audit` on `/agents`.

### ASCII Prototype

┌─────────────────────────────────────────────────────────────┐ │ Agent Manager [Refresh] │ │ │ │ ┌──────────────────┐ ┌──────────────────┐ │ │ │ 🤖 agentOS-arch │ │ 🤖 agentOS-front │ │ │ │ Architect agent │ │ Frontend builder │ │ │ │ │ │ │ │ │ │ Tools: │ │ Tools: │ │ │ │ [Read] [Write] │ │ [Read] [Write] │ │ │ │ [Bash] [MCP] │ │ [Bash] [Web] │ │ │ └──────────────────┘ └──────────────────┘ │ │ ┌──────────────────┐ ┌──────────────────┐ │ │ │ 🤖 agentOS-back │ │ 🤖 agentOS-test │ │ │ │ Backend builder │ │ QA & testing │ │ │ └──────────────────┘ └──────────────────┘ │ └─────────────────────────────────────────────────────────────┘

text


---

## Story 3.2 — Agent Detail & Live Stats

**As a** user,
**I want** to click an agent and see its full config plus live token usage stats,
**so that** I can understand each agent's cost and activity.

### Backend Tasks
1. Add `GET /api/agents/:name` — returns single AgentConfig + stats:
   ```json
   {
     "config": { "name": "...", "description": "...", "tools": [] },
     "stats": {
       "total_tokens": 141635,
       "total_cost_usd": 1.6605,
       "total_events": 44,
       "last_seen": "2026-11-07T12:04:00Z"
     }
   }

    SQL: SELECT SUM(input_tokens+output_tokens), SUM(cost_usd), COUNT(*), MAX(timestamp) FROM events WHERE agent = ? AND timestamp >= ?
    404 if agent config file not found.

    Add TestAgentsHandler_Detail in agents_test.go.

Frontend Tasks

    AgentDetail interface + fetchAgentDetail(name) in api.ts.
    useAgentDetail(name) hook — fetches on demand.
    apps/web/src/components/agents/AgentDetailSheet.tsx
        Shadcn <Sheet side="right">.
        Header: agent name + last seen badge.
        Section 1: Description + raw frontmatter in <pre> block.
        Section 2: Stats grid — Total Tokens, Total Cost, Events, Last Seen. Use formatTokens, formatUsd from format.ts.
        Section 3: Tools list with icons (Wrench for tools, Shield for restricted).
        Close button: aria-label="Close agent detail".
    Clicking AgentCard opens AgentDetailSheet.
        Keyboard: Enter/Space on card opens sheet.
    Vitest: AgentDetailSheet.test.tsx — renders stats, tools, close button aria-label.
    Run accessibility-audit on /agents.

ASCII Prototype

text

                ┌── Agent Detail ──────────────────────────────┐
                │  🤖 agentOS-architect          Last: 2m ago  │
                │                                              │
                │  "Plans sprints and architecture for AgentOS"│
                │                                              │
                │  ┌──────────┬──────────┬──────────────────┐ │
                │  │ 141,635  │  $1.66   │  44 events       │ │
                │  │  tokens  │   cost   │                  │ │
                │  └──────────┴──────────┴──────────────────┘ │
                │                                              │
                │  Tools: [Read] [Write] [Bash] [WebSearch]    │
                │                                        [✕]  │
                └──────────────────────────────────────────────┘

Story 3.3 — Agent Config Editor

As a user, I want to edit an agent's frontmatter directly in the UI and save it to disk, so that I can tune agent behavior without opening a text editor.
Backend Tasks

    Add PUT /api/agents/:name
        Request body: { "description": "...", "tools": ["Read","Write"] }
        Reads existing .md file, replaces YAML frontmatter block, writes back to disk.
        Preserves everything after frontmatter (body content).
        Returns updated AgentConfig.
        Validation: name must match existing file. tools must be non-empty string array.
        Return 400 for invalid body, 404 if file not found.

    Add TestAgentsHandler_Update in agents_test.go.
        Use temp directory for test writes (do not write to real .claude/agents/).

Frontend Tasks

    updateAgent(name, patch) in api.ts.
    apps/web/src/components/agents/AgentEditForm.tsx
        Two fields: <Textarea> for description, <Input> for tools (comma-separated).
        Save button: aria-label="Save agent config".
        Cancel button: reverts to view mode.
        Loading state during PUT request.
        Success toast: "Agent saved" (use shadcn <Toast>).
        Error toast: "Save failed: {error}".
    Inline in AgentDetailSheet — toggle between view mode and edit mode.
    Vitest: AgentEditForm.test.tsx
        Renders fields pre-filled with current values.
        Save button triggers updateAgent.
        Cancel button reverts state.
    Run accessibility-audit on /agents (final pass).

ASCII Prototype

text

                ┌── Agent Detail — Edit Mode ───────────────────┐
                │  🤖 agentOS-architect              [View][Save]│
                │                                               │
                │  Description:                                 │
                │  ┌───────────────────────────────────────┐   │
                │  │ Plans sprints and architecture...     │   │
                │  └───────────────────────────────────────┘   │
                │                                               │
                │  Tools (comma-separated):                     │
                │  ┌───────────────────────────────────────┐   │
                │  │ Read, Write, Bash, WebSearch           │   │
                │  └───────────────────────────────────────┘   │
                │                                               │
                │  [Cancel]                        [💾 Save]    │
                └───────────────────────────────────────────────┘

Sprint 3 Definition of Done

    GET /api/agents reads .claude/agents/*.md and returns parsed frontmatter.
    GET /api/agents/:name returns config + live stats from DB.
    PUT /api/agents/:name updates frontmatter on disk safely.
    /agents route renders AgentGrid with AgentCard per agent.
    AgentDetailSheet opens on card click/Enter/Space.
    AgentEditForm saves changes and shows toast feedback.
    All Tailwind classes are complete static string literals.
    Zero hardcoded hex values.
    go test -p 1 ./... exits 0.
    npm run type-check exits 0.
    npm run build exits 0.
    npm run test — all Vitest tests pass.
    accessibility-audit run on /agents — findings documented.
