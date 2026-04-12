# CLAUDE.md — OpenSCENARIO Editor

> Project instructions for Claude Code sessions.
> This file is automatically loaded at the start of every session.

## Core Principles

1. **UI must always follow the APEX design system.** No exceptions — use APEX tokens, classes, and patterns.
2. **UI must be instantly understandable.** Every element should be self-explanatory at first glance.
3. **Follow OpenDRIVE/OpenSCENARIO specs strictly.** Always reference the XSD schema; never guess or approximate.
4. **Minimal code, maximum impact.** Prefer deleting lines over adding. Find root causes, not band-aids.

## Language

- Always respond in Japanese (日本語) unless explicitly asked to use another language.
- Plans, explanations, and status updates must be in Japanese.
- Code comments, commit messages, and PR descriptions remain in English.

## Project Overview

OpenSCENARIO visual editor for autonomous driving simulation scenarios.
Competing with IPG CarMaker and MathWorks RoadRunner — aiming for more modern UI, AI integration, and OSS transparency.

- **Base specification**: OpenSCENARIO v1.3.1 (primary target). Legacy v1.2 support maintained for backward compatibility, but new features and type definitions should follow the v1.3.1 spec.

- **Stack**: React 19, TypeScript, Vite 6, Tailwind CSS 4, shadcn/ui, Three.js, @xyflow/react, Zustand
- **Monorepo**: pnpm workspaces
- **Simulation**: esmini WASM runs in-browser via Web Worker; server-based REST/gRPC path also supported
- **Design**: APEX theme (`@osce/theme-apex`). Final mockup: `docs/mockups/design-apex-v4.html`
- **i18n**: English-first (OSS), Japanese secondary. Use `@osce/i18n` package.

## Architecture

Monorepo: `apps/` (web, server, desktop) + `packages/` (shared, openscenario, opendrive, opendrive-engine, scenario-engine, node-editor, 3d-viewer, esmini, theme-apex, mcp-server, templates, i18n). Run `ls` for details.

### Critical Rule: `@osce/shared` is immutable

All packages depend on `@osce/shared` for type contracts. Changes affect every package — plan carefully, update all dependents in the same PR, and never run in a parallel worktree.

## Commands

```bash
pnpm package          # Full packaging pipeline (typecheck → build → exe)
pnpm dev              # Start frontend only (port 5173)
pnpm dev:server       # Start backend only (port 3001)
pnpm dev:full         # Start frontend + backend (ports 5173, 3001)
pnpm build            # Build all packages
pnpm build:shared     # Build @osce/shared only (run first when types change)
pnpm test             # Vitest unit tests (all packages)
pnpm test:e2e         # Playwright E2E (mock backend)
pnpm typecheck        # TypeScript type checking
pnpm lint             # ESLint
pnpm lint:fix         # ESLint with auto-fix
pnpm format           # Prettier
pnpm dev:desktop      # Start Electron desktop app (dev mode)
pnpm build:desktop    # Build all packages + Electron distributable
pnpm clean            # Remove all dist/ directories
# Maturity: pnpm maturity:validate | maturity:matrix | maturity:view
```

## Development Workflow

### Owner's Role
The project owner is a PM/planner (not a developer). They use Claude Code as the primary implementation tool. Respect their decisions on priorities and direction.

### Parallel Development with Worktrees
This project uses Claude Code worktrees for parallel development. When assigning tasks:

- **Safe to parallelize**: Tasks touching different packages (e.g., `@osce/node-editor` + `@osce/3d-viewer`)
- **Must be sequential**: Tasks touching `@osce/shared` or `apps/web` (shared state)
- **Branch strategy**: worktree → feature branch → merge to main

### Task Scope
- Prefer small, focused changes within package boundaries
- Always run `pnpm typecheck` before committing
- Run `pnpm test` if you changed any logic
- Keep commits atomic — one logical change per commit

## Coding Conventions

### TypeScript
- Strict mode enabled
- Use `import type` for type-only imports (ESLint enforces `consistent-type-imports`)
- Use discriminated unions for action/condition types (see `packages/shared/src/types/`)
- Prefer `interface` over `type` for object shapes
- No `any` — use `unknown` and narrow with type guards

### React
- Functional components only
- Zustand for global state: core in `packages/scenario-engine/` and `packages/opendrive-engine/`, app stores in `apps/web/src/stores/`
- shadcn/ui components (in `apps/web/src/components/ui/`)
- Tailwind CSS 4 for styling

### Commit Messages
- Conventional Commits: `type(scope): description`
- Types: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore`
- Scopes: package or area name (e.g., `property`, `3d-viewer`, `ui`, `shared`)
- Example: `feat(property): add TransitionDynamics editor with shape icons`

### APEX Styling
- Full rules in `apps/web/CLAUDE.md` and `docs/STYLE_GUIDE.md`
- Key rule: `rounded-none` always, APEX CSS variable tokens only, no shadcn tokens outside `components/ui/`

### Formatting
- Prettier: single quotes, 100 char width, trailing commas, LF line endings

### Testing
- Unit tests: colocated `__tests__/` directories
- E2E tests: `apps/web/e2e/` (Playwright config at `apps/web/playwright.config.ts`)
- E2E uses Playwright with dual webServer (backend + frontend)
- Use `cross-env` for Windows-compatible test scripts
- Set `USE_GT_SIM=true` to enable E2E tests requiring GT_Sim server

## Key References

- Specs: `Thirdparty/openscenario-v1.3.1/.../OpenSCENARIO.xsd` (primary), `openscenario-v1.2.0` (legacy)
- Architecture & features: `docs/ARCHITECTURE.md`, `docs/FEATURES.md`
- Active proposals: `docs/proposals/` — e.g. `opendrive-editor.md`, `lht-support.md`
- Development knowledge: `docs/development/pitfalls.md` (must-read), `docs/development/wasm-build.md`
- APEX styling: `docs/STYLE_GUIDE.md` (rules), `docs/design/apex-identity.md` (brand & visual concept), `packages/theme-apex/README.md` (tokens)
- Sample scenarios: `Thirdparty/esmini-demo_Windows/esmini-demo/resources/xosc/`
- Environment: see `.env` files and `docs/DEVELOPMENT.md`
- Dev container (Podman): `.devcontainer/README.md`

## Quality Gates

### Before Reporting Completion
- Run `pnpm typecheck` after every edit session — fix all errors before moving on
- After implementation work: also run `pnpm build` (not just typecheck/test) before handing back — owner expects to immediately try changes in the running app, so a broken build wastes their cycle
- For UI/styling changes: visually verify with Playwright screenshot before reporting completion
- For 3D/Three.js changes: confirm which specific property to modify before editing — ask if ambiguous

### Zustand Selector Safety
- Always use `useShallow()` for selectors returning arrays or objects
- Use stable empty-array constants instead of inline `[]` in selectors
- Wrap derived data in `useMemo` — bare `.filter()` / `.map()` in selectors cause infinite re-renders

### UI Layout Defaults
- Keep related form fields (Value+Kind, delta/factor) on the same row unless explicitly told otherwise
- Follow existing compact styling patterns in the codebase

### Git Workflow
- Before starting git operations, confirm the full scope: branch? commit? merge? push?
- Use `/ship` skill for品質チェック付きコミット (lint → typecheck → test → build → commit)

## Don'ts

- Don't modify `packages/shared/` types without updating all dependents
- Don't commit directly to main without running typecheck
- Don't add dependencies without checking for existing alternatives in the monorepo
- Don't use relative imports across package boundaries — use `@osce/*` aliases
- Don't skip the XoscParser/XoscSerializer when adding OpenSCENARIO element support — both must be updated together
- Don't write Japanese in code comments — English only. Japanese is for user-facing strings via i18n.
- Don't modify `Thirdparty/GT_Sim/` directly — it's a git submodule (esmini fork)
- Don't edit `apps/web/public/wasm/` files directly — they are WASM build outputs
- Don't rebuild WASM without following the build procedure (see Emscripten SDK setup)
