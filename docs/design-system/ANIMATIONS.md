# AgentOS Design System — Motion & Animation Specification

**Product**: AgentOS ("The Operating System for AI Agents")  
**Specification**: Motion System & Micro-Interactions  
**Version**: 1.0.0  
**Status**: APPROVED & IMPLEMENTED  

---

## 1. Motion Philosophy

AgentOS is an operational control deck for developers monitoring autonomous AI agents. Motion within AgentOS is strictly functional, utilitarian, and ergonomic:

1. **Velocity First**: Developer tools must feel immediate. Animation durations stay between **100ms and 200ms**, never exceeding 300ms.
2. **Contextual Confirmation**: Animations confirm state transitions (data refreshed, tab switched, filter applied) without shifting cognitive focus.
3. **Zero Layout Shifts**: Transitions utilize transform (`translate`, `scale`) and `opacity` properties exclusively, ensuring 60fps rendering without reflows.
4. **Mandatory Reduced Motion Respect**: Any user requesting reduced motion receives an instantaneous, zero-transition experience adhering to WCAG 2.3.3.

---

## 2. Animation Tokens (`apps/web/src/lib/animations.ts`)

All motion variants and timings are centralized in `apps/web/src/lib/animations.ts`.

### Duration Tokens
| Token | Value | Use Case |
| :--- | :--- | :--- |
| `DURATION.instant` | `0.1s` (100ms) | Hover states, icon reveals, tooltip transitions |
| `DURATION.fast` | `0.15s` (150ms) | List row entrances, badge pops, sort reordering |
| `DURATION.normal` | `0.2s` (200ms) | Sheet slide-overs, tab switching, card entrances |
| `DURATION.slow` | `0.3s` (300ms) | Full panel drawers, backdrop reveals |

### Easing Tokens
| Token | Value | Curve Characteristic |
| :--- | :--- | :--- |
| `EASING.default` | `[0.25, 0.1, 0.25, 1]` | Natural cubic-bezier for standard elements |
| `EASING.enter` | `[0, 0, 0.2, 1]` | High initial velocity ease-out for entering items |
| `EASING.exit` | `[0.4, 0, 1, 1]` | Accelerating ease-in for exiting elements |
| `EASING.spring` | `{ stiffness: 400, damping: 30 }` | Bounded spring for active indicator pills |
| `numberSpring` | `{ stiffness: 100, damping: 20 }` | Numeric count-up transitions |

### Pre-defined Motion Variants
```typescript
// Fade In
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DURATION.normal } },
}

// Slide Up (Entering rows, cards, empty states)
export const slideUp = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.normal, ease: EASING.enter } },
}

// Slide In Right (Drawers, inspector sheets)
export const slideInRight = {
  hidden: { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0, transition: { duration: DURATION.normal, ease: EASING.enter } },
}

// Scale In (Badges, indicators, status pings)
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1, transition: { duration: DURATION.fast, ease: EASING.enter } },
}

// Stagger Container & Items
export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}

export const staggerItem = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.fast } },
}
```

---

## 3. Reduced Motion Support (WCAG 2.3.3)

AgentOS provides dual-layer reduced motion enforcement:

### 3.1 CSS Reset (`globals.css`)
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 3.2 Programmatic Hook (`useReducedMotion.ts`)
The `useReducedMotion()` hook dynamically queries `window.matchMedia("(prefers-reduced-motion: reduce)")` and observes real-time user preference updates. Components skip Framer Motion variants and render static elements when active.

---

## 4. Component Motion Applications

### 4.1 KPI Cards (`KpiCard.tsx` & `KpiGrid.tsx`)
- **Staggered Mount**: Grid utilizes `staggerContainer` (50ms interval) to reveal KPI metrics systematically.
- **Value Change**: Numbers animate with a rapid fade-and-settle (`y: -2` to `0`, `150ms`).
- **Delta Badge**: Pops into view using `scaleIn` (150ms).
- **Hover Micro-interaction**: `hover:-translate-y-0.5 hover:shadow-lg` for tactile feedback.

### 4.2 Live Event Feed (`EventFeed.tsx` & `EventRow.tsx`)
- **Real-Time Stream**: New events entering the feed slide into view using `AnimatePresence` and `slideUp` (150ms).
- **Throttling & Buffer**: Capped to top 5 rows on mount to prevent layout thrashing. Disabled during feed pause.
- **Glowing Status Dots**: Category dots use static CSS shadow tokens (e.g. `shadow-[0_0_6px_var(--chart-tool)]`).
- **Pulsing Buffer Badge**: When paused, `animate-pulse` illuminates the buffer count button.

### 4.3 Navigation & Controls
- **Sidebar Active Indicator (`Sidebar.tsx`)**: Sliding active pill uses `layoutId="sidebar-active"` with spring damping.
- **Range Toggle (`RangeToggle.tsx`)**: Sliding filter pill uses `layoutId="range-active-pill"`.
- **Keyboard Navigation Hints**: Subtle `<kbd>` tags emerge on navigation item hover (`G D` for Dashboard, `G A` for Analytics).

### 4.4 Analytics Visualizations
- **Token Heatmap (`TokenHeatmap.tsx`)**: Weekly columns reveal left-to-right in chronological flow (10ms staggered delay per column).
- **Model Comparison Table (`ModelComparisonTable.tsx`)**: Rows smoothly reorder upon column sort using `motion.tr layout`.
- **Cost Projection Widget (`CostProjectionWidget.tsx`)**: Number counter reveal and confidence badge `scaleIn`.

