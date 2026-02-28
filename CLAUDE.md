# CLAUDE.md — OpenSCENARIO Editor

> Project instructions for Claude Code sessions.
> This file is automatically loaded at the start of every session.

## Project Overview

OpenSCENARIO v1.2 visual editor for autonomous driving simulation scenarios.
Competing with IPG CarMaker and MathWorks RoadRunner — aiming for more modern UI, AI integration, and OSS transparency.

- **Stack**: React 19, TypeScript, Vite 6, Tailwind CSS 4, shadcn/ui, Three.js, @xyflow/react, Zustand
- **Monorepo**: pnpm workspaces
- **Design**: APEX theme (dark, glass-effect, Orbitron font). Final mockup: `apps/web/mockups/design-apex-v4.html`
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
  esmini/       — GT_Sim API client (REST + gRPC)
  mcp-server/   — MCP protocol for AI agent integration
  templates/    — Use case templates and action components
  i18n/         — English/Japanese translations
```

### Critical Rule: `@osce/shared` is immutable

All packages depend on `@osce/shared` for type contracts. Changes to shared types affect **every** package. If you need to modify shared types:
1. Plan the change carefully
2. Update ALL dependent packages in the same PR
3. Never run this in a parallel worktree with other work

## Commands

```bash
pnpm dev              # Start frontend only (port 5173)
pnpm dev:full         # Start frontend + backend (ports 5173, 3001)
pnpm test             # Vitest unit tests (all packages)
pnpm test:e2e         # Playwright E2E (mock backend)
pnpm typecheck        # TypeScript type checking
pnpm lint             # ESLint
pnpm format           # Prettier
pnpm build            # Build all packages

# Maturity system
pnpm maturity:validate  # Validate capability JSON files
pnpm maturity:matrix    # Generate matrix.md + matrix.json
pnpm maturity:view      # Serve viewer.html on port 4173
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
- Use discriminated unions for action/condition types (see `packages/shared/src/types/`)
- Prefer `interface` over `type` for object shapes
- No `any` — use `unknown` and narrow with type guards

### React
- Functional components only
- Zustand for global state (`packages/scenario-engine/`)
- shadcn/ui components (in `apps/web/src/components/ui/`)
- Tailwind CSS 4 for styling

### File Organization
- Components: `apps/web/src/components/`
- Hooks: `apps/web/src/hooks/`
- Stores: `apps/web/src/stores/`
- Types: `packages/shared/src/types/`
- Parser modules: `packages/openscenario/src/parser/parse-*.ts`
- Serializer modules: `packages/openscenario/src/serializer/build-*.ts`

### Testing
- Unit tests: colocated `__tests__/` directories
- E2E tests: `e2e/` at project root
- E2E uses Playwright with dual webServer (backend + frontend)
- Use `cross-env` for Windows-compatible test scripts

## Key Reference Files

| File | Purpose |
|------|---------|
| `docs/ARCHITECTURE.md` | System design, phase history |
| `docs/FEATURES.md` | Feature catalog, priority roadmap, XSD coverage |
| `docs/DEVELOPMENT.md` | Setup, startup modes, troubleshooting |
| `docs/maturity/` | Capability matrix system (88 capabilities, 11 domains) |
| `Thirdparty/openscenario-v1.2.0/Schema/OpenSCENARIO.xsd` | OpenSCENARIO v1.2 specification |
| `Thirdparty/esmini-demo_Windows/esmini-demo/resources/xosc/` | Sample .xosc scenarios |
| `apps/web/mockups/design-apex-v4.html` | APEX design mockup (final) |

## Current Priorities (from docs/FEATURES.md)

**Tier 1 — Demo Must-Have:**
Node add/delete from UI, APEX node theming, dropdown property editors, position editor, nested properties, full undo/redo, timeline time axis.

**Tier 2 — Demo Quality:**
Road/vehicle 3D rendering, sub-tree collapse, manual edge connection, error navigation, keyboard shortcuts, template preview.

See `docs/FEATURES.md` for the full roadmap with 93 tracked features.

## Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `PORT` | Backend HTTP/WS port | 3001 |
| `GT_SIM_URL` | GT_Sim REST API URL | (unset = mock mode) |
| `GT_SIM_GRPC` | GT_Sim gRPC host | 127.0.0.1:50051 |
| `VITE_WS_URL` | Frontend WebSocket URL | ws://localhost:3001/ws |

## Don'ts

- Don't modify `packages/shared/` types without updating all dependents
- Don't commit directly to main without running typecheck
- Don't add dependencies without checking for existing alternatives in the monorepo
- Don't use relative imports across package boundaries — use `@osce/*` aliases
- Don't skip the XoscParser/XoscSerializer when adding OpenSCENARIO element support — both must be updated together
- Don't write Japanese in code comments — English only. Japanese is for user-facing strings via i18n.
