# `sprints/sprint-4.md`

```markdown
# Sprint 4 — Command Center

**Goal:** Let users browse, run, and manage Claude Code slash commands
from the UI, with live execution output streamed over WebSocket.

**Acceptance Criteria (Sprint-level):**
- Same as all previous sprints (build gates, no hex, static Tailwind, SQL-only aggregation).
- WebSocket streaming must handle backpressure gracefully.
- Command execution is local-only — no remote execution.

---

## Story 4.1 — Command Library Browser

**As a** user,
**I want** to browse all `.claude/commands/*.md` files,
**so that** I know what slash commands are available.

### Backend Tasks
1. Create `apps/api/internal/commandconfig/parser.go`
   - Scan `.claude/commands/*.md`.
   - Parse frontmatter (if any) + first H1 as title + first paragraph as description.
   - Return `[]CommandConfig{ Name, Title, Description, FilePath, Body }`.

2. Add `GET /api/commands` in `apps/api/internal/handlers/commands.go`.
3. Add `TestCommandParser` + `TestCommandsHandler` with testdata.

### Frontend Tasks
1. `CommandConfig` interface + `fetchCommands()` in `api.ts`.
2. `useCommands` hook — 60s refresh.
3. Create `apps/web/src/app/commands/layout.tsx` + `page.tsx`
   - Page title: "Command Center".
   - Add "Commands" nav item to Sidebar (icon: `Terminal`).
4. `apps/web/src/components/commands/CommandList.tsx`
   - List of commands: `/name` label (monospace) + description.
   - Click → opens `CommandDetailSheet`.
   - Keyboard accessible (tabIndex, Enter/Space).
5. `apps/web/src/components/commands/CommandDetailSheet.tsx`
   - Shows full markdown body rendered as `<pre>` or prose.
   - "Run" button (Story 4.2 wires this up).
   - `aria-label="Close command detail"` on close.
6. Vitest: `CommandList.test.tsx`, `CommandDetailSheet.test.tsx`.
7. `accessibility-audit` on `/commands`.

### ASCII Prototype

┌────────────────────────────────────────────────────────────┐ │ Command Center │ │ │ │ /sprint Run a sprint story end-to-end [▶] │ │ /implement Implement a named feature [▶] │ │ /beacon-check Verify beacon status [▶] │ │ /plan Generate PLAN.md for next story [▶] │ │ /tdd Write tests before implementation [▶] │ │ /verify Verify acceptance criteria [▶] │ └────────────────────────────────────────────────────────────┘

text


---

## Story 4.2 — Command Runner with Live Output

**As a** user,
**I want** to run a slash command from the UI and see its output in real-time,
**so that** I can trigger agent workflows without a terminal.

### Backend Tasks
1. Add `POST /api/commands/:name/run`
   - Body: `{ "args": "1 2" }` (string, passed as CLI args).
   - Spawns `claude /{name} {args}` as a subprocess.
   - Streams stdout/stderr lines over the existing WebSocket hub.
   - Each line: `{ "type": "command_output", "command": "/sprint", "line": "...", "ts": "..." }`.
   - On process exit: `{ "type": "command_done", "command": "/sprint", "exit_code": 0 }`.
   - Only one command may run at a time — return 409 if busy.
   - Timeout: 300s, then SIGTERM.

2. `TestCommandsHandler_Run` — mock subprocess, assert WebSocket messages.

### Frontend Tasks
1. `runCommand(name, args)` in `api.ts` (POST helper).
2. `apps/web/src/components/commands/CommandRunner.tsx`
   - Args input field + "Run" button.
   - Live output terminal: scrollable `<pre>` updated via `useBeaconSocket`.
   - Filter WebSocket messages for `command_output` and `command_done` types.
   - Exit code badge: `bg-chart-cache/20 text-chart-cache` for 0,
     `bg-chart-error/20 text-chart-error` for non-zero.
     (Static literal map `EXIT_STYLES`.)
   - "Clear" button resets output.
   - Busy state: "Command running..." indicator while in-flight.
3. Integrate `CommandRunner` into `CommandDetailSheet`.
4. Vitest: `CommandRunner.test.tsx`
   - Renders args input.
   - Renders "Command running…" when busy.
   - Renders exit code badge (green for 0, red for non-zero).
5. `accessibility-audit` on `/commands` (final pass).

### ASCII Prototype

┌── /sprint ──────────────────────────────────────────────────┐ │ Run sprint story end-to-end. │ │ │ │ Args: [1 4 ] [▶ Run] │ │ │ │ Output: [Clear] │ │ ┌─────────────────────────────────────────────────────┐ │ │ │ Reading sprints/ROADMAP.md... │ │ │ │ Reading sprints/sprint-1.md... │ │ │ │ Implementing Story 1.4 — Breakdown Panels... │ │ │ │ ▌ │ │ │ └─────────────────────────────────────────────────────┘ │ │ Status: Running... │ └─────────────────────────────────────────────────────────────┘

text


---

## Sprint 4 Definition of Done

- [ ] `GET /api/commands` returns all `.claude/commands/*.md` parsed.
- [ ] `POST /api/commands/:name/run` streams output via WebSocket.
- [ ] 409 returned if a command is already running.
- [ ] `/commands` route renders `CommandList`.
- [ ] `CommandDetailSheet` with integrated `CommandRunner` works end-to-end.
- [ ] Live output updates in UI via WebSocket.
- [ ] All build gates pass (exit 0).
- [ ] All Vitest tests pass.
- [ ] `accessibility-audit` documented.

sprints/sprint-5.md

Markdown
