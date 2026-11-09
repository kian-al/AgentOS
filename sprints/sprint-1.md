# Sprint 1 — Overview Dashboard
Duration: 2 weeks
Goal: Turn the dashboard shell into a real-time command center showing
      tokens, cost, sessions, and live events from Beacon telemetry.
Pillar: 👁️ OBSERVE

Depends on: Sprint 0 (Beacon pipeline + UI shell) ✅

---

## Story 1.1 — KPI Cards (Real-Time Metrics)

**As a** developer running Claude Code,
**I want** to see today's token usage, cost, active sessions and agent
count at a glance,
**So that** I always know how much my agents are consuming right now.

### Acceptance Criteria
- [ ] GET /api/metrics/summary returns JSON:
      { tokens_today, cost_today_usd, active_sessions, agents_seen,
        events_total, tokens_delta_pct, cost_delta_pct }
      (delta = % change vs same window yesterday)
- [ ] 4 KPI cards render on /dashboard:
      Tokens Today / Cost Today / Active Sessions / Agents Seen
- [ ] Each card shows: value + delta badge (▲ green / ▼ red / — neutral)
- [ ] Cards refresh automatically when a new WebSocket event arrives
      (debounce 1 second — do not refetch on every single event)
- [ ] Skeleton loader shown while first fetch is in-flight (zero CLS)
- [ ] Numbers formatted by lib/format.ts:
      formatTokens(n)  → "184.2K" / "1.4M"
      formatUsd(n)     → "$4.37" / "$1,240.00"
      formatDelta(pct) → "▲ 12%" / "▼ 3%" / "—"
- [ ] Active session = session_id with an event in the last 15 minutes
- [ ] SQL aggregation only — no Go loops over all events rows
- [ ] Database indexes added: events(timestamp), events(model), events(agent)

### UI Prototype
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ 🪙 Tokens   │ │ 💵 Cost     │ │ 🔄 Sessions │ │ 🤖 Agents   │
│   Today     │ │   Today     │ │   Active    │ │   Seen      │
│             │ │             │ │             │ │             │
│   184.2K    │ │   $4.37     │ │     2       │ │     5       │
│  ▲ 12% vs   │ │  ▼ 3% vs    │ │  ● live     │ │  today      │
│  yesterday  │ │  yesterday  │ │             │ │             │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘

### Files to Create
Backend:
  apps/api/internal/handlers/metrics.go
  apps/api/internal/db/metrics_queries.go
  apps/api/internal/handlers/metrics_test.go

Frontend:
  apps/web/src/components/dashboard/KpiCard.tsx
  apps/web/src/components/dashboard/KpiGrid.tsx
  apps/web/src/hooks/useMetricsSummary.ts
  apps/web/src/lib/format.ts

### Seed Data (if runtime.jsonl is empty or sparse)
Create apps/api/internal/beacon/testdata/sample.jsonl with:
  - 200 synthetic events
  - Spanning 7 days
  - 3 models: claude-sonnet-4, claude-opus-4, claude-haiku-3
  - 5 agents: agentOS-backend, agentOS-frontend, agentOS-tester,
              agentOS-architect, agentOS-beacon
  - session_id prefix "seed-"
Create apps/api/cmd/seed/main.go — `go run ./cmd/seed` loads sample.jsonl
into agentOS.db.

---

## Story 1.2 — Token Usage Timeline Chart

**As a** developer,
**I want** a chart of token usage over time (last 24h / 7d / 30d),
**So that** I can spot spikes and understand usage patterns over time.

### Acceptance Criteria
- [ ] GET /api/metrics/timeline?range=24h|7d|30d returns array:
      [{ bucket: ISO8601, input_tokens: int, output_tokens: int,
         cache_read_tokens: int, cost_usd: float }]
      Bucket sizes: 24h → 1h buckets, 7d → 6h buckets, 30d → 1d buckets
      Computed via SQL strftime() — no Go-side aggregation
- [ ] Recharts stacked AreaChart with 3 areas:
      input_tokens (blue) / output_tokens (purple) / cache_read_tokens (slate)
- [ ] Range toggle: segmented control [24h] [7d] [30d], default = 24h
- [ ] Global range state in apps/web/src/store/rangeStore.ts (zustand)
      so Story 1.4 panels share the same selection
- [ ] Tooltip on hover: shows all three token counts + cost for that bucket
- [ ] ResponsiveContainer — chart fills its parent width
- [ ] Empty state component when no data exists for the selected range
- [ ] All chart colors from CSS variables in MASTER.md, not hardcoded hex

### UI Prototype
┌────────────────────────────────────────────────────────────────┐
│  Token Usage                              [24h] [7d] [30d]     │
│                                                                │
│  200K ┤                          ╭──╮                          │
│  150K ┤              ╭───╮      ╭╯  ╰╮                         │
│  100K ┤        ╭────╮│   ╰──╮  ╭╯    ╰──╮                     │
│   50K ┤  ╭────╮│    ╰╯      ╰──╯        ╰───╮                 │
│    0  ┼──╯────╰╯─────────────────────────────╰──────────────  │
│       00:00  04:00  08:00  12:00  16:00  20:00  now            │
│                                                                │
│  ■ Input  ■ Output  ■ Cache Read                               │
└────────────────────────────────────────────────────────────────┘

### Files to Create
Backend:
  apps/api/internal/handlers/metrics.go  (add GetTimeline handler)
  apps/api/internal/db/metrics_queries.go (add TimelineBuckets function)

Frontend:
  apps/web/src/components/dashboard/TokenTimelineChart.tsx
  apps/web/src/components/dashboard/RangeToggle.tsx
  apps/web/src/hooks/useTimeline.ts
  apps/web/src/store/rangeStore.ts   ← zustand, shared with Story 1.4

---

## Story 1.3 — Live Event Feed (Enhanced)

**As a** developer,
**I want** a scrolling real-time feed of agent events with filtering,
search, and pause control,
**So that** I can watch exactly what my agents are doing as it happens.

### Acceptance Criteria
- [ ] Feed displays last 50 events, newest on top, via useBeaconSocket
- [ ] Each row shows:
      time (HH:MM:SS) · type badge · agent · model · tool name · tokens · cost
- [ ] Type badge colors (from MASTER.md tokens):
      TOOL → blue / AGENT → purple / SESSION → emerald / ERROR → red
- [ ] Filter tabs: All / Agent / Tool / Session / Error (client-side)
- [ ] Search input (client-side, debounced 200ms) — matches session_id,
      agent name, tool name
- [ ] Pause button ⏸: freezes visible list; incoming events accumulate
      and show a badge "+N new"; clicking badge or ▶ resumes and flushes
- [ ] Clicking any row opens a shadcn/ui Sheet with:
      full raw JSON (syntax-highlighted with <pre> + monospace)
      and a "Copy JSON" button with checkmark feedback
- [ ] Feed container: role="feed" aria-live="polite"
      aria-label="Real-time Beacon events"
- [ ] If event count > 200, virtualise (simple slice window — keep last 200)
- [ ] npm run type-check and build pass with zero errors

### UI Prototype
┌────────────────────────────────────────────────────────────────┐
│  Live Events    🔍 [search…]   [All][Agent][Tool][Sess][Err] ⏸│
├────────────────────────────────────────────────────────────────┤
│ 14:32:07  TOOL   agentOS-backend  sonnet-4  Edit   1.2K  $0.01 │
│ 14:32:05  AGENT  agentOS-backend  sonnet-4  —      3.4K  $0.03 │
│ 14:31:58  TOOL   agentOS-tester   sonnet-4  Bash   0.8K  $0.01 │
│ 14:31:40  SESS   —                —         start  —     —     │
│ 14:30:12  ERROR  agentOS-frontend sonnet-4  Write  0.2K  $0.00 │
│ …                                                              │
└────────────────────────────────────────────────────────────────┘

### Files to Create
Frontend:
  apps/web/src/components/dashboard/EventFeed.tsx
  apps/web/src/components/dashboard/EventRow.tsx
  apps/web/src/components/dashboard/EventDetailSheet.tsx
  apps/web/src/hooks/useEventFeed.ts
  apps/web/src/lib/eventTypes.ts   (event_type → color, label mapping)

---

## Story 1.4 — Breakdown Panels (By Model & By Agent)

**As a** developer,
**I want** to see which models and which agents consume the most tokens
and cost,
**So that** I know exactly where my AI spend is going.

### Acceptance Criteria
- [x] GET /api/metrics/breakdown?by=model|agent&range=24h|7d|30d returns:
      [{ key: string, tokens: int, cost_usd: float, events: int, pct: float }]
      sorted by cost_usd descending
      Computed via SQL GROUP BY — no Go loops
- [x] Two side-by-side panels:
      "By Model" → Recharts PieChart (donut, innerRadius=60)
      "By Agent" → horizontal bar list with % fill bars
- [x] Each row: name · token count · cost · % bar
- [x] Hovering a pie slice highlights the matching agent bar row and vice-versa
- [x] Range controlled by global rangeStore (same zustand store as Story 1.2)
- [x] Empty state when no data for selected range
- [x] All chart colors from MASTER.md CSS variable tokens

### UI Prototype
┌──────────────────────────────┐  ┌──────────────────────────────┐
│  By Model           [range]  │  │  By Agent           [range]  │
│                              │  │                              │
│        ╭────╮                │  │  agentOS-backend ████████ 42%│
│      ╭─╯    ╰─╮  sonnet  61% │  │  agentOS-frontend █████   28%│
│      │  $4.37 │  opus    31% │  │  agentOS-tester   ███     17%│
│      ╰─╮    ╭─╯  haiku    8% │  │  agentOS-architect██       9%│
│        ╰────╯                │  │  agentOS-beacon   █        4%│
└──────────────────────────────┘  └──────────────────────────────┘

### Files to Create
Backend:
  apps/api/internal/handlers/metrics.go  (add GetBreakdown handler)
  apps/api/internal/db/metrics_queries.go (add BreakdownByModel,
                                           BreakdownByAgent)

Frontend:
  apps/web/src/components/dashboard/ModelBreakdown.tsx
  apps/web/src/components/dashboard/AgentBreakdown.tsx
  apps/web/src/hooks/useBreakdown.ts

---

## Final Dashboard Layout (all 4 stories combined)

┌─────────────────────────────────────────────────────────────────────┐
│  🧠 AgentOS                    Dashboard              🟢 Beacon     │
├──────────┬──────────────────────────────────────────────────────────┤
│          │  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐  [24h][7d][30d]│
│ Dashboard│  │Tokens │ │ Cost  │ │Sessns │ │Agents │               │
│ Analytics│  │184.2K │ │ $4.37 │ │   2   │ │   5   │               │
│ Agents   │  └───────┘ └───────┘ └───────┘ └───────┘               │
│ Commands │  ┌──────────────────────────────────────────────────┐   │
│ Hooks    │  │  Token Usage Timeline Chart                      │   │
│ Skills   │  └──────────────────────────────────────────────────┘   │
│ Sessions │  ┌────────────────────┐  ┌───────────────────────────┐  │
│ Settings │  │  By Model (donut)  │  │  By Agent (bars)          │  │
│          │  └────────────────────┘  └───────────────────────────┘  │
│ v0.1.0   │  ┌──────────────────────────────────────────────────┐   │
└──────────┤  │  Live Event Feed                                 │   │
           │  └──────────────────────────────────────────────────┘   │
           └──────────────────────────────────────────────────────────┘

---

## Definition of Done — Sprint 1

All 4 stories complete means:
- [x] All acceptance criteria checkboxes above are ticked
- [x] go build ./... exits 0
- [x] go test ./... exits 0 (including metrics_test.go)
- [x] npm run type-check exits 0
- [x] npm run build exits 0
- [x] /beacon-check passes
- [x] Visual layout matches the Final Dashboard Layout prototype above
- [x] Completion Report produced per CLAUDE.md Mandatory Reporting Rule

## Status: DONE


