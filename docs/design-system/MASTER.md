# AgentOS Design System — Master Specification

**Product**: AgentOS ("The Operating System for AI Agents")  
**Type**: Local-First Developer Observability & Telemetry Platform  
**Version**: 1.0.0  
**Design Leads**: UI/UX Pro Max, Frontend Design, Bencium Controlled UX  

---

## 1. Visual Identity & Brand Direction

### Product Purpose
AgentOS is the mission-control deck for autonomous AI agents (Claude Code, Beacon, background workers). It operates locally on the developer's machine, providing real-time telemetry, session tree visualization, and command orchestration.

### Design Personality
- **Precise & Architectural**: Engineered like an aerospace avionics console or high-end database query planner.
- **Deep Dark-First**: Optimized for long engineering sessions in low-light environments without eye fatigue.
- **High Information Density**: Dense, tabular, and scannable without looking crowded.
- **Anti-AI-Slop**: Zero gratuitous purple-neon gradients, zero ungrounded floating cards, and zero decorative animations that delay data comprehension. Every pixel serves an operational purpose.

---

## 2. Color System & Design Tokens

AgentOS employs a slate-based dark spectrum with calibrated functional accents.

### Surface & Background Tokens
| Token | Hex / HSL | Usage | WCAG Contrast on Text |
| :--- | :--- | :--- | :--- |
| `--background` | `hsl(224, 71%, 4%)` (`#020617`) | Global canvas background | Base level |
| `--surface-raised` | `hsl(224, 71%, 7%)` (`#0b0f19`) | AppHeader, Sidebar, Bottom status bar | 1.15:1 against canvas |
| `--card` | `hsl(222, 47%, 11%)` (`#0f172a`) | Cards, panels, modal dialog bodies | 1.25:1 against canvas |
| `--card-hover` | `hsl(217, 33%, 17%)` (`#1e293b`) | Hover state for interactive cards/rows | Noticeable lift |
| `--border` | `hsl(216, 34%, 17%)` (`#1e293b`) | Subtle dividers and component outlines | 3.2:1 against canvas |
| `--border-strong` | `hsl(215, 25%, 27%)` (`#334155`) | Focused borders, active tabs, dialog edges | 4.8:1 against canvas |

### Text & Content Tokens
| Token | Hex / Tailwind | Role | Contrast on `#020617` |
| :--- | :--- | :--- | :--- |
| `--text-primary` | `#f8fafc` (`slate-50`) | Titles, metrics, key data points | **19.8:1** (AAA) |
| `--text-secondary`| `#cbd5e1` (`slate-300`) | Standard body text, table cell values | **12.1:1** (AAA) |
| `--text-muted` | `#94a3b8` (`slate-400`) | Labels, secondary metadata, hints | **7.4:1** (AA) |
| `--text-subtle` | `#64748b` (`slate-500`) | Disabled states, timestamps, icons | 4.1:1 (UI graphical only) |

### Functional & Semantic Accents
| State | Accent Token | Tailwind Class | Meaning in AgentOS |
| :--- | :--- | :--- | :--- |
| **Primary Action** | `hsl(210, 100%, 52%)` (`#2563eb`) | `blue-600` / `blue-400` | Active route, primary CTA, link |
| **Live / Healthy** | `hsl(158, 64%, 52%)` (`#10b981`) | `emerald-500` / `emerald-400` | Beacon LIVE, WebSocket connected |
| **Telemetry** | `hsl(262, 83%, 58%)` (`#8b5cf6`) | `purple-500` / `purple-400` | Configured agents, tool execution |
| **System Event** | `hsl(199, 89%, 48%)` (`#0ea5e9`) | `sky-500` / `sky-400` | Command runners, file watcher activity |
| **Warning / Idle** | `hsl(38, 92%, 50%)` (`#f59e0b`) | `amber-500` / `amber-400` | Reconnecting socket, slow response |
| **Destructive / Err**| `hsl(0, 84%, 60%)` (`#ef4444`) | `red-500` / `red-400` | Session crash, parse failure, offline |

---

## 3. Typography Strategy

### Font Families
- **Interface & Prose**: `GeistSans`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, sans-serif.
- **Telemetry, Code & Metrics**: `GeistMono`, `ui-monospace`, `SFMono-Regular`, `Menlo`, monospace.

### Type Scale & Hierarchy
| Level | Font Size | Line Height | Weight | Letter Spacing | Font Family |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display KPI** | `32px` (`text-3xl`) | `36px` | `700` (Bold) | `-0.03em` | Monospace (Tabular) |
| **Section Title** | `20px` (`text-xl`) | `28px` | `600` (Semibold)| `-0.02em` | Sans |
| **Card Header** | `15px` (`text-sm`) | `20px` | `600` (Semibold)| `-0.01em` | Sans |
| **Body Regular** | `14px` (`text-sm`) | `20px` | `400` (Normal) | `normal` | Sans |
| **Subhead/Label** | `12px` (`text-xs`) | `16px` | `500` (Medium) | `+0.05em` | Sans (Uppercase) |
| **Code / Stream** | `12px` (`text-xs`) | `18px` | `400`/`500` | `normal` | Monospace |
| **Badge / Tag** | `11px` (`text-[11px]`)| `14px` | `600` (Semibold)| `+0.02em` | Monospace |

---

## 4. Spacing, Grid & Layout Structure

### Spacing Scale
AgentOS strictly follows an 8-point base spatial rhythm with 4-point half-steps:
`space-1` (4px), `space-2` (8px), `space-3` (12px), `space-4` (16px), `space-6` (24px), `space-8` (32px).

### Layout Geometry
```
+-------------------------------------------------------------------------+
| [Brand] AgentOS v0.1        TopBar [Live Status] [Mobile Hamburger]    | 64px Height
+----------------------+--------------------------------------------------+
| Sidebar (240px)      | Main Content Area                                |
|                      | - Breadcrumb / Page Title                        |
| - Dashboard          | - KPI Metric Grid (1 -> 2 -> 4 cols)             |
| - Analytics          | - Real-Time Event Feed & Inspection Split View   |
| - Agents             |                                                  |
| - Commands           |                                                  |
| - Hooks              |                                                  |
| - Sessions           |                                                  |
| - Settings           |                                                  |
+----------------------+--------------------------------------------------+
| Bottom Dock: Local-First Status & Engine Version                        |
+-------------------------------------------------------------------------+
```

---

## 5. Interaction & Motion Principles

1. **Micro-Transitions**: Fast, functional transitions adhering to `apps/web/src/lib/animations.ts` tokens (100ms to 200ms). Full details in `docs/design-system/ANIMATIONS.md`.
2. **Focus Visibility**: Universal focus ring `focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950`.
3. **Motion Safety & Reduced Motion**: Dual-layer reduced motion enforcement via CSS media reset and `useReducedMotion()` hook. Pulse animations use `motion-safe:animate-pulse motion-reduce:animate-none`.
4. **Keyboard Ergonomics**: Global sequence shortcuts `g` then `d` (/dashboard) and `g` then `a` (/analytics), with tooltip hints and `Escape` dismissal for drawers.
5. **Loading States**: Consistent accessible placeholders via `<Skeleton variant="card" | "row" | "chart" | "text" />`.

---

## 6. Chart Color Tokens

Standardized telemetry chart and visualization tokens configured in `globals.css` (`:root` and `.dark`), exposed via `tailwind.config.ts`, and accessible dynamically via `useChartColors()` hook.

| Token | HSL Value | Hex Equivalent | Usage / Semantic Role | WCAG Contrast vs Card (`#0f172a`) |
| :--- | :--- | :--- | :--- | :--- |
| `--chart-input` | `217 91% 60%` | `#3b82f6` | Input prompt tokens & tool execution areas | **4.8:1** (PASS AA) |
| `--chart-output` | `270 95% 65%` | `#a855f7` | Model completion tokens & agent action areas | **5.2:1** (PASS AA) |
| `--chart-cache` | `215 16% 47%` | `#64748b` | Cache read tokens & subtle auxiliary plots | **3.5:1** (PASS SC 1.4.11 UI Graphics) |
| `--chart-cost` | `160 84% 39%` | `#10b981` | Real-time dollar expenditures & session budgets | **5.6:1** (PASS AA) |
| `--chart-error` | `0 84% 60%` | `#ef4444` | Runtime exceptions, failure rate & crash spikes | **4.6:1** (PASS AA) |
| `--chart-agent` | `270 95% 65%` | `#a855f7` | Subagent lifecycle & delegation series | **5.2:1** (PASS AA) |
| `--chart-tool` | `217 91% 60%` | `#3b82f6` | Tool invocation timestamps & telemetry tags | **4.8:1** (PASS AA) |
| `--chart-session` | `160 84% 39%` | `#10b981` | Session starts, uptime boundaries & active status | **5.6:1** (PASS AA) |


