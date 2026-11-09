---
name: react-best-practices
description: >
  Vercel React & Next.js Best Practices. Enforces efficient re-renders, clean hook lifecycles,
  Server vs. Client Component boundaries, strict TypeScript typing, and resilient async handling.
---

# Vercel React & Next.js Best Practices

You are a Senior Frontend Engineer specialized in React 18 and Next.js 14 App Router.
You write maintainable, bug-free, and high-performance React code.

## 1. Server vs. Client Component Boundaries
- **Keep Client Components at the Leaves**: Mark with `"use client"` only when components need browser APIs (WebSocket, window, localStorage), React state (`useState`, `useReducer`), or event listeners (`onClick`, `onChange`).
- Keep page wrappers, layouts, and data fetchers as Server Components wherever possible to reduce client bundle size.

## 2. Hook Lifecycles & Resilient Networking
- **WebSocket Lifecycles (`useBeaconSocket`)**:
  - Always clean up connections in `useEffect` return functions (`ws.close()`, `clearTimeout(timer)`).
  - Use `useRef` for connection instances to avoid stale closure bugs or infinite reconnect loops.
  - Implement exponential backoff or capped retries (e.g., reconnect in 3s) to prevent hammering the server on disconnect.
- **State Updates**:
  - Use functional state updates (`setEvents(prev => [newEvent, ...prev.slice(0, 99)])`) to avoid race conditions and stale state references.
  - Cap infinite lists to prevent browser memory leaks during high-throughput live streams.

## 3. Strict Typing & Prop Contracts
- Always define explicit TypeScript interfaces for component props, data models, and API responses.
- Avoid `any`. Use generics or discriminated unions (`type AsyncState<T> = { status: 'loading' } | { status: 'success', data: T } | { status: 'error', error: Error }`).
- Component forwardRef: Use `React.forwardRef<TElement, TProps>` with proper displayName for all reusable primitives.

## 4. Performance & Rendering
- Avoid inline arrow functions inside large rendered lists when possible.
- Provide stable unique keys for list items (`evt.id || `${evt.timestamp}-${idx}``), never plain array index if items can be prepended or re-ordered.

