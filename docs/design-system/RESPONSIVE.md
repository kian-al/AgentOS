# AgentOS Design System — Responsive Layout Strategy

**Target Devices**: Mobile (320px - 767px), Tablet (768px - 1023px), Desktop (1024px - 1440px), Wide Screen (> 1440px).

---

## 1. Breakpoint Architecture

| Token | Min Width | Target Viewport | Key Layout Behavior |
| :--- | :--- | :--- | :--- |
| **base** | `0px` | Small phones (iPhone SE, etc.) | Single column KPI, collapsed drawer, full-width feed |
| **sm** | `640px` | Large phones, portrait tablets | 2-column KPI grid, compact event badges |
| **md** | `768px` | Tablets (iPad portrait) | TopBar with subtitle, 2-column KPI grid |
| **lg** | `1024px` | Small laptops, iPad landscape | Persistent 240px Sidebar, 4-column KPI grid, 2:1 split feed |
| **xl** | `1280px` | Standard desktop monitors | Max-width 1280px centered content container |
| **2xl** | `1536px` | Ultra-wide displays | Room for secondary telemetry inspectors |

---

## 2. Mobile Strategy (< 768px)

### Current Problem Identified in Audit
The original `AppShell.tsx` renders `<Sidebar className="w-64" />` side-by-side with `<main>` on all screen widths. On mobile (< 768px), the 256px sidebar leaves less than 120px for the dashboard, causing severe horizontal overflow and unreadable content.

### Solution: Responsive Drawer & Mobile TopBar
1. **Hide Desktop Sidebar**: `hidden md:flex flex-col w-64 shrink-0`.
2. **Mobile Hamburger Button**: Render a hamburger button in `TopBar` on `< md` screens (`md:hidden`).
3. **Slide-Over Drawer**: When toggled on mobile, slide in the sidebar as a backdrop-filtered modal drawer (`fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm`).
4. **Touch Targets**: All mobile nav items have min-height 44px (`py-3`) for effortless fingertip selection.
5. **Dismiss on Navigation**: Automatically close drawer when a navigation link is clicked.

---

## 3. Tablet Strategy (768px - 1023px)

- Sidebar is visible (`w-60` or `w-64`).
- KPI grid: 2 columns (`grid-cols-2`).
- Event stream: Full width, stacked above the Platform Pillars card (`grid-cols-1`).

---

## 4. Desktop & Wide Screen (>= 1024px)

- Sidebar: Fixed `w-64` with brand lockup, navigation badges, and environment status.
- KPI grid: 4 columns (`grid-cols-4`).
- Live Feed: 2:1 split ratio (`lg:col-span-2` for live events, `lg:col-span-1` for platform pillars).
- Max-width containment: `max-w-7xl mx-auto` to prevent stretched, hard-to-read line lengths on 4K screens.

