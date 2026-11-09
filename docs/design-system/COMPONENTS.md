# AgentOS Design System — Component Specifications

This document defines the interface standards, HTML markup, and React prop contracts for core components in AgentOS.

---

## 1. Buttons (`components/ui/button.tsx`)

Buttons must convey clear affordance and consistent height across all forms and toolbars.

### Specifications
- **Height**: Default `h-9` (36px), Small `h-8` (32px), Large `h-10` (40px).
- **Variants**:
  - `default`: `bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700 shadow-sm shadow-blue-900/20`
  - `secondary`: `bg-slate-800 text-slate-100 hover:bg-slate-700 active:bg-slate-800 border border-slate-700`
  - `outline`: `border border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800/60`
  - `ghost`: `text-slate-300 hover:bg-slate-800/60 hover:text-white`
  - `destructive`: `bg-red-600/90 text-white hover:bg-red-500 active:bg-red-700`
- **Focus Indicator**: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950`
- **Icon Support**: When an icon accompanies text, leave `mr-2` (8px) spacing. Icon-only buttons must have `aria-label`.

---

## 2. Badges & Status Indicators (`components/ui/badge.tsx`, `components/ui/StatusBadge.tsx`)

Used for telemetry categories, agent types, and live connection states.

### Status Badge Variants
- **Live / Active (`success`)**:
  `bg-emerald-500/10 text-emerald-400 border border-emerald-500/20`
  - Status dot: `h-2 w-2 rounded-full bg-emerald-400 motion-safe:animate-pulse mr-1.5`
- **Warning / Reconnecting (`secondary` / `warning`)**:
  `bg-amber-500/10 text-amber-400 border border-amber-500/20`
  - Status dot: `h-2 w-2 rounded-full bg-amber-400 mr-1.5`
- **Offline / Error (`destructive`)**:
  `bg-red-500/10 text-red-400 border border-red-500/20`
  - Status dot: `h-2 w-2 rounded-full bg-red-400 mr-1.5`
- **Informational / Category (`default` / `outline`)**:
  `bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono text-[11px]`

---

## 3. Metric KPI Cards

Used for vital signs: Total Events, Configured Agents, Commands & Hooks, Telemetry Pipeline status.

```tsx
<Card className="border-slate-800 bg-slate-900/50 hover:border-slate-700 transition-colors">
  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
    <CardTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">
      Total Events
    </CardTitle>
    <Activity className="h-4 w-4 text-blue-400" aria-hidden="true" />
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-bold text-white font-mono tracking-tight">
      {count}
    </div>
    <p className="text-xs text-slate-400 mt-1">
      Parsed from Beacon JSONL
    </p>
  </CardContent>
</Card>
```

---

## 4. Real-Time Telemetry Feed Item

Each event row in the live feed must support immediate visual triage:

```tsx
<div className="p-3 rounded-lg border border-slate-800/80 bg-slate-950/60 hover:bg-slate-900/60 hover:border-slate-700 transition-colors flex items-center justify-between gap-3 text-xs font-mono">
  <div className="flex items-center gap-2.5 min-w-0">
    {/* Event dot */}
    <span className="h-2 w-2 rounded-full bg-blue-400 shrink-0" aria-hidden="true" />
    {/* Event type */}
    <span className="font-semibold text-slate-200 truncate">{evt.event_type}</span>
    {/* Agent name */}
    <span className="text-slate-400 truncate">@{evt.agent || "system"}</span>
    {/* Model badge */}
    {evt.model && (
      <span className="hidden sm:inline-block text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-[11px]">
        {evt.model}
      </span>
    )}
  </div>
  {/* Telemetry numbers */}
  <div className="flex items-center gap-3 shrink-0 text-slate-400 tabular-nums">
    <span>{(evt.input_tokens || 0) + (evt.output_tokens || 0)} tok</span>
    <span className="text-emerald-400 font-medium">
      ${(evt.cost_usd || 0).toFixed(4)}
    </span>
  </div>
</div>
```

---

## 5. Navigation & Sidebar (`components/layout/Sidebar.tsx`)

- **Active Route**: `bg-slate-800 text-white font-bold border-l-2 border-chart-agent` with animated layout pill (`layoutId="sidebar-active"`).
- **Inactive Route**: `text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border-l-2 border-transparent hover:border-chart-agent font-medium`.
- **Keyboard Shortcut Hints**: Emerges on hover (e.g. `<kbd>G D</kbd>` or `<kbd>G A</kbd>`).
- **Badge count**: `font-mono text-[10px] px-1.5 py-0.5 rounded-full`.
- **Accessibility**: All navigation wrapped in `<nav aria-label="Main Navigation">`, current route marked with `aria-current="page"`.

---

## 6. Empty States (`components/shared/EmptyState.tsx`)

Upgraded with purposeful entrance animations and custom actions.
Every empty state contains:
1. **Contextual Icon**: Optional custom `icon` prop (defaults to `<Construction />` in `bg-blue-600/10 border border-blue-500/20 text-blue-400`).
2. **Clear Title**: `text-xl font-semibold text-white`.
3. **Helpful Description**: Explaining why it is empty and how it will be populated.
4. **Actionable Button**: Optional `actionLabel` and `onAction` callback for immediate resolution.
5. **Motion**: Subtle `slideUp` entrance respecting `prefers-reduced-motion`.

---

## 7. Skeleton Component (`components/shared/Skeleton.tsx`)

Unified accessible skeleton loader for pending telemetry and async metrics.

### Variants
- `'card'`: KPI card placeholder with title, value, and footer pulse blocks.
- `'row'`: Table and list row placeholder with multi-column pulse blocks.
- `'chart'`: Visual area placeholder with animated bar mockups.
- `'text'`: Single or multi-line text bar placeholder.

### Props & Markup
```tsx
interface SkeletonProps {
  variant?: 'card' | 'row' | 'chart' | 'text'
  count?: number
  className?: string
}

// All pulse elements enforce aria-hidden="true"
<div className="w-full" aria-busy="true" aria-live="polite">
  <div data-testid="skeleton-card" aria-hidden="true" className="..." />
</div>
```

---

## 8. DataTooltip (`components/shared/DataTooltip.tsx`)

Dark-themed, high-contrast tooltip primitive providing ergonomic telemetry details.

### Features
- **Hover & Focus Trigger**: Supports keyboard focus and pointer hover.
- **Monospace Value Layout**: High-density typography with clear label-value alignment.
- **Color Indicators**: Integrates static CSS chart tokens (`bg-chart-input`, `bg-chart-output`, `bg-chart-cost`).
- **DataTooltipContent**: Structured sub-component optimized for Recharts custom tooltips and table popovers.

---

## 9. Error Boundary (`components/shared/ErrorBoundary.tsx`)

Resilient React class component catching runtime errors and providing immediate recovery pathways.

### Features
- **Component Context**: Renders failing component name (e.g. "Failed to render AnalyticsWidget").
- **Retry Mechanism**: Resets error boundary state without forcing a full page reload.
- **Report & Copy**: Diagnostic report generated and copied to clipboard with "Copied!" feedback toast.
- **Design Token Styling**: Styled via `border border-chart-error/20 bg-chart-error/5 text-slate-200`.


