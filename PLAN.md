# AgentOS Sprint 4 Story 4.2 — Implementation Plan

**Story**: Sprint 4 Story 4.2 — Command Runner with Live Output  
**Role**: agentOS-architect  
**Date**: 2026-11-08  
**Status**: APPROVED  
**Estimated Complexity**: MEDIUM-HIGH  

---

## 1. Story Summary

Enable developers to execute Claude Code slash commands directly from the AgentOS UI and observe live output in real-time streamed via the WebSocket hub.

- **Backend**:
  - Implement `POST /api/commands/:name/run`:
    - Validate `:name` parameter using `ValidateCommandName(name)`.
    - Check command file existence in `CommandsDir` (return 404 if missing).
    - Parse request body `{ "args": "..." }`. Return 400 on malformed JSON.
    - Concurrency lock: Return `409 Conflict` (`{"error": "another command is currently running"}`) if a command execution is currently active.
    - Spawns subprocess (`claude /{name} {args}` by default, or injected runner for testing/configurability) with a 300s timeout context.
    - Interleaves and streams stdout/stderr lines in real-time over the existing WebSocket hub:
      - Line message: `{ "type": "command_output", "command": "/{name}", "line": "...", "ts": "..." }`
      - Process completion: `{ "type": "command_done", "command": "/{name}", "exit_code": <int> }`
    - Concurrency mutex lock is safely released on process exit or failure via `defer`.
  - Wire WebSocket hub into `CommandsHandler` in `main.go`.
  - Unit tests in `apps/api/internal/handlers/commands_test.go`:
    - `TestCommandsHandler_Run`:
      - Successful execution streaming output lines and exit code 0.
      - 409 Conflict when a command is already running.
      - 404 Not Found for non-existent command.
      - 400 Bad Request for invalid command name.
      - Non-zero exit code broadcast on process error.

- **Frontend**:
  - Add `runCommand(name, args)` helper and message interfaces (`CommandOutputMessage`, `CommandDoneMessage`, `RunCommandResponse`) in `apps/web/src/lib/api.ts`.
  - Update `apps/web/src/hooks/useBeaconSocket.ts` to accommodate command output and done message shapes without any type casting.
  - Create `apps/web/src/components/commands/CommandRunner.tsx`:
    - Arguments input field with label and placeholder.
    - "Run" button with loading state / spinner.
    - Scrollable output terminal (`<pre tabIndex={0} role="log" aria-live="polite">`) styled with developer-tool dark theme tokens.
    - WebSocket streaming listener filtering for `command_output` and `command_done` matching `command: "/{name}"`.
    - Static literal map `EXIT_STYLES`:
      - Success (exit 0): `border-chart-cache/30 bg-chart-cache/20 text-chart-cache`
      - Error (non-zero): `border-chart-error/30 bg-chart-error/20 text-chart-error`
    - "Clear" button to flush terminal buffer and exit status.
    - Busy state indicator: `"Command running..."` during execution.
    - In-line error banner for 409 / network errors.
    - Wrapped in `<ErrorBoundary name="CommandRunner">`.
  - Integrate `CommandRunner` into `apps/web/src/components/commands/CommandDetailSheet.tsx` under the command definition body.
  - Vitest unit tests in `apps/web/src/components/commands/__tests__/CommandRunner.test.tsx`:
    - Renders args input and Run button.
    - Displays "Command running..." when busy.
    - Renders exit code badge (chart-cache/green for 0, chart-error/red for non-zero).
    - Clears terminal output on "Clear" click.
    - Renders error state on 409 Conflict.
  - Document WCAG 2.2 AA accessibility evaluation in `docs/design-system/AUDIT-sprint4.md`.

---

## 2. Files to Create

### Backend (`apps/api/`)
- *None (modifying `commands.go` and `commands_test.go` directly)*

### Frontend (`apps/web/`)
1. `apps/web/src/components/commands/CommandRunner.tsx`:
   - Interactive command runner with args input, run button, live output terminal, exit badge, clear button, and status indicator.
2. `apps/web/src/components/commands/__tests__/CommandRunner.test.tsx`:
   - Comprehensive Vitest suite testing rendering, running state, WebSocket message assimilation, exit code badge styles, and terminal clear action.

---

## 3. Files to Modify

### Backend (`apps/api/`)
1. `apps/api/internal/handlers/commands.go`:
   - Add `WebSocketBroadcaster` interface.
   - Update `CommandsHandler` struct to include `Hub WebSocketBroadcaster`, concurrency state (`runMu sync.Mutex`, `isRunning bool`, `runningCmd string`), and `Runner CommandRunnerFunc`.
   - Add `RunCommand(w http.ResponseWriter, r *http.Request)`.
   - Add default subprocess execution using `exec.CommandContext` with 300s timeout, stdout/stderr line streaming, and exit code capture.
2. `apps/api/internal/handlers/commands_test.go`:
   - Add `TestCommandsHandler_Run` covering success, 409 busy state, 404 missing command, 400 invalid name, and non-zero exit code.
3. `apps/api/cmd/api/main.go`:
   - Pass `hub` into `handlers.NewCommandsHandler(commandsDir, hub)`.
   - Register route `r.Post("/api/commands/{name}/run", commandsHandler.RunCommand)`.

### Frontend (`apps/web/`)
1. `apps/web/src/lib/api.ts`:
   - Add `CommandOutputMessage`, `CommandDoneMessage`, `RunCommandResponse` interfaces.
   - Add `runCommand(name: string, args?: string): Promise<RunCommandResponse>` POST helper.
2. `apps/web/src/hooks/useBeaconSocket.ts`:
   - Update event types to include `SocketMessage` union type (`BeaconEvent | CommandOutputMessage | CommandDoneMessage | Record<string, unknown>`).
3. `apps/web/src/components/commands/CommandDetailSheet.tsx`:
   - Replace placeholder disabled Run button with integrated `CommandRunner` component.
4. `apps/web/src/components/commands/__tests__/CommandDetailSheet.test.tsx`:
   - Update tests to accommodate integrated `CommandRunner`.
5. `docs/design-system/AUDIT-sprint4.md`:
   - Add Story 4.2 WCAG 2.2 AA accessibility verification report.

---

## 4. API Specification

### `POST /api/commands/:name/run`

- **Path Parameters**:
  - `name`: Command name (validated with `^[a-zA-Z0-9_\-]{2,128}$`).
- **Request Body** (optional, JSON):
  ```json
  {
    "args": "1 4"
  }
  ```
- **Responses**:
  - `200 OK`: Command execution initiated.
    ```json
    {
      "status": "running",
      "command": "/sprint"
    }
    ```
  - `400 Bad Request`: Invalid command name regex or invalid JSON body.
    ```json
    {
      "error": "invalid command name: ..."
    }
    ```
  - `404 Not Found`: Command markdown file does not exist in `.claude/commands/`.
    ```json
    {
      "error": "command not found"
    }
    ```
  - `409 Conflict`: Another command is already running.
    ```json
    {
      "error": "another command is currently running"
    }
    ```

### WebSocket Streaming Events

- **Output Line**:
  ```json
  {
    "type": "command_output",
    "command": "/sprint",
    "line": "Reading sprints/ROADMAP.md...",
    "ts": "2026-11-08T15:30:00.000Z"
  }
  ```
- **Command Completion**:
  ```json
  {
    "type": "command_done",
    "command": "/sprint",
    "exit_code": 0
  }
  ```

---

## 5. UI/UX & Design Tokens

- Static Tailwind classes only:
  - Exit code 0: `border-chart-cache/30 bg-chart-cache/20 text-chart-cache`
  - Exit code non-0: `border-chart-error/30 bg-chart-error/20 text-chart-error`
  - Terminal container: `bg-slate-950 border-slate-800 text-slate-300 font-mono text-xs`
  - Running indicator: `text-blue-400 font-mono text-xs` with subtle pulse
- Keyboard accessibility:
  - `<pre tabIndex={0} role="log" aria-live="polite" aria-label="Command execution output">`
  - Action buttons have `aria-label` and visible focus rings.
- Zero raw hex/rgb/rgba/numeric hsl.

---

## 6. Verification Plan

1. **Backend Tests**:
   - `go test -v -p 1 ./internal/handlers -run TestCommandsHandler_Run`
   - `go test -p 1 ./...`
   - `go build ./...`
2. **Frontend Tests**:
   - `npm run test` (including `CommandRunner.test.tsx` and `CommandDetailSheet.test.tsx`)
   - `npm run type-check`
   - `npm run build`
3. **Hygiene Verification**:
   - Grep for raw colors: `grep -RInE "#[0-9a-fA-F]{3,8}|rgba?\(|hsl\([0-9]" apps/web/src`
4. **Completion Report**:
   - Comprehensive status report adhering to all 11 mandatory sections.
