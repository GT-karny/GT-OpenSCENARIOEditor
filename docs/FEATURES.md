# Feature Ledger — OpenSCENARIO Editor

> Generated: 2026-03-04 | Method: Code review + owner Q&A
> Purpose: PM management ledger (internal tracking)
> Competitor targets: IPG CarMaker, MathWorks RoadRunner
> Release: Full-stack OSS

### Status Legend

| Icon | Status | Definition |
|------|--------|------------|
| ✅ | Verified | Confirmed working through actual use by the owner |
| ⚠️ | Unverified | Implemented in code but not tested/confirmed by the owner |
| 🟡 | Partial | Partially implemented; some aspects work, others don't |
| 🔲 | Scaffold | UI/code structure exists but not functional |
| ❌ | Not Started | Not yet implemented |
| 🚫 | Discontinued | Feature discontinued; code may remain for future revival |

---

## Dashboard

| Category | ✅ | ⚠️ | 🟡 | 🔲 | ❌ | 🚫 | Total |
|----------|----|----|----|----|----|----|-------|
| File & Project | 4 | 3 | 0 | 1 | 2 | 0 | 10 |
| Scenario Editing | 18 | 20 | 2 | 0 | 4 | 1 | 45 |
| 3D & Visualization | 5 | 10 | 0 | 0 | 2 | 0 | 17 |
| Simulation | 0 | 1 | 6 | 0 | 3 | 1 | 11 |
| AI Integration | 0 | 1 | 0 | 0 | 2 | 0 | 3 |
| Validation & Quality | 3 | 0 | 0 | 0 | 3 | 0 | 6 |
| Infrastructure | 7 | 4 | 2 | 0 | 1 | 0 | 14 |
| **Total** | **37** | **39** | **10** | **1** | **17** | **2** | **106** |

---

## 1. File & Project

| # | Feature | Status | Notes | Tests |
|---|---------|--------|-------|-------|
| 1.1 | New scenario | ✅ | File > New, resets store to empty scenario | E2E: `file-operations` |
| 1.2 | Open .xosc file | ✅ | File > Open (Ctrl+O), File System Access API, XoscParser | E2E: `file-operations` |
| 1.3 | Save .xosc file | ✅ | File > Save (Ctrl+S), XoscSerializer, save dialog | E2E: `file-operations` |
| 1.4 | Open .xodr file | ✅ | Toolbar button, XodrParser, loads road network | Unit: `xodr-parser` |
| 1.5 | Project CRUD | ⚠️ | REST API: list, create, update, delete projects | Unit: `project-routes`, `project-service` |
| 1.6 | File tree browser | ⚠️ | Backend file service, project file navigation | Unit: `file-routes`, `file-service` |
| 1.7 | ZIP export/import | ⚠️ | GET /api/projects/:id/export, POST /api/projects/import | -- |
| 1.8 | Recent files | 🔲 | Store supports `recentProjectIds`, no UI yet | -- |
| 1.9 | Drag & drop file open | ❌ | — | -- |
| 1.10 | Export as other format | ❌ | No export to JSON, PDF, image, etc. | -- |

---

## 2. Scenario Editing

### 2.1 Entities

| # | Feature | Status | Notes | Tests |
|---|---------|--------|-------|-------|
| 2.1.1 | Entity list display | ✅ | Left panel > Entities. Name, type, category shown | E2E: `entity-crud` |
| 2.1.2 | Add entity (dialog) | ✅ | + button → dialog. Name + Type input | E2E: `entity-crud` |
| 2.1.3 | Delete entity | ✅ | Delete button per entity | E2E: `entity-crud` |
| 2.1.4 | Select entity → show properties | ✅ | Left panel → Right panel, bidirectional sync | E2E: `entity-crud` |
| 2.1.5 | Select entity → highlight node | ✅ | Left panel → Node editor selection sync | -- |
| 2.1.6 | Entity type: Vehicle | ✅ | Full support: category, performance, mass, role, bounding box, axles | Unit: `entity-operations` |
| 2.1.7 | Entity type: Pedestrian | ⚠️ | Supported in parser/serializer/properties | Unit: `entity-operations` |
| 2.1.8 | Entity type: MiscObject | ⚠️ | Supported in parser/serializer/properties | Unit: `entity-operations` |
| 2.1.9 | Entity inline rename | ⚠️ | Via Properties panel text input | -- |
| 2.1.10 | Entity duplicate | ❌ | No duplicate action | -- |
| 2.1.11 | Entity reorder | ❌ | No drag reorder | -- |

### 2.2 Node Editor

| # | Feature | Status | Notes | Tests |
|---|---------|--------|-------|-------|
| 2.2.1 | Storyboard tree visualization | ✅ | Storyboard→Story→Act→ManeuverGroup→Maneuver→Event→Action | Unit: `document-to-flow` |
| 2.2.2 | Entity nodes | ✅ | Vehicle name, type, category | Unit: `node-factory` |
| 2.2.3 | Init node | ✅ | Shows Teleport, Speed actions | -- |
| 2.2.4 | Trigger/Condition nodes | ✅ | SimulationTime, RelativeDistance, etc. | Unit: `condition-display` |
| 2.2.5 | Edge connections | ✅ | Parent-child relationships visualized | Unit: `edge-factory` |
| 2.2.6 | Node selection | ✅ | Selected border, Properties sync | -- |
| 2.2.7 | Zoom In/Out | ✅ | Control panel buttons | -- |
| 2.2.8 | Fit View | ✅ | Centers all nodes | -- |
| 2.2.9 | Mini Map | ✅ | Bottom-right overview | -- |
| 2.2.10 | Toggle Interactivity | ✅ | Control panel button | -- |
| 2.2.11 | APEX node theming | ⚠️ | Glass backdrop, colored dots, glow on selection, pulse animation | -- |
| 2.2.12 | Node add (context menu) | 🟡 | Right-click → Add Child works; want toolbar/drag-drop too | -- |
| 2.2.13 | Node delete (context menu) | ⚠️ | Right-click → Delete with confirmation dialog | -- |
| 2.2.14 | Collapse/expand sub-trees | ⚠️ | Via context menu, ▼/▶ visual indicator | -- |
| 2.2.15 | Node drag/move | ⚠️ | ReactFlow supports it, untested | -- |
| 2.2.16 | Connect nodes (draw edge) | ❌ | No manual edge creation | -- |
| 2.2.17 | Node search/filter | ❌ | No search in node editor | -- |

### 2.3 Properties Panel

| # | Feature | Status | Notes | Tests |
|---|---------|--------|-------|-------|
| 2.3.1 | Entity properties display | ✅ | Name, Type, Category, Performance | -- |
| 2.3.2 | Text input editing | ✅ | Editable textboxes | -- |
| 2.3.3 | Dropdown/enum editors | ⚠️ | EnumSelect component for all enum fields | -- |
| 2.3.4 | Position editor (XYZ) | ⚠️ | 8 position types: World, Lane, RelativeLane, Road, RelativeRoad, RelativeObject, RelativeWorld, Geo | -- |
| 2.3.5 | Nested property expansion | ⚠️ | Position fields X/Y/Z/H/P/R expanded, optional fields clearable | -- |
| 2.3.6 | Parameter-aware inputs | ⚠️ | Autocomplete + type binding for parameter references | -- |
| 2.3.7 | Action property editor | ⚠️ | 20+ action types supported | Unit: `action-display` |
| 2.3.8 | Condition property editor | ⚠️ | All entity/value condition types | Unit: `condition-display` |
| 2.3.9 | Scenario property editor | ⚠️ | FileHeader, RoadNetwork, CatalogLocations | -- |

### 2.4 Catalog System

| # | Feature | Status | Notes | Tests |
|---|---------|--------|-------|-------|
| 2.4.1 | Catalog reference resolution | 🟡 | Vehicle/Pedestrian/MiscObject/Controller OK. Maneuver/Trajectory/Route/Environment catalogs not yet | Unit: `parse-catalog` |
| 2.4.2 | Catalog auto-load | ⚠️ | Auto-discover catalogs in project directory | -- |
| 2.4.3 | Catalog editor modal | ⚠️ | CRUD operations, parameter assignment editing | -- |
| 2.4.4 | Parameter binding preservation | ⚠️ | Round-trip through simulation preserved | Unit: `round-trip` |

### 2.5 Undo/Redo

| # | Feature | Status | Notes | Tests |
|---|---------|--------|-------|-------|
| 2.5.1 | Undo (Ctrl+Z) | ⚠️ | 14+ command types: Entity, Story, Act, ManeuverGroup, Maneuver, Event, Action, Trigger, Condition, Init, Parameter, Scenario | Unit: `command-history` |
| 2.5.2 | Redo (Ctrl+Y / Ctrl+Shift+Z) | ⚠️ | Full redo stack | Unit: `command-history` |
| 2.5.3 | Command history (max 100) | ⚠️ | All edit operations tracked, UI buttons reactive | Unit: `command-history` |

### 2.6 Templates

> 🚫 **Templates are DISCONTINUED.** The existing implementation (8 use-case templates + 6 action components)
> does not meet design standards and needs a complete redesign.
> Code remains in `packages/templates/`. E2E test `template-apply.spec.ts` exists but is stale.

---

## 3. 3D & Visualization

| # | Feature | Status | Notes | Tests |
|---|---------|--------|-------|-------|
| 3.1 | Grid display | ✅ | Default grid shown | -- |
| 3.2 | 3D/Top view toggle | ✅ | Camera perspective switch | Unit: `viewer-store` |
| 3.3 | Grid toggle | ✅ | Show/hide grid | -- |
| 3.4 | Labels toggle | ✅ | Show/hide entity labels | -- |
| 3.5 | Camera orbit/pan/zoom | ✅ | OrbitControls (middle-button rotate, scroll zoom, right-drag pan) | -- |
| 3.6 | Road 3D rendering | ⚠️ | Road meshes + lane meshes + junctions from .xodr | Unit: `road-mesh-generator`, `junction-surface-builder` |
| 3.7 | Entity 3D rendering | ⚠️ | Vehicle: box+cone. Pedestrian: cylinder. MiscObject: box | Unit: `entity-geometry` |
| 3.8 | Road ID display | ⚠️ | Toggle on toolbar, requires .xodr loaded | -- |
| 3.9 | Lane ID display | ⚠️ | Toggle on toolbar, requires .xodr loaded | Unit: `lane-type-colors` |
| 3.10 | FPS fly controls | ⚠️ | Right-click + WASD/EQ, Shift sprint (3x), speed multiplier 0.1x–5.0x | -- |
| 3.11 | Camera follow | ⚠️ | Smooth third-person track during simulation, entity selector dropdown | -- |
| 3.12 | Gizmo (translate/rotate) | ⚠️ | TransformControls. Translate on XY plane, rotate heading around Z. Store reflection unconfirmed | -- |
| 3.13 | Lane snapping | ⚠️ | OpenDRIVE inverse lookup (world → road/lane), driving direction support | Unit: `position-resolver` |
| 3.14 | Speed multiplier | ⚠️ | Top-right slider 0.1x–5.0x for FPS controls | -- |
| 3.15 | Entity selection in 3D | ⚠️ | Click to select, double-click to focus/center | Unit: `entity-positions` |
| 3.16 | Measurement tools | ❌ | No distance/angle measurement | -- |
| 3.17 | Trajectory visualization | ❌ | Path preview. **Priority upgraded** — needed for scenario authoring UX | -- |

---

## 4. Simulation

### 4.1 WASM esmini Engine

| # | Feature | Status | Notes | Tests |
|---|---------|--------|-------|-------|
| 4.1.1 | WASM batch execution | 🟡 | Worker-based. Some scenarios work, others fail. Safety limits: 100K steps / 120s | -- |
| 4.1.2 | Virtual filesystem mapping | 🟡 | XOSC → /scenarios/, XODR → /scenarios/, catalogs → /catalogs/. Path rewriting | -- |
| 4.1.3 | Simulation frame collection | 🟡 | Position, speed, heading, road/lane info, storyboard events, condition events | -- |
| 4.1.4 | 3D viewer simulation display | 🟡 | SimulationOverlay exists. Store → Viewer wiring may be incomplete | -- |

### 4.2 Timeline & Playback

| # | Feature | Status | Notes | Tests |
|---|---------|--------|-------|-------|
| 4.2.1 | Entity rows | 🟡 | Entity name + type shown in timeline | -- |
| 4.2.2 | Event blocks | 🟡 | Event name + action type as clickable buttons | -- |
| 4.2.3 | Playback controls | ⚠️ | Play/Pause, Skip to start/end, Slider seek, Speed (0.25x–4x), Frame counter | -- |
| 4.2.4 | Time axis scroll | ❌ | No time scrubbing on ruler | -- |
| 4.2.5 | Event drag/resize | ❌ | Events are static display | -- |
| 4.2.6 | Timeline zoom | ❌ | No zoom on time axis | -- |

### 4.3 Server-side Simulation

> 🚫 **Server-side simulation (REST/gRPC) is DISCONTINUED.** WASM esmini is the sole simulation engine.
> Server-side code preserved in `packages/esmini/` (REST/gRPC client) and `apps/server/` (routes)
> for potential future revival with GT_Sim integration.
> E2E tests in `e2e/gt-sim/` are gated behind `USE_GT_SIM` env var.

---

## 5. AI Integration

| # | Feature | Status | Notes | Tests |
|---|---------|--------|-------|-------|
| 5.1 | MCP Server (24 tools) | ⚠️ | Scenario, Entity, Action, Trigger, Init, Storyboard, Template, Undo/Redo tools. stdio transport | Unit: 9 test files in `mcp-server` |
| 5.2 | NL → Scenario generation | ❌ | Natural language to scenario creation (planned) | -- |
| 5.3 | Other AI integrations | ❌ | Exploring additional AI-assisted features | -- |

---

## 6. Validation & Quality

### 6.1 Validation Features

| # | Feature | Status | Notes | Tests |
|---|---------|--------|-------|-------|
| 6.1.1 | Run validation from toolbar | ✅ | Shows error/warning count in status bar | E2E: `validation` |
| 6.1.2 | Validation results tab | ✅ | Right panel > Validation. Error/warning count + messages | E2E: `validation` |
| 6.1.3 | Re-run validation button | ✅ | Refresh button in Validation tab | -- |
| 6.1.4 | Error → element navigation | ❌ | No click-to-navigate from error to element | -- |
| 6.1.5 | Real-time validation | ❌ | Manual trigger only | -- |
| 6.1.6 | XSD schema validation | ❌ | Internal rules only, not full XSD compliance | -- |

### 6.2 Test Coverage Dashboard

| Package | Unit Tests | E2E Tests |
|---------|-----------|-----------|
| `@osce/scenario-engine` | 9 files: entity-operations, storyboard-operations, trigger-operations, init-operations, command-history, defaults, scenario-store, tree-traversal, parameter-commands | -- |
| `@osce/openscenario` | 5 files: xosc-parser, xosc-validator, round-trip, thirdparty-files, parse-catalog | -- |
| `@osce/node-editor` | 8 files: action-display, condition-display, document-to-flow, edge-factory, editor-store, layout, node-factory, compute-time-axis | -- |
| `@osce/3d-viewer` | 5 files: entity-positions, viewer-store, entity-geometry, lane-type-colors, position-resolver | -- |
| `@osce/opendrive` | 10 files: arc, lane-boundary, line, reference-line, spiral, lane-offset, parse-and-mesh, junction-surface-builder, road-mesh-generator, xodr-parser | -- |
| `@osce/mcp-server` | 9 files: action-tools, entity-tools, init-tools, integration, scenario-tools, storyboard-tools, template-tools, trigger-tools, undo-redo-tools | -- |
| `@osce/esmini` | 3 files: ground-truth-converter, gt-sim-rest-client, gt-sim-service | -- |
| `apps/server` | 9 files: file-routes, scenario-routes, simulation-routes, project-routes, file-service, scenario-service, mock-esmini-service, project-service, ws-handler | -- |
| `apps/web` | 1 file: editor-store | 6 specs + 3 GT_Sim specs |

---

## 7. Infrastructure

### 7.1 i18n

| # | Feature | Status | Notes | Tests |
|---|---------|--------|-------|-------|
| 7.1.1 | EN/JA toggle | ✅ | Toolbar toggle, all UI labels switch | E2E: `i18n` |
| 7.1.2 | Language persistence | ⚠️ | localStorage via Zustand `osce-editor-preferences` | -- |
| 7.1.3 | Additional languages | ❌ | Only EN and JA | -- |

### 7.2 Theme — APEX

| # | Feature | Status | Notes | Tests |
|---|---------|--------|-------|-------|
| 7.2.1 | Dark theme | ✅ | Default APEX dark (#0C081D base), 60+ semantic tokens | E2E: `app-startup` |
| 7.2.2 | Glass effects | ✅ | Backdrop blur, glass panels (.glass, .glass-elevated, .glass-active) | -- |
| 7.2.3 | Cursor light | ⚠️ | Global mouse tracking, surface reflection, per-element --local-x/y | -- |
| 7.2.4 | Design tokens | ✅ | Colors, fonts (Orbitron/Exo 2/JetBrains Mono/M PLUS 1p), shadows, animations | -- |

### 7.3 Backend

| # | Feature | Status | Notes | Tests |
|---|---------|--------|-------|-------|
| 7.3.1 | REST API (project/file) | ⚠️ | CRUD endpoints for projects and files, 100MB multipart limit | Unit: `project-routes`, `file-routes` |
| 7.3.2 | WebSocket | ⚠️ | Persistent connection, heartbeat, file ops messaging | Unit: `ws-handler` |
| 7.3.3 | Notifications system | ✅ | Toast notification area (alt+T) | -- |

### 7.4 Accessibility & UX

| # | Feature | Status | Notes | Tests |
|---|---------|--------|-------|-------|
| 7.4.1 | Keyboard shortcuts | 🟡 | Ctrl+O, Ctrl+S, Ctrl+Z, Ctrl+Y, Delete/Backspace. Focus guard on inputs | -- |
| 7.4.2 | Responsive panels | ✅ | react-resizable-panels, min/max constraints, collapsible file tree | -- |
| 7.4.3 | ARIA roles | 🟡 | 97 matches across 33 files. Status bar, language toggle, modals. No screen reader testing | -- |
| 7.4.4 | Status bar | ✅ | Sim status dot (color-coded), entity/story count, validation, filename + dirty, version (v1.2) | -- |

---

## Appendix A: OpenSCENARIO v1.2 XSD Spec Coverage Map

> Generated: 2026-03-04 | XSD Source: `Thirdparty/openscenario-v1.2.0/Schema/OpenSCENARIO.xsd`
> Parser: `packages/openscenario/src/parser/` | Serializer: `packages/openscenario/src/serializer/`
> Types: `packages/shared/src/types/`
> Status legend: ✅ Full | ⚠️ Partial | ❌ None

### Coverage Summary

| Category | Total | ✅ Parsed | ⚠️ Partial | ❌ Not Parsed |
|---|---|---|---|---|
| Document Structure | 5 | 5 | 0 | 0 |
| Entity / Object Types | 10 | 8 | 0 | 2 |
| Storyboard Structure | 10 | 10 | 0 | 0 |
| Private Actions -- Longitudinal | 6 | 6 | 0 | 0 |
| Private Actions -- Lateral | 8 | 8 | 0 | 0 |
| Private Actions -- Controller | 7 | 7 | 0 | 0 |
| Private Actions -- Routing | 6 | 6 | 0 | 0 |
| Private Actions -- Appearance | 8 | 7 | 1 | 0 |
| Private Actions -- Other | 5 | 5 | 0 | 0 |
| Global Actions | 14 | 8 | 2 | 4 |
| Entity Conditions (ByEntity) | 16 | 16 | 0 | 0 |
| Value Conditions (ByValue) | 8 | 7 | 0 | 1 |
| Trigger Structure | 4 | 4 | 0 | 0 |
| Position Types | 10 | 9 | 0 | 1 |
| Parameter / Variable | 8 | 8 | 0 | 0 |
| Catalog System | 11 | 9 | 0 | 2 |
| Road Network | 6 | 4 | 0 | 2 |
| Environment / Weather | 8 | 8 | 0 | 0 |
| Dynamics / Supporting | 8 | 8 | 0 | 0 |
| Distribution / Stochastic | 14 | 0 | 0 | 14 |
| **TOTAL** | **172** | **143** | **3** | **26** |

**Overall: ~83% fully covered, ~85% including partial.**

---

### A.1 Document Structure (Top-Level)

| XSD Element/Type | Category | Parser | Serializer | Notes |
|---|---|---|---|---|
| OpenScenario | Document | ✅ | ✅ | Root element `<OpenSCENARIO>` |
| FileHeader | Document | ✅ | ✅ | revMajor, revMinor, date, description, author. `License` child element not parsed. |
| ParameterDeclarations | Document | ✅ | ✅ | With ConstraintGroup / ValueConstraint support |
| VariableDeclarations | Document | ✅ | ✅ | v1.2 addition; variableType, name, value |
| ScenarioDefinition (group) | Document | ✅ | ✅ | All children: ParameterDeclarations, VariableDeclarations, CatalogLocations, RoadNetwork, Entities, Storyboard |

### A.2 Entity / Object Types

| XSD Element/Type | Category | Parser | Serializer | Notes |
|---|---|---|---|---|
| Entities | Entity | ✅ | ✅ | Container for ScenarioObject elements |
| ScenarioObject | Entity | ✅ | ✅ | Vehicle, Pedestrian, MiscObject, CatalogReference + ObjectController |
| Vehicle | Entity | ✅ | ✅ | name, vehicleCategory, mass, role, model3d, Performance, BoundingBox, Axles, Properties, ParameterDeclarations |
| Pedestrian | Entity | ✅ | ✅ | name, pedestrianCategory, mass, model, model3d, BoundingBox, Properties |
| MiscObject | Entity | ✅ | ✅ | name, miscObjectCategory, mass, model3d, BoundingBox, Properties |
| BoundingBox / Center / Dimensions | Entity | ✅ | ✅ | Full coverage of all attributes |
| Performance | Entity | ✅ | ✅ | maxSpeed, maxAcceleration, maxDeceleration, mass |
| Axles / Axle | Entity | ✅ | ✅ | FrontAxle, RearAxle, AdditionalAxle |
| ExternalObjectReference | Entity | ❌ | ❌ | Allowed by XSD in EntityObject group; not implemented |
| EntitySelection / SelectedEntities | Entity | ❌ | ❌ | Entity selection by type or name; not implemented |

### A.3 Storyboard Structure

| XSD Element/Type | Category | Parser | Serializer | Notes |
|---|---|---|---|---|
| Storyboard | Storyboard | ✅ | ✅ | Init + Story[] + StopTrigger |
| Init / InitActions | Storyboard | ✅ | ✅ | GlobalAction[] + Private[] (entityRef + PrivateAction[]) |
| Story | Storyboard | ✅ | ✅ | name + ParameterDeclarations + Act[] |
| Act | Storyboard | ✅ | ✅ | name + ManeuverGroup[] + StartTrigger + optional StopTrigger |
| ManeuverGroup | Storyboard | ✅ | ✅ | name, maximumExecutionCount, Actors, Maneuver[] |
| Actors | Storyboard | ✅ | ✅ | selectTriggeringEntities + EntityRef[] |
| Maneuver | Storyboard | ✅ | ✅ | name + ParameterDeclarations + Event[] |
| Event | Storyboard | ✅ | ✅ | name, priority, maximumExecutionCount, Action[], StartTrigger |
| Action | Storyboard | ✅ | ✅ | Dispatches PrivateAction / GlobalAction / UserDefinedAction |
| Private (Init wrapper) | Storyboard | ✅ | ✅ | entityRef + PrivateAction[] for init actions |

### A.4 Private Actions -- Longitudinal

| XSD Element/Type | Category | Parser | Serializer | Notes |
|---|---|---|---|---|
| LongitudinalAction | Action | ✅ | ✅ | Wrapper dispatching SpeedAction, SpeedProfileAction, LongitudinalDistanceAction |
| SpeedAction | Action | ✅ | ✅ | SpeedActionDynamics (TransitionDynamics) + SpeedActionTarget |
| AbsoluteTargetSpeed / RelativeTargetSpeed | Action | ✅ | ✅ | Both target variants; relative includes entityRef, speedTargetValueType, continuous |
| SpeedProfileAction | Action | ✅ | ✅ | entityRef, followingMode, dynamicsDimension, SpeedProfileEntry[] |
| LongitudinalDistanceAction | Action | ✅ | ✅ | entityRef, distance, timeGap, freespace, continuous, coordinateSystem, displacement, DynamicConstraints |
| AbsoluteSpeed / FinalSpeed | Action | ✅ | ✅ | Used in SynchronizeAction; AbsoluteSpeed + RelativeSpeedToMaster with steadyState |

### A.5 Private Actions -- Lateral

| XSD Element/Type | Category | Parser | Serializer | Notes |
|---|---|---|---|---|
| LateralAction | Action | ✅ | ✅ | Wrapper dispatching LaneChangeAction, LaneOffsetAction, LateralDistanceAction |
| LaneChangeAction | Action | ✅ | ✅ | LaneChangeActionDynamics + LaneChangeTarget + targetLaneOffset |
| LaneChangeTarget | Action | ✅ | ✅ | AbsoluteTargetLane / RelativeTargetLane |
| AbsoluteTargetLane / RelativeTargetLane | Action | ✅ | ✅ | value; relative adds entityRef |
| LaneOffsetAction | Action | ✅ | ✅ | continuous + LaneOffsetActionDynamics + LaneOffsetTarget |
| LaneOffsetActionDynamics | Action | ✅ | ✅ | maxSpeed, maxLateralAcc, dynamicsShape |
| AbsoluteTargetLaneOffset / RelativeTargetLaneOffset | Action | ✅ | ✅ | value; relative adds entityRef |
| LateralDistanceAction | Action | ✅ | ✅ | entityRef, distance, freespace, continuous, coordinateSystem, displacement, DynamicConstraints |

### A.6 Private Actions -- Controller

| XSD Element/Type | Category | Parser | Serializer | Notes |
|---|---|---|---|---|
| ControllerAction | Action | ✅ | ✅ | Wrapper dispatching AssignController, ActivateController, OverrideControllerValue |
| AssignControllerAction | Action | ✅ | ✅ | Controller or CatalogReference + activateLateral/Longitudinal/Animation/Lighting flags |
| ActivateControllerAction | Action | ✅ | ✅ | lateral, longitudinal, animation, lighting, controllerRef |
| OverrideControllerValueAction | Action | ✅ | ✅ | Throttle, Brake, Clutch, ParkingBrake, SteeringWheel, Gear |
| OverrideThrottleAction / OverrideBrakeAction / etc. | Action | ✅ | ✅ | Each sub-element: value + active + maxRate |
| OverrideGearAction | Action | ✅ | ✅ | number + active (ManualGear/AutomaticGear detail flattened) |
| Controller | Action | ✅ | ✅ | name + Properties within AssignControllerAction |

### A.7 Private Actions -- Routing

| XSD Element/Type | Category | Parser | Serializer | Notes |
|---|---|---|---|---|
| RoutingAction | Action | ✅ | ✅ | Wrapper: AssignRouteAction, FollowTrajectoryAction, AcquirePositionAction |
| AssignRouteAction | Action | ✅ | ✅ | Route with Waypoint[]; CatalogReference route ref partially handled |
| FollowTrajectoryAction | Action | ✅ | ✅ | Trajectory (Polyline/Clothoid/Nurbs) + TimeReference + TrajectoryFollowingMode + initialDistanceOffset |
| AcquirePositionAction | Action | ✅ | ✅ | Position |
| Trajectory (Shape: Polyline/Clothoid/Nurbs) | Action | ✅ | ✅ | All 3 shape types with vertices, control points, knots |
| TimeReference (None / Timing) | Action | ✅ | ✅ | Both None and Timing (domainAbsoluteRelative, offset, scale) |

### A.8 Private Actions -- Appearance / Animation / Visibility

| XSD Element/Type | Category | Parser | Serializer | Notes |
|---|---|---|---|---|
| VisibilityAction | Action | ✅ | ✅ | graphics, traffic, sensors, entityRef |
| AppearanceAction | Action | ⚠️ | ⚠️ | XSD defines as wrapper for LightStateAction + AnimationAction; parser treats as generic pass-through. Individual LightStateAction/AnimationAction handled as direct PrivateAction children instead. |
| AnimationAction | Action | ✅ | ✅ | AnimationType (VehicleComponent/Pedestrian/File/UserDefined), state, duration, loop |
| AnimationType | Action | ✅ | ✅ | Dispatches VehicleComponentAnimation, PedestrianAnimation, AnimationFile, UserDefinedAnimation |
| LightStateAction | Action | ✅ | ✅ | LightType + LightState (mode, intensity, Color RGB) + transitionTime |
| LightType / VehicleLight / UserDefinedLight | Action | ✅ | ✅ | VehicleLightType and UserDefinedLightType parsed |
| ConnectTrailerAction | Action | ✅ | ✅ | trailerRef (via TrailerAction wrapper or direct) |
| DisconnectTrailerAction | Action | ✅ | ✅ | Empty element |

### A.9 Private Actions -- Other

| XSD Element/Type | Category | Parser | Serializer | Notes |
|---|---|---|---|---|
| TeleportAction | Action | ✅ | ✅ | Position (all position types supported) |
| SynchronizeAction | Action | ✅ | ✅ | masterEntityRef, TargetPositionMaster, TargetPosition, FinalSpeed, tolerances |
| UserDefinedAction | Action | ✅ | ✅ | CustomCommandAction type string |
| CustomCommandAction | Action | ✅ | ✅ | type attribute captured |
| ObjectController | Action | ✅ | ✅ | Controller or CatalogReference |

### A.10 Global Actions

| XSD Element/Type | Category | Parser | Serializer | Notes |
|---|---|---|---|---|
| GlobalAction | Action | ✅ | ✅ | All 6 sub-types dispatched |
| EnvironmentAction | Action | ✅ | ✅ | Full Environment with TimeOfDay, Weather, RoadCondition |
| EntityAction | Action | ✅ | ✅ | AddEntityAction (with Position) and DeleteEntityAction |
| ParameterAction | Action | ✅ | ✅ | SetAction + ModifyAction (AddValue / MultiplyByValue) |
| VariableAction | Action | ✅ | ✅ | SetAction + ModifyAction (AddValue / MultiplyByValue) |
| InfrastructureAction | Action | ✅ | ✅ | TrafficSignalAction wrapper |
| TrafficSignalAction | Action | ✅ | ✅ | TrafficSignalControllerAction + TrafficSignalStateAction |
| TrafficAction | Action | ⚠️ | ⚠️ | Generic pass-through `[key: string]: unknown`; no typed sub-models |
| TrafficSourceAction | Action | ❌ | ❌ | Stored as raw key-value only; no typed model |
| TrafficSinkAction | Action | ❌ | ❌ | Stored as raw key-value only; no typed model |
| TrafficSwarmAction | Action | ⚠️ | ⚠️ | Stored as raw key-value; no typed fields |
| TrafficStopAction | Action | ❌ | ❌ | Stored as raw key-value only; no typed model |
| TrafficDefinition | Action | ❌ | ❌ | Used by TrafficSourceAction/SinkAction; no typed model |
| TrafficSignalGroupState | Action | ❌ | ❌ | Advanced traffic signal feature |

### A.11 Entity Conditions (ByEntityCondition)

| XSD Element/Type | Category | Parser | Serializer | Notes |
|---|---|---|---|---|
| ByEntityCondition | Condition | ✅ | ✅ | TriggeringEntities + EntityCondition |
| TriggeringEntities | Condition | ✅ | ✅ | triggeringEntitiesRule (any/all) + EntityRef[] |
| DistanceCondition | Condition | ✅ | ✅ | value, freespace, coordinateSystem, relativeDistanceType, rule, Position |
| RelativeDistanceCondition | Condition | ✅ | ✅ | entityRef, relativeDistanceType, value, freespace, rule |
| TimeHeadwayCondition | Condition | ✅ | ✅ | entityRef, value, freespace, rule, coordinateSystem, alongRoute |
| TimeToCollisionCondition | Condition | ✅ | ✅ | value, freespace, rule, coordinateSystem, relativeDistanceType, target (Entity or Position) |
| TimeToCollisionConditionTarget | Condition | ✅ | ✅ | EntityRef or Position |
| AccelerationCondition | Condition | ✅ | ✅ | value, rule, direction |
| SpeedCondition | Condition | ✅ | ✅ | value, rule, direction |
| RelativeSpeedCondition | Condition | ✅ | ✅ | entityRef, value, rule, direction |
| ReachPositionCondition | Condition | ✅ | ✅ | tolerance + Position (deprecated in XSD but still supported) |
| StandStillCondition | Condition | ✅ | ✅ | duration |
| TraveledDistanceCondition | Condition | ✅ | ✅ | value |
| EndOfRoadCondition | Condition | ✅ | ✅ | duration |
| CollisionCondition | Condition | ✅ | ✅ | EntityRef or ByType (objectType) target |
| OffroadCondition | Condition | ✅ | ✅ | duration |
| RelativeClearanceCondition | Condition | ✅ | ✅ | distanceForward/Backward, freeSpace, oppositeLanes, EntityRef[], RelativeLaneRange[] |

### A.12 Value Conditions (ByValueCondition)

| XSD Element/Type | Category | Parser | Serializer | Notes |
|---|---|---|---|---|
| ByValueCondition | Condition | ✅ | ✅ | Dispatches to all sub-types |
| SimulationTimeCondition | Condition | ✅ | ✅ | value + rule |
| StoryboardElementStateCondition | Condition | ✅ | ✅ | storyboardElementRef, storyboardElementType, state |
| ParameterCondition | Condition | ✅ | ✅ | parameterRef, value, rule |
| VariableCondition | Condition | ✅ | ✅ | variableRef, value, rule |
| TrafficSignalCondition | Condition | ✅ | ✅ | name + state |
| TrafficSignalControllerCondition | Condition | ✅ | ✅ | trafficSignalControllerRef + phase |
| UserDefinedValueCondition | Condition | ✅ | ✅ | name, value, rule |
| TimeOfDayCondition | Condition | ❌ | ❌ | XSD defines rule + dateTime; not in parser/serializer dispatch |

### A.13 Trigger Structure

| XSD Element/Type | Category | Parser | Serializer | Notes |
|---|---|---|---|---|
| Trigger (StartTrigger / StopTrigger) | Trigger | ✅ | ✅ | ConditionGroup[] |
| ConditionGroup | Trigger | ✅ | ✅ | Condition[] (AND logic within group, OR across groups) |
| Condition | Trigger | ✅ | ✅ | name, delay, conditionEdge + ByEntityCondition or ByValueCondition |
| ConditionEdge | Trigger | ✅ | ✅ | rising, falling, none, risingOrFalling |

### A.14 Position Types

| XSD Element/Type | Category | Parser | Serializer | Notes |
|---|---|---|---|---|
| Position | Position | ✅ | ✅ | Dispatches to all sub-types |
| WorldPosition | Position | ✅ | ✅ | x, y, z, h, p, r |
| LanePosition | Position | ✅ | ✅ | roadId, laneId, s, offset, Orientation |
| RelativeLanePosition | Position | ✅ | ✅ | entityRef, dLane, ds, dsLane, offset, Orientation |
| RoadPosition | Position | ✅ | ✅ | roadId, s, t, Orientation |
| RelativeRoadPosition | Position | ✅ | ✅ | entityRef, ds, dt, Orientation |
| RelativeObjectPosition | Position | ✅ | ✅ | entityRef, dx, dy, dz, Orientation |
| RelativeWorldPosition | Position | ✅ | ✅ | entityRef, dx, dy, dz, Orientation |
| RoutePosition | Position | ✅ | ✅ | RouteRef + InRoutePosition (PositionInRoadCoordinates, PositionInLaneCoordinates, FromCurrentEntity, PositionOfCurrentEntity) |
| GeoPosition | Position | ✅ | ✅ | latitude, longitude, altitude, Orientation |
| TrajectoryPosition | Position | ❌ | ❌ | Falls back to default WorldPosition(0,0); no typed model |

### A.15 Parameter / Variable System

| XSD Element/Type | Category | Parser | Serializer | Notes |
|---|---|---|---|---|
| ParameterDeclaration | Parameter | ✅ | ✅ | name, parameterType, value, ConstraintGroup[] |
| ParameterDeclarations | Parameter | ✅ | ✅ | Array container |
| ValueConstraint | Parameter | ✅ | ✅ | rule + value |
| ValueConstraintGroup | Parameter | ✅ | ✅ | ValueConstraint[] |
| ParameterAssignment | Parameter | ✅ | ✅ | Used in CatalogReference; parameterRef + value |
| ParameterAssignments | Parameter | ✅ | ✅ | Array container |
| VariableDeclaration | Parameter | ✅ | ✅ | name, variableType, value |
| VariableDeclarations | Parameter | ✅ | ✅ | Array container |

### A.16 Catalog System

| XSD Element/Type | Category | Parser | Serializer | Notes |
|---|---|---|---|---|
| CatalogLocations | Catalog | ✅ | ✅ | All 8 catalog location types mapped |
| VehicleCatalogLocation | Catalog | ✅ | ✅ | Directory path |
| ControllerCatalogLocation | Catalog | ✅ | ✅ | Directory path |
| PedestrianCatalogLocation | Catalog | ✅ | ✅ | Directory path |
| MiscObjectCatalogLocation | Catalog | ✅ | ✅ | Directory path |
| EnvironmentCatalogLocation | Catalog | ✅ | ✅ | Directory path |
| ManeuverCatalogLocation | Catalog | ✅ | ✅ | Directory path |
| TrajectoryCatalogLocation | Catalog | ✅ | ✅ | Directory path |
| RouteCatalogLocation | Catalog | ✅ | ✅ | Directory path |
| CatalogReference | Catalog | ✅ | ✅ | catalogName, entryName, ParameterAssignments |
| Catalog (definition file) | Catalog | ❌ | ❌ | No parsing of standalone catalog XML files; only references |
| CatalogDefinition (group) | Catalog | ❌ | ❌ | For standalone catalog XML files |

### A.17 Road Network

| XSD Element/Type | Category | Parser | Serializer | Notes |
|---|---|---|---|---|
| RoadNetwork | RoadNetwork | ✅ | ✅ | LogicFile, SceneGraphFile, TrafficSignalController[] |
| LogicFile / SceneGraphFile | RoadNetwork | ✅ | ✅ | filepath attribute |
| TrafficSignalController | RoadNetwork | ✅ | ✅ | name, delay, reference, Phase[] |
| Phase / TrafficSignalState | RoadNetwork | ✅ | ✅ | name, duration, TrafficSignalState (trafficSignalId, state) |
| TrafficSignals (wrapper element) | RoadNetwork | ❌ | ❌ | XSD defines a TrafficSignals wrapper; parser reads controllers directly from RoadNetwork |
| UsedArea | RoadNetwork | ❌ | ❌ | Optional geographic boundary element |

### A.18 Environment / Weather

| XSD Element/Type | Category | Parser | Serializer | Notes |
|---|---|---|---|---|
| Environment | Environment | ✅ | ✅ | name, TimeOfDay, Weather, RoadCondition |
| TimeOfDay | Environment | ✅ | ✅ | animation + dateTime |
| Weather | Environment | ✅ | ✅ | fractionalCloudCover, atmosphericPressure, temperature |
| Sun | Environment | ✅ | ✅ | intensity, azimuth, elevation |
| Fog | Environment | ✅ | ✅ | visualRange + optional BoundingBox (Center, Dimensions) |
| Precipitation | Environment | ✅ | ✅ | precipitationType, precipitationIntensity |
| Wind | Environment | ✅ | ✅ | direction, speed |
| RoadCondition | Environment | ✅ | ✅ | frictionScaleFactor, wetness |

### A.19 Dynamics / Supporting Types

| XSD Element/Type | Category | Parser | Serializer | Notes |
|---|---|---|---|---|
| TransitionDynamics | Dynamics | ✅ | ✅ | dynamicsShape, dynamicsDimension, value |
| DynamicConstraints | Dynamics | ✅ | ✅ | maxAcceleration, maxDeceleration, maxSpeed |
| Orientation | Dynamics | ✅ | ✅ | type (relative/absolute), h, p, r |
| Route | Dynamics | ✅ | ✅ | name, closed, Waypoint[] |
| Waypoint | Dynamics | ✅ | ✅ | Position + routeStrategy |
| InRoutePosition | Dynamics | ✅ | ✅ | FromCurrentEntity, PositionOfCurrentEntity, PositionInRoadCoordinates, PositionInLaneCoordinates |
| Shape (Polyline / Clothoid / Nurbs) | Dynamics | ✅ | ✅ | All 3 trajectory shapes with full sub-elements |
| Property | Dynamics | ✅ | ✅ | name + value |

### A.20 Distribution / Stochastic (NOT IMPLEMENTED)

> Future consideration. Not planned for initial release. Enables automated test variation
> by applying statistical distributions to scenario parameters.

| XSD Element/Type | Category | Parser | Serializer | Notes |
|---|---|---|---|---|
| Deterministic | Distribution | ❌ | ❌ | Deterministic parameter variation for test automation |
| DeterministicMultiParameterDistribution | Distribution | ❌ | ❌ | Multi-parameter sweep |
| DeterministicSingleParameterDistribution | Distribution | ❌ | ❌ | Single-parameter sweep |
| DistributionRange / DistributionSet | Distribution | ❌ | ❌ | Range and set-based distributions |
| Stochastic | Distribution | ❌ | ❌ | Stochastic simulation parameters |
| StochasticDistribution | Distribution | ❌ | ❌ | Distribution wrapper |
| NormalDistribution | Distribution | ❌ | ❌ | Gaussian distribution |
| UniformDistribution | Distribution | ❌ | ❌ | Uniform distribution |
| PoissonDistribution | Distribution | ❌ | ❌ | Poisson distribution |
| Histogram / HistogramBin | Distribution | ❌ | ❌ | Histogram-based distribution |
| ProbabilityDistributionSet | Distribution | ❌ | ❌ | Weighted probability set |
| ParameterValueDistribution | Distribution | ❌ | ❌ | Parameter value distribution wrapper |
| ValueSetDistribution | Distribution | ❌ | ❌ | Discrete value set |
| UserDefinedDistribution | Distribution | ❌ | ❌ | Custom distribution type |

### Notable Gaps and Observations

**Well-Covered Areas:**
- All 14 EntityCondition sub-types are fully parsed and serialized (100%).
- 7 of 8 ByValueCondition sub-types are implemented (88%). Only TimeOfDayCondition missing.
- 9 of 10 Position types are covered (90%). Only TrajectoryPosition missing (graceful fallback).
- Full Storyboard hierarchy with proper trigger support (100%).
- 18 of 19 PrivateAction sub-types are fully handled (95%).
- Complete entity model for Vehicle, Pedestrian, MiscObject with all child elements.
- All 8 catalog location types supported.

**Partial Implementations:**
- **TrafficAction** is captured as generic `[key: string]: unknown` -- preserves data on round-trip but sub-actions (Source, Sink, Swarm, Stop) have no typed models.
- **AppearanceAction** XSD wrapper structure is flattened; LightStateAction and AnimationAction are parsed as direct PrivateAction children instead.

**Not Implemented:**
- **Distribution/Stochastic** (14 types): Entire parameter distribution subsystem for automated test variation. Future consideration.
- **TrajectoryPosition**: The only position type without a typed model.
- **TimeOfDayCondition**: The only ByValueCondition variant not dispatched.
- **Catalog definition files**: Only CatalogLocations and CatalogReference handled; no standalone catalog XML parsing.
- **ExternalObjectReference**, **EntitySelection**, **DomeImage**, **SensorReference/SensorReferenceSet**, **Color/ColorCmyk** (detailed color model), **License** (FileHeader child), **UsedArea**.
