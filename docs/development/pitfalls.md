# Known Pitfalls

Common mistakes encountered during development of the OpenSCENARIO Editor and how to avoid them. Originally compiled from a 105-session retrospective; update this file whenever a recurring footgun is found.

## Zustand Selectors

**Rules:**
- MUST use `useShallow()` for selectors returning arrays or objects — bare selectors cause infinite re-renders.
- Use stable empty-array constants (`const EMPTY: readonly T[] = []`) instead of inline `[]`.
- Wrap derived data in `useMemo` — `.filter()` / `.map()` in the render path without memoization causes loops.

**Why:** A hotfix was once required to fix an infinite re-render loop caused by an uncached `getSnapshot` in the Zustand store.

**How to apply:** Always review Zustand selector return shapes before completing any store-related work.

## 3D / Three.js Property Edits

**Rules:**
- Always confirm the target dimension or property name before editing (e.g. "housing depth" vs "bulb radius").
- Don't guess which axis or dimension the user means — ask explicitly.

**Why:** Multiple sessions wasted time because the wrong mesh property was modified (depth instead of thickness, wrong axis, etc.).

**How to apply:** When asked to adjust a 3D element, list the available properties first and confirm which one to change.

## UI / CSS Changes

**Rules:**
- Visually verify changes with a Playwright screenshot before reporting completion.
- First attempts often miss subtle issues (white dividers, wrong borders, incorrect spacing).

**Why:** Multiple UI fix sessions required 2–3 iterations because completion was reported without visual verification.

**How to apply:** After any styling change, take a screenshot to verify the result looks correct.

## TypeScript Strict Mode

**Rules:**
- Unused variables break the build — check after every edit.
- `pnpm typecheck` must pass before reporting any task as complete.

**Why:** A dedicated session was once needed just to fix unused-variable build errors that had accumulated across multiple edits.

**How to apply:** A `PostEditFile` hook runs `tsc --noEmit` automatically, but also run `pnpm typecheck` before commits as a safety net.
