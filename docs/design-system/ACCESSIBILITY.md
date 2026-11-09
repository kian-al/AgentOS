# AgentOS Design System — Accessibility Specification (WCAG 2.2 AA)

**Compliance Target**: WCAG 2.2 Level AA  
**Auditor**: AccessLint Skillset & Web Design Guidelines  

---

## 1. Contrast Ratios & Color Auditing (SC 1.4.3 & 1.4.11)

All text against the dark theme background (`#020617` and `#0f172a`) must satisfy minimum contrast:

| Element | Foreground | Background | Actual Ratio | Required | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Page Title** | `#ffffff` | `#020617` | **21.0:1** | 4.5:1 | PASS (AAA) |
| **Primary Text** | `#f8fafc` (`slate-50`) | `#0f172a` | **17.5:1** | 4.5:1 | PASS (AAA) |
| **Secondary Text** | `#cbd5e1` (`slate-300`) | `#0f172a` | **11.2:1** | 4.5:1 | PASS (AAA) |
| **Muted Labels** | `#94a3b8` (`slate-400`) | `#0f172a` | **7.1:1** | 4.5:1 | PASS (AA) |
| **Live Status Text**| `#34d399` (`emerald-400`)| `#020617` | **11.8:1** | 4.5:1 | PASS (AAA) |
| **Cost Metrics** | `#34d399` (`emerald-400`)| `#020617` | **11.8:1** | 4.5:1 | PASS (AAA) |
| **Error / Offline**| `#f87171` (`red-400`) | `#020617` | **8.2:1** | 4.5:1 | PASS (AA) |

> **Rule**: Do not use `text-slate-500` or `text-slate-600` for readable text or metadata. Use `text-slate-400` minimum for text, reserving `slate-500` purely for decorative borders or non-text iconography.

---

## 2. Keyboard Navigation & Focus Visible (SC 2.1.1, 2.4.7)

1. **Tab Sequence**: All interactive elements (Sidebar links, TopBar status, buttons, event items) must have a logical tab order matching visual flow.
2. **Focus Rings**:
   ```css
   focus-visible:outline-none
   focus-visible:ring-2
   focus-visible:ring-blue-500
   focus-visible:ring-offset-2
   focus-visible:ring-offset-slate-950
   ```
3. **Skip to Main Content**: Provide a `<a href="#main-content" className="sr-only focus:not-sr-only ...">Skip to main content</a>` for keyboard-only users.
4. **Escape Key**: All modal overlays and slide-out mobile drawers must close on `Escape` and restore focus to the triggering element.

---

## 3. Screen Reader & ARIA Roles (SC 1.3.1, 4.1.2)

1. **Live Regions**: The live telemetry feed in `DashboardPage` updates asynchronously. It must be equipped with:
   ```tsx
   <div role="feed" aria-live="polite" aria-label="Real-time Beacon events">
   ```
2. **Icon Triggers**: Any button with only an icon (e.g. mobile navigation toggle) must include:
   ```tsx
   <button aria-label="Open navigation menu">
     <Menu className="h-5 w-5" aria-hidden="true" />
   </button>
   ```
3. **Decorative Icons**: All visual glyphs (`<Cpu>`, `<Activity>`, `<Terminal>`) must be flagged with `aria-hidden="true"`.
4. **Active Navigation Links**: The active item in `Sidebar` must include `aria-current="page"`.

---

## 4. Reduced Motion (SC 2.3.3)

Users with vestibular disorders or motion sensitivity must not be subjected to gratuitous animation. AgentOS implements comprehensive compliance with WCAG 2.3.3 (Animation from Interactions):

### 4.1 CSS Override
All keyframes and transitions are capped to 0.01ms whenever `prefers-reduced-motion: reduce` is detected:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 4.2 Programmatic Enforcement
Components verify motion preference via `useReducedMotion()`. Motion variants are stripped and replaced with static instant rendering when active.

---

## 5. Global Keyboard Shortcuts & Access (SC 2.1.1, 2.1.2)

1. **Global Navigation Sequences**:
   - `g` then `d` → Navigates directly to `/dashboard`.
   - `g` then `a` → Navigates directly to `/analytics`.
   - Ignored when user is focused inside an `<input>`, `<textarea>`, or contentEditable element.
2. **Sheet / Drawer Dismissal**: Pressing `Escape` closes any open inspector drawer (`EventDetailSheet`, `SessionDrilldownSheet`, mobile menu).
3. **Table & Feed Navigation**:
   - Event rows and Session rows support `Tab` navigation.
   - Pressing `Enter` or `Space` opens the respective drilldown sheet with focus contained.


