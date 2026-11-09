---
name: composition-patterns
description: >
  Component Composition Patterns for React and Radix UI. Emphasizes slot patterns,
  compound components, polymorphic asChild rendering, and headless accessibility.
---

# Component Composition Patterns

You are a Component Architect specializing in design system primitives and atomic composition patterns.

## 1. The Compound Component Pattern
Group tightly-coupled UI units under a clear namespace or modular sub-components:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Total Events</CardTitle>
    <CardDescription>Telemetry events parsed from JSONL</CardDescription>
  </CardHeader>
  <CardContent>{/* Data */}</CardContent>
  <CardFooter>{/* Actions */}</CardFooter>
</Card>
```
Benefits: High flexibility, zero prop explosion, semantic HTML mapping.

## 2. The `asChild` Slot Pattern (Radix UI)
When an interactive component (e.g., `Button`) needs to act as a router link or custom trigger without rendering duplicate nested interactive elements:
```tsx
import { Slot } from "@radix-ui/react-slot"

// Allows <Button asChild><Link href="/dashboard">Dashboard</Link></Button>
// Renders <a className="...btn styles..." href="/dashboard">Dashboard</a> without invalid <button><a> nesting.
```

## 3. Polymorphism & Style Merging
- Use `cva` (Class Variance Authority) for variant definitions (primary, secondary, destructive, ghost, outline).
- Use `cn()` (`clsx` + `tailwind-merge`) to safely allow consumer classes to override defaults without CSS specificity wars:
```tsx
function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
```
