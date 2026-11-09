# Sprint 2 — Token Analytics

**Goal:** Give users deep, actionable visibility into token consumption patterns —
by model, by agent, by session, and projected forward in time.

**Acceptance Criteria (Sprint-level):**
- All stories pass go build, go test -p 1 ./..., npm run type-check, npm run build (exit 0).
- No hardcoded hex values — all colors via CSS variables and static Tailwind literals.
- SQL aggregation only in Go (no row-iteration loops).
- Vitest tests for every story that adds frontend code.
- accessibility-audit skill on every new page or major component.
- Every Completion Report includes Instruction Coverage table with DONE/SKIPPED/BLOCKED + terminal proof.
- Next Steps section of every report must quote the next story ID and title verbatim from ROADMAP.md.

---

## Story 2.1 — Token Heatmap Calendar

**As a** user,
**I want** to see a GitHub-style calendar heatmap of daily token usage for the past 90 days,
**so that** I can spot high-activity days and usage trends at a glance.

### Backend Tasks
1. Add `GET /api/metrics/heatmap?range=90d|180d`
   - SQL: `SELECT DATE(timestamp) AS day, SUM(token_usage_input + token_usage_output) AS tokens FROM events GROUP BY day ORDER BY day ASC`
   - Returns: `[{ day: "2026-08-01", tokens: 12400 }, ...]`
   - No Go-side row iteration — pure SQL aggregation.

2. Add `TestMetricsHandler_Heatmap` in `internal/handlers/metrics_test.go`.

### Frontend Tasks
1. Create `apps/web/src/lib/api.ts` additions:
   - `HeatmapDay` interface: `{ day: string; tokens: number }`
   - `fetchHeatmap(range)` fetch helper.

2. Create `apps/web/src/hooks/useHeatmap.ts`
   - Subscribes to `useRangeStore` for range selection (90d / 180d).
   - SWR or `useEffect` polling (30 s refresh).

3. Create `apps/web/src/components/analytics/TokenHeatmap.tsx`
   - 13-week (90d) or 26-week (180d) grid of day cells.
   - 5 intensity levels using static Tailwind classes:
     ```
     tokens === 0        → "bg-slate-800"
     tokens < p25        → "bg-chart-input/30"
     tokens < p50        → "bg-chart-input/55"
     tokens < p75        → "bg-chart-input/80"
     tokens >= p75       → "bg-chart-input"
     ```
     (percentile thresholds computed client-side from the dataset)
   - Each cell: `role="gridcell"` `aria-label="2026-08-01: 12,400 tokens"`
   - Wrapper: `role="grid"` `aria-label="Token usage heatmap"`
   - Month labels above columns (Jan, Feb … as `aria-hidden="true"`).
   - Tooltip on hover: day + formatted token count.
   - Legend below: 5 swatches (None → High) with `aria-label`.
   - Empty state if no data.

4. Add `TokenHeatmap` to `apps/web/src/app/analytics/page.tsx`
   - New route: `/analytics` (create `app/analytics/layout.tsx` + `page.tsx`).
   - Page title: "Token Analytics".
   - Add "Analytics" nav item to `Sidebar.tsx` (icon: `BarChart3`).

5. Vitest: `src/components/analytics/__tests__/TokenHeatmap.test.tsx`
   - Renders correct number of day cells (90 → 90 cells).
   - Applies correct intensity class for each bucket.
   - Each cell has valid `aria-label`.
   - Empty state renders when data is `[]`.

6. Run `accessibility-audit` skill on `/analytics`.

### ASCII Prototype

┌─────────────────────────────────────────────────────────────────┐ │ Token Usage — Last 90 Days [90d] [180d] │ │ │ │ Aug Sep Oct Nov │ │ ░░▒▒▓▓██░░ ░░▒▒░░▒▒▓▓ ██░░░░▒▒░░ ▓▓██░░░░ │ │ ░░░░▒▒░░░░ ▓▓░░▒▒░░░░ ░░▒▒▓▓░░▒▒ ░░░░▒▒░░ │ │ ▒▒░░░░▒▒▓▓ ░░░░░░▒▒▓▓ ▒▒░░░░░░▒▒ ░░▒▒░░░░ │ │ ░░▒▒▒▒░░░░ ▒▒▓▓░░░░▒▒ ░░▒▒░░▒▒░░ ▒▒░░░░░░ │ │ ▓▓░░░░▒▒░░ ░░░░▒▒▓▓░░ ▓▓░░▒▒░░░░ ░░░░▒▒░░ │ │ ░░░░▒▒▓▓▒▒ ░░▒▒░░░░░░ ░░░░░░▒▒▓▓ ▒▒░░░░░░ │ │ Mon Wed Fri │ │ │ │ Legend: □ None ░ Low ▒ Mid ▓ High █ Peak │ └─────────────────────────────────────────────────────────────────┘

text


---

## Story 2.2 — Model Comparison Table

**As a** user,
**I want** a sortable table comparing all models by tokens, cost, efficiency, and event count,
**so that** I can decide which model gives the best value.

### Backend Tasks
1. Add `GET /api/metrics/models?range=24h|7d|30d`
   - SQL CTE:
     ```sql
     SELECT
       model,
       COUNT(*)                                            AS events,
       SUM(token_usage_input + token_usage_output)         AS tokens,
       SUM(cost_usd)                                       AS cost_usd,
       ROUND(SUM(cost_usd) /
         NULLIF(SUM(token_usage_input+token_usage_output),0)
         * 1000000, 4)                                     AS cost_per_million
     FROM events
     WHERE timestamp >= ?
     GROUP BY model
     ORDER BY cost_usd DESC
     ```
   - Returns: `[{ model, events, tokens, cost_usd, cost_per_million }]`

2. Add `TestMetricsHandler_Models` in `metrics_test.go`.

### Frontend Tasks
1. `ModelStat` interface in `api.ts`: `{ model: string; events: number; tokens: number; cost_usd: number; cost_per_million: number }`
2. `fetchModelStats(range)` helper.
3. `useModelStats` hook (30 s refresh, bound to `useRangeStore`).
4. `apps/web/src/components/analytics/ModelComparisonTable.tsx`
   - Columns: Model | Events | Tokens | Total Cost | Cost / 1M tokens | Efficiency Bar.
   - "Efficiency Bar" = inverse cost (cheapest model = widest bar), static class `bg-chart-cache`.
   - Click any column header → sort asc/desc (client-side).
   - Active sort column shows `▲` / `▼` icon, `aria-sort="ascending|descending"`.
   - Table: `role="table"`, headers: `role="columnheader" scope="col"`.
   - Stripe rows with `even:bg-slate-900/40` (static Tailwind, not dynamic).
   - Empty state if no rows.
   - Responsive: horizontal scroll wrapper on mobile.
5. Add `ModelComparisonTable` to `/analytics` page below `TokenHeatmap`.
6. Vitest: `ModelComparisonTable.test.tsx`
   - Renders all model rows.
   - Clicking "Total Cost" header sorts descending then ascending.
   - `aria-sort` attribute updates on sort.
   - Empty state renders when data is `[]`.
7. Run `accessibility-audit` skill on `/analytics` after component is added.

### ASCII Prototype

┌────────────────────────────────────────────────────────────────┐ │ Model Comparison [24h] [7d] [30d] │ ├──────────────────┬────────┬───────────┬────────┬───────────────┤ │ Model ▼ │ Events │ Tokens │ Cost │ Cost/1M tok │ ├──────────────────┼────────┼───────────┼────────┼───────────────┤ │ claude-opus-4 │ 64 │ 190,879 │ $5.43 │ ████░░ $28.4 │ │ claude-sonnet-4 │ 64 │ 203,261 │ $1.17 │ ███████ $ 5.7 │ │ claude-haiku-3 │ 72 │ 237,157 │ $0.35 │ █████████$1.5 │ └──────────────────┴────────┴───────────┴────────┴───────────────┘

text


---

## Story 2.3 — Cost Projection Widget

**As a** user,
**I want** to see my projected monthly spend based on current usage trends,
**so that** I can set budgets before overspending.

### Backend Tasks
1. Add `GET /api/metrics/projection`
   - SQL: fetch last 30 daily cost sums via GROUP BY DATE(timestamp).
   - Go: compute linear regression slope (least-squares) on the 30 daily points.
   - Return:
     ```json
     {
       "daily_avg_usd": 0.23,
       "trend_slope":   0.004,
       "projected_month_usd": 7.10,
       "projected_month_tokens": 1840000,
       "confidence": "medium",
       "data_points": 30
     }
     ```
   - `confidence`: `"low"` if < 7 data points, `"medium"` if 7–20, `"high"` if > 20.
   - Linear regression must be computed in Go (not SQL) — this is the one exception
     where Go math is required (pure aggregation cannot do regression).
     SQL provides only the daily aggregates; Go does the math on those aggregates.

2. `TestProjection` in `metrics_test.go` — verify slope, projected value, confidence level
   with a seeded dataset of known points.

### Frontend Tasks
1. `ProjectionResult` interface + `fetchProjection()` in `api.ts`.
2. `useProjection` hook (60 s refresh — no range toggle needed).
3. `apps/web/src/components/analytics/CostProjectionWidget.tsx`
   - Two-column card:
     - Left: big number projected monthly cost + "projected this month" label.
     - Right: Recharts `<LineChart>` — 30 actual daily cost dots + dashed projection
       line to end of month. Actual line: `stroke="var(--chart-cost)"`.
       Projection: `strokeDasharray="4 2"` `stroke="var(--chart-error)"`.
     - Confidence badge: `"low"` → `bg-chart-error/20 text-chart-error`,
       `"medium"` → `bg-chart-tool/20 text-chart-tool`,
       `"high"` → `bg-chart-cache/20 text-chart-cache`.
       All as static string literals (use a `CONFIDENCE_STYLES` map, same pattern as `EVENT_STYLES`).
   - Screen-reader: `<p className="sr-only">` describing trend direction and projection.
   - If `data_points < 3`: show `EmptyState` ("Not enough data for projection — check back after 3 days of usage.").
4. Add `CostProjectionWidget` to `/analytics` page (top of page, full width).
5. Vitest: `CostProjectionWidget.test.tsx`
   - Renders projected cost as formatted USD.
   - Renders correct confidence badge class for each level.
   - Renders `EmptyState` when `data_points < 3`.
   - `sr-only` description present.
6. Run `accessibility-audit` on `/analytics`.

### ASCII Prototype

┌────────────────────────────────────────────────────────────────┐ │ Cost Projection Confidence: HIGH │ │ │ │ $7.10 │ $0.40 ┤ · · · │ │ projected │ $0.30 ┤ · · · - - - - - │ │ this month │ $0.20 ┤· · │ │ │ $0.10 ┤ │ │ Daily avg: │ $0.00 └──────────────────────────── │ │ $0.23/day │ Oct 8 Nov 7 Nov 30 │ │ │ ——— Actual - - - Projected │ └────────────────────────────────────────────────────────────────┘

text


---

## Story 2.4 — Session Token Drilldown

**As a** user,
**I want** to click a session and see its per-event token breakdown,
**so that** I can identify exactly which tool calls or agent turns are most expensive.

### Backend Tasks
1. Add `GET /api/sessions/:session_id/events`
   - SQL:
     ```sql
     SELECT id, event_type, agent, model, tool_name,
            token_usage_input, token_usage_output, token_usage_cache_read,
            cost_usd, timestamp
     FROM events
     WHERE session_id = ?
     ORDER BY timestamp ASC
     ```
   - Returns array of event objects (no aggregation needed here — this is row retrieval,
     which is acceptable for a bounded single-session query).
   - 404 if session not found (zero rows).

2. Add `GET /api/sessions` (list)
   - SQL:
     ```sql
     SELECT session_id,
            COUNT(*)                                          AS events,
            SUM(token_usage_input + token_usage_output)      AS tokens,
            SUM(cost_usd)                                    AS cost_usd,
            MIN(timestamp)                                   AS started_at,
            MAX(timestamp)                                   AS ended_at
     FROM events
     GROUP BY session_id
     ORDER BY started_at DESC
     LIMIT 50
     ```
   - Returns: `[{ session_id, events, tokens, cost_usd, started_at, ended_at }]`

3. Tests: `TestSessionsHandler_List`, `TestSessionsHandler_Events` in
   `internal/handlers/sessions_test.go`.

### Frontend Tasks
1. `SessionSummary`, `SessionEvent` interfaces + `fetchSessions()`,
   `fetchSessionEvents(id)` in `api.ts`.
2. `useSessions` hook (30 s refresh).
3. `useSessionEvents(sessionId)` hook (fetches on demand, no polling).
4. `apps/web/src/components/analytics/SessionList.tsx`
   - Table of sessions: Session ID (truncated, monospace) | Events | Tokens | Cost | Duration | Started At.
   - Click row → opens `SessionDrilldownSheet`.
   - Keyboard: `tabIndex={0}` on rows, Enter/Space to open sheet.
   - `aria-label` on each row: `"Open session {id}: {events} events, ${cost}"`
5. `apps/web/src/components/analytics/SessionDrilldownSheet.tsx`
   - Shadcn `<Sheet side="right" size="lg">`.
   - Header: session ID + total cost badge.
   - Stacked bar chart (`<BarChart layout="vertical">`) — each event = one bar,
     segmented: input tokens (`var(--chart-input)`), output (`var(--chart-output)`),
     cache (`var(--chart-cache)`). Static color references only.
   - Below chart: table of all events with columns:
     Time | Type | Agent | Model | Tool | Input tok | Output tok | Cache tok | Cost.
   - `sr-only` caption on table: `"Events for session {id}"`.
   - Close button: `aria-label="Close session drilldown"`.
6. Add `SessionList` to `/analytics` page (below `ModelComparisonTable`).
7. Vitest: `SessionList.test.tsx`, `SessionDrilldownSheet.test.tsx`
   - `SessionList`: renders rows, row has correct aria-label, Enter opens sheet.
   - `SessionDrilldownSheet`: renders all event rows, sr-only caption present,
     close button has aria-label.
8. Run `accessibility-audit` on `/analytics` (final pass for the whole page).

### ASCII Prototype

┌───────────────────────────────────────────────────────────────────┐ │ Sessions (last 50) │ ├───────────────────┬────────┬───────────┬────────┬────────────────┤ │ Session ID │ Events │ Tokens │ Cost │ Started │ ├───────────────────┼────────┼───────────┼────────┼────────────────┤ │ sess_a1b2c3d4... │ 18 │ 43,210 │ $0.87 │ Nov 7 12:04 │ │ sess_e5f6g7h8... │ 9 │ 21,500 │ $0.43 │ Nov 7 11:51 │ │ sess_i9j0k1l2... │ 34 │ 88,042 │ $1.21 │ Nov 7 10:33 │ └───────────────────┴────────┴───────────┴────────┴────────────────┘

text

                ┌── Session Drilldown ──────────────────────────┐
                │  sess_a1b2c3d4…          Total: $0.87  [✕]   │
                │                                               │
                │  ■ input  ■ output  ■ cache                  │
                │  ev01 ████████▒▒▒░░░░                        │
                │  ev02 ██████▒▒▒▒░                            │
                │  ev03 ████████████▒▒▒▒░░░░░░                 │
                │  ...                                          │
                │                                               │
                │  Time   Type    Agent    Model   Cost         │
                │  12:04  TOOL    frontend opus-4  $0.12        │
                │  12:05  AGENT   backend  opus-4  $0.08        │
                └───────────────────────────────────────────────┘

text


---

## Sprint 2 Definition of Done

- [x] `GET /api/metrics/heatmap` returns correct daily aggregates.
- [x] `GET /api/metrics/models` returns per-model stats sorted by cost desc.
- [x] `GET /api/metrics/projection` returns regression result with confidence level.
- [x] `GET /api/sessions` returns last 50 sessions aggregated by SQL.
- [x] `GET /api/sessions/:id/events` returns per-event rows for that session.
- [x] `/analytics` route exists and loads without error.
- [x] "Analytics" link in Sidebar navigates to `/analytics`.
- [x] `TokenHeatmap` renders correctly and all cells have `aria-label`.
- [x] `ModelComparisonTable` is sortable, `aria-sort` updates correctly.
- [x] `CostProjectionWidget` shows correct confidence badge and projection.
- [x] `SessionList` rows are keyboard-navigable and open `SessionDrilldownSheet`.
- [x] `SessionDrilldownSheet` contains stacked bar chart + accessible table.
- [x] Zero hardcoded hex values in any component.
- [x] All Tailwind classes are complete static string literals.
- [x] `go test -p 1 ./...` exits 0.
- [x] `npm run type-check` exits 0.
- [x] `npm run build` exits 0.
- [x] `npm run test` — all Vitest tests pass.
- [x] `accessibility-audit` run on `/analytics` after Story 2.4 — findings documented.
