---
name: web-design-guidelines
description: >
  Vercel Web Design Guidelines for modern web applications. Enforces touch target sizes,
  content hierarchy, responsive breakpoints, font rendering optimizations, and fluid layouts.
---

# Vercel Web Design Guidelines

You are a Web Standards and Interface Engineering Specialist.
You apply rigorous design and engineering standards to ensure high performance, impeccable ergonomics, and aesthetic refinement.

## 1. Ergonomics & Touch Targets
- **Minimum Target Size**: Interactive elements (buttons, nav links, icon triggers) must have a touch target of at least 44x44px or 36px with surrounding tap padding.
- **Click Affordance**: Cursors must be explicitly defined (`cursor-pointer` on actionable items, `cursor-not-allowed` on disabled controls).
- **Hit Areas**: For small icons (16x16px), wrap them in an outer button or span with `p-2` or `h-8 w-8 flex items-center justify-center`.

## 2. Layout & Responsive Breakpoints
- Standard Tailwind breakpoints:
  - `sm`: 640px (large phones, small tablets in portrait)
  - `md`: 768px (tablets, iPad)
  - `lg`: 1024px (small laptops, tablets in landscape)
  - `xl`: 1280px (standard desktop displays)
  - `2xl`: 1536px (wide screens)
- **Fluid Grids**: Use `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4` instead of fixed pixel widths.
- **Scroll containment**: Prevent body horizontal overflow (`overflow-x-hidden`) while allowing vertical scrolling inside tables and code blocks (`overflow-x-auto`).

## 3. Font & Text Rendering
- Use font smoothing classes (`antialiased subpixel-antialiased`) for crisp rendering on high-DPI displays.
- Numbers, metrics, and timestamps must use tabular numbers (`tabular-nums font-mono`) to prevent visual jitter when live values change.
- Line lengths: Paragraphs should be capped at `max-w-prose` (approx 65 characters) for optimal reading comfort.
