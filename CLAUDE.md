# CLAUDE.md — OpenSCENARIO Editor

> Project instructions for Claude Code sessions.
> This file is automatically loaded at the start of every session.

## Project Overview

OpenSCENARIO v1.2 visual editor for autonomous driving simulation scenarios.
Competing with IPG CarMaker and MathWorks RoadRunner — aiming for more modern UI, AI integration, and OSS transparency.

- **Stack**: React 19, TypeScript, Vite 6, Tailwind CSS 4, shadcn/ui, Three.js, @xyflow/react, Zustand
- **Monorepo**: pnpm workspaces
- **Simulation**: esmini WASM runs in-browser via Web Worker; server-based REST/gRPC path also supported
- **Design**: APEX theme (`@osce/theme-apex`). Final mockup: `apps/web/mockups/design-apex-v4.html`
- **i18n**: English-first (OSS), Japanese secondary. Use `@osce/i18n` package.

## Architecture

```
apps/
  web/          — React frontend (port 5173)
  server/       — Fastify backend (port 3001)
packages/
  shared/       — Type definitions (IMMUTABLE CONTRACT — do not modify without coordination)
  openscenario/ — .xosc XML parser/serializer
  opendrive/    — .xodr parser, road shape computation
  scenario-engine/ — Core business logic (Zustand store, Command pattern)
  node-editor/  — React Flow node editor + timeline UI
  3d-viewer/    — Three.js visualization
  esmini/       — GT_Sim API client (REST + gRPC); WASM variant in apps/web/
  theme-apex/   — APEX design system (glass, cursor light, tokens)
  mcp-server/   — MCP protocol for AI agent integration
  templates/    — Use case templates and action components
  i18n/         — English/Japanese translations
```

### Critical Rule: `@osce/shared` is immutable

All packages depend on `@osce/shared` for type contracts. Changes affect every package — plan carefully, update all dependents in the same PR, and never run in a parallel worktree.

## Commands

```bash
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
- Zustand for global state: core in `packages/scenario-engine/`, app stores in `apps/web/src/stores/`
- shadcn/ui components (in `apps/web/src/components/ui/`)
- Tailwind CSS 4 for styling

### Formatting
- Prettier: single quotes, 100 char width, trailing commas, LF line endings

### File Organization
- Components: `apps/web/src/components/`
- Hooks: `apps/web/src/hooks/`
- Stores: `apps/web/src/stores/`
- WASM simulation: `apps/web/src/lib/wasm/`
- Types: `packages/shared/src/types/`
- Parser modules: `packages/openscenario/src/parser/parse-*.ts`
- Serializer modules: `packages/openscenario/src/serializer/build-*.ts`

### Testing
- Unit tests: colocated `__tests__/` directories
- E2E tests: `e2e/` at project root
- E2E uses Playwright with dual webServer (backend + frontend)
- Use `cross-env` for Windows-compatible test scripts
- Set `USE_GT_SIM=true` to enable E2E tests requiring GT_Sim server

## Key Reference Files

| File | Purpose |
|------|---------|
| `docs/ARCHITECTURE.md` | System design, phase history |
| `docs/FEATURES.md` | Feature catalog, priority roadmap, XSD coverage |
| `docs/DEVELOPMENT.md` | Setup, startup modes, troubleshooting |
| `docs/maturity/` | Capability matrix system |
| `packages/theme-apex/README.md` | APEX design tokens, CSS classes, components |
| `Thirdparty/openscenario-v1.2.0/Schema/OpenSCENARIO.xsd` | OpenSCENARIO v1.2 specification |
| `Thirdparty/esmini-demo_Windows/esmini-demo/resources/xosc/` | Sample .xosc scenarios |

## Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `PORT` | Backend HTTP/WS port | 3001 |
| `GT_SIM_URL` | GT_Sim REST API URL | (unset = mock mode) |
| `GT_SIM_GRPC` | GT_Sim gRPC host | 127.0.0.1:50051 |
| `VITE_WS_URL` | Frontend WebSocket URL | ws://localhost:3001/ws |
| `USE_GT_SIM` | Enable GT_Sim E2E tests | (unset = skip) |

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
