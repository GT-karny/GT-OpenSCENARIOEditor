# GT-OpenSCENARIOEditor

A web-based visual editor for [ASAM OpenSCENARIO XML v1.2](https://www.asam.net/standards/detail/openscenario/) — the industry standard for autonomous driving simulation scenarios.

> Targeting the same space as IPG CarMaker and MathWorks RoadRunner, but with a modern browser-based UI, AI agent integration, and full open-source transparency.

---

## Features

- **Node editor** — Visualize and edit the Storyboard hierarchy (Story → Act → ManeuverGroup → Maneuver → Event → Action) as an interactive node graph
- **3D viewer** — Real-time Three.js road and vehicle rendering from `.xodr` / `.xosc` files
- **Scenario templates** — One-click scenario presets (Cut-In, Overtaking, Emergency Brake, Pedestrian Crossing, and more)
- **OpenDRIVE support** — Load `.xodr` road networks with geometric road shape computation
- **AI integration** — MCP server for agent-driven scenario authoring
- **esmini integration** — Live simulation preview via GT_Sim REST + gRPC API
- **i18n** — English and Japanese UI

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 6 |
| Styling | Tailwind CSS 4, shadcn/ui (APEX dark theme) |
| Node editor | @xyflow/react v12 |
| 3D rendering | Three.js |
| State | Zustand |
| Backend | Fastify (Node.js) |
| XML parsing | fast-xml-parser |
| Simulation | gRPC + REST (esmini / GT_Sim) |
| Testing | Vitest (unit), Playwright (E2E) |
| Monorepo | pnpm workspaces |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+

### Install

```bash
git clone https://github.com/GT-karny/GT-OpenSCENARIOEditor.git
cd GT-OpenSCENARIOEditor
pnpm install
```

### Run

```bash
# Frontend only (port 5173)
pnpm dev

# Frontend + backend (ports 5173, 3001)
pnpm dev:full
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Commands

```bash
pnpm dev              # Start frontend dev server
pnpm dev:full         # Start frontend + backend
pnpm build            # Build all packages
pnpm test             # Run unit tests (Vitest)
pnpm test:e2e         # Run E2E tests (Playwright)
pnpm typecheck        # TypeScript type checking
pnpm lint             # ESLint
pnpm format           # Prettier
```

## Monorepo Structure

```
apps/
  web/              — React frontend (main editor UI)
  server/           — Fastify backend (WebSocket, GT_Sim bridge)
packages/
  shared/           — Shared type contracts (immutable — coordinate before changing)
  openscenario/     — .xosc XML parser and serializer
  opendrive/        — .xodr parser and road geometry computation
  scenario-engine/  — Core business logic, Zustand store, Command pattern
  node-editor/      — React Flow node editor and timeline UI
  3d-viewer/        — Three.js road and vehicle visualization
  esmini/           — GT_Sim API client (REST + gRPC)
  mcp-server/       — MCP protocol for AI agent integration
  templates/        — Built-in scenario templates
  i18n/             — English/Japanese translation strings
  theme-apex/       — APEX design tokens and styles
```

## Sample Scenarios

Sample `.xosc` files are included under `Thirdparty/esmini-demo_Windows/esmini-demo/resources/xosc/` for testing and reference.

## Documentation

| Document | Description |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design and package relationships |
| [docs/FEATURES.md](docs/FEATURES.md) | Feature catalog and roadmap (93 tracked features) |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Setup, environment variables, troubleshooting |
| [docs/maturity/](docs/maturity/) | Capability matrix (88 capabilities across 11 domains) |

## License

[MIT](LICENSE)
