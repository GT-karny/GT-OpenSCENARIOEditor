# Feature Catalog — OpenSCENARIO Editor

> Generated: 2026-02-28 | Method: App inspection + code review
> Status legend: ✅ Working | ⚠️ Partial | 🔲 UI Only | ❌ Not Started

## 1. File Operations

| # | Feature | Status | UI Area | Notes |
|---|---------|--------|---------|-------|
| 1.1 | New scenario | ✅ | File > New | Resets store to empty scenario |
| 1.2 | Open .xosc file | ✅ | File > Open (Ctrl+O) | File System Access API, XoscParser |
| 1.3 | Save .xosc file | ✅ | File > Save (Ctrl+S) | XoscSerializer, save dialog |
| 1.4 | Open .xodr file | ✅ | Toolbar .xodr button | XodrParser, loads road network |
| 1.5 | Undo | 🔲 | Toolbar | Enabled only after template apply; disabled for normal edits |
| 1.6 | Redo | 🔲 | Toolbar | Always disabled |
| 1.7 | Export as other format | ❌ | — | No export to JSON, PDF, image, etc. |
| 1.8 | Recent files | ❌ | — | No recent file history |
| 1.9 | Drag & drop file open | ❌ | — | Not implemented |

## 2. Entity Management

| # | Feature | Status | UI Area | Notes |
|---|---------|--------|---------|-------|
| 2.1 | Entity list display | ✅ | Left panel > Entities | Name, type, category shown |
| 2.2 | Add entity (dialog) | ✅ | + button → dialog | Name + Type (Vehicle) input |
| 2.3 | Delete entity | ✅ | Delete button per entity | Button exists per entity |
| 2.4 | Select entity → show properties | ✅ | Left panel → Right panel | Bidirectional sync |
| 2.5 | Select entity → highlight node | ✅ | Left panel → Node editor | Node gets selected border |
| 2.6 | Entity type: Pedestrian | ⚠️ | Add dialog | Dropdown may support it but untested |
| 2.7 | Entity type: MiscObject | ❌ | — | Not in add dialog |
| 2.8 | Entity inline rename | ❌ | — | Must use Properties panel |
| 2.9 | Entity duplicate | ❌ | — | No duplicate action |
| 2.10 | Entity reorder | ❌ | — | No drag reorder |

## 3. Templates

| # | Feature | Status | UI Area | Notes |
|---|---------|--------|---------|-------|
| 3.1 | Template list (8 templates) | ✅ | Left panel > Templates | Highway(5), Pedestrian(1), General(2) |
| 3.2 | Category accordion | ✅ | Templates panel | Expand/collapse per category |
| 3.3 | Template config dialog | ✅ | Modal dialog | Sliders, dropdowns, numeric inputs |
| 3.4 | Apply template | ✅ | Apply button | Appends to current scenario (additive) |
| 3.5 | Template preview | ❌ | — | No preview before applying |
| 3.6 | Custom template creation | ❌ | — | Cannot save current scenario as template |
| 3.7 | Template import/export | ❌ | — | Templates are hardcoded |

### Template Inventory

| Category | Template | Parameters |
|----------|----------|------------|
| Highway | Cut-In | Ego Speed, Cut-In Vehicle Speed, Trigger Distance, Lane Change Distance, Lane Change Shape, Cut-In Side, Ego Lane, Ego Start Position, Cut-In Start Offset |
| Highway | Overtaking | (untested) |
| Highway | Emergency Brake | (untested) |
| Highway | Follow Lead Vehicle | (untested) |
| Highway | Highway Merge | (untested) |
| Pedestrian | Pedestrian Crossing | (untested) |
| General | Lane Change | (untested) |
| General | Deceleration to Stop | (untested) |

## 4. Node Editor (Storyboard Visualization)

| # | Feature | Status | UI Area | Notes |
|---|---------|--------|---------|-------|
| 4.1 | Storyboard tree visualization | ✅ | Center panel | Storyboard→Story→Act→ManeuverGroup→Maneuver→Event→Action |
| 4.2 | Entity nodes | ✅ | Center panel | Vehicle name, type, category |
| 4.3 | Init node | ✅ | Center panel | Shows Teleport, Speed actions |
| 4.4 | Trigger/Condition nodes | ✅ | Center panel | SimulationTime, RelativeDistance, etc. |
| 4.5 | Edge connections | ✅ | Center panel | Parent-child relationships visualized |
| 4.6 | Node selection | ✅ | Click | Selected border, Properties sync |
| 4.7 | Zoom In/Out | ✅ | Control panel buttons | |
| 4.8 | Fit View | ✅ | Control panel button | Centers all nodes |
| 4.9 | Mini Map | ✅ | Bottom-right | Overview of node layout |
| 4.10 | Toggle Interactivity | ✅ | Control panel button | |
| 4.11 | Node drag/move | ⚠️ | — | ReactFlow supports it, untested |
| 4.12 | Add node (from UI) | ❌ | — | No context menu or drag-to-add |
| 4.13 | Delete node (from UI) | ❌ | — | No delete action on nodes |
| 4.14 | Connect nodes (draw edge) | ❌ | — | No manual edge creation |
| 4.15 | Node search/filter | ❌ | — | No search in node editor |
| 4.16 | Node theming (APEX) | ❌ | — | Nodes use default style, not APEX theme |
| 4.17 | Collapse/expand sub-trees | ❌ | — | All nodes always expanded |

## 5. 3D Viewer

| # | Feature | Status | UI Area | Notes |
|---|---------|--------|---------|-------|
| 5.1 | Grid display | ✅ | Bottom panel | Default grid shown |
| 5.2 | 3D/Top view toggle | ✅ | Button bar | Camera perspective switch |
| 5.3 | Grid toggle | ✅ | Button bar | Show/hide grid |
| 5.4 | Labels toggle | ✅ | Button bar | Show/hide labels |
| 5.5 | RoadID display | ⚠️ | Button bar | Requires .xodr loaded |
| 5.6 | LaneID display | ⚠️ | Button bar | Requires .xodr loaded |
| 5.7 | Road 3D rendering | ⚠️ | — | Requires .xodr; untested in this session |
| 5.8 | Vehicle 3D rendering | ⚠️ | — | Entity positions need Init data |
| 5.9 | Camera orbit/pan/zoom | ⚠️ | Mouse interaction | Three.js OrbitControls expected |
| 5.10 | Entity selection in 3D | ❌ | — | No click-to-select in 3D view |
| 5.11 | Measurement tools | ❌ | — | No distance/angle measurement |
| 5.12 | Trajectory visualization | ❌ | — | No path preview |

## 6. Timeline

| # | Feature | Status | UI Area | Notes |
|---|---------|--------|---------|-------|
| 6.1 | Entity rows | ⚠️ | Bottom center | Entity name + type shown |
| 6.2 | Event blocks | ⚠️ | Bottom center | Event name + action type as clickable buttons |
| 6.3 | Time axis scroll | ❌ | — | No time scrubbing |
| 6.4 | Playback controls | ❌ | — | Requires simulation backend |
| 6.5 | Event drag/resize | ❌ | — | Events are static display |
| 6.6 | Timeline zoom | ❌ | — | No zoom on time axis |

## 7. Properties Panel

| # | Feature | Status | UI Area | Notes |
|---|---------|--------|---------|-------|
| 7.1 | Entity properties display | ✅ | Right panel > Properties | Name, Type, Category, Max Speed |
| 7.2 | Text input editing | ✅ | Right panel | Editable textboxes |
| 7.3 | Other node type properties | ⚠️ | Right panel | Untested for Story, Event, etc. |
| 7.4 | Dropdown/select editors | ❌ | — | No enum-based dropdowns for properties |
| 7.5 | Position editor (XYZ) | ❌ | — | No specialized position input |
| 7.6 | Nested property expansion | ❌ | — | Flat property display only |

## 8. Validation

| # | Feature | Status | UI Area | Notes |
|---|---------|--------|---------|-------|
| 8.1 | Run validation from toolbar | ✅ | Toolbar Validate | Shows error/warning count in status bar |
| 8.2 | Validation results tab | ✅ | Right panel > Validation | Error/warning count + messages |
| 8.3 | Re-run validation button | ✅ | Validation tab | Refresh button |
| 8.4 | Click error → navigate to element | ❌ | — | No navigation from error to element |
| 8.5 | Real-time validation | ❌ | — | Manual trigger only |
| 8.6 | XSD schema validation | ❌ | — | Internal rules only, not full XSD |

## 9. Internationalization (i18n)

| # | Feature | Status | UI Area | Notes |
|---|---------|--------|---------|-------|
| 9.1 | EN/JA toggle | ✅ | Toolbar | All UI labels switch |
| 9.2 | Persist language preference | ❌ | — | Resets on reload |
| 9.3 | Additional languages | ❌ | — | Only EN and JA |

## 10. Status Bar

| # | Feature | Status | UI Area | Notes |
|---|---------|--------|---------|-------|
| 10.1 | Connection status | ✅ | Left | Disconnected / Connected |
| 10.2 | Entity count | ✅ | Left | Real-time update |
| 10.3 | Story count | ✅ | Left | Real-time update |
| 10.4 | Validation result | ✅ | Left | Shown after Validate |
| 10.5 | File name + dirty state | ✅ | Right | `*` for unsaved changes |
| 10.6 | OpenSCENARIO version | ✅ | Right | v1.2 (fixed) |

## 11. Backend / Simulation

| # | Feature | Status | UI Area | Notes |
|---|---------|--------|---------|-------|
| 11.1 | WebSocket connection | 🔲 | Status bar | Backend not started in this session |
| 11.2 | Run Simulation | 🔲 | Toolbar | Enabled only when connected |
| 11.3 | GT_Sim integration | 🔲 | — | Via backend, GT_SIM_URL env var |
| 11.4 | Simulation playback | ❌ | Timeline | No playback visualization |
| 11.5 | OSI streaming (gRPC) | ❌ | — | Proto definitions exist, implementation status unknown |

## 12. Developer / Infrastructure

| # | Feature | Status | UI Area | Notes |
|---|---------|--------|---------|-------|
| 12.1 | Keyboard shortcuts | ⚠️ | — | Ctrl+O, Ctrl+S only |
| 12.2 | Notifications system | ✅ | Notification area (alt+T) | Toast notification region exists |
| 12.3 | Responsive layout | ⚠️ | — | Resizable panels via separators |
| 12.4 | Dark theme (APEX) | ✅ | — | Default dark theme |
| 12.5 | MCP server (AI integration) | 🔲 | — | Package exists, runtime untested |
| 12.6 | Accessibility (a11y) | ⚠️ | — | ARIA roles added to 8 components |

---

## Summary

| Category | ✅ Working | ⚠️ Partial | 🔲 UI Only | ❌ Not Started |
|----------|-----------|------------|-----------|---------------|
| File Operations | 4 | 0 | 2 | 3 |
| Entity Management | 5 | 1 | 0 | 4 |
| Templates | 4 | 0 | 0 | 3 |
| Node Editor | 10 | 1 | 0 | 6 |
| 3D Viewer | 4 | 5 | 0 | 3 |
| Timeline | 0 | 2 | 0 | 4 |
| Properties | 2 | 1 | 0 | 3 |
| Validation | 3 | 0 | 0 | 3 |
| i18n | 1 | 0 | 0 | 2 |
| Status Bar | 6 | 0 | 0 | 0 |
| Backend/Sim | 0 | 0 | 3 | 2 |
| Dev/Infra | 1 | 3 | 1 | 1 |
| **Total** | **40** | **13** | **6** | **34** |

---

## Priority Roadmap (Not-Started Features)

> Goal: Demo-ready in 3 months | Target: OSS public release
> Compete with: IPG CarMaker, MathWorks RoadRunner (more modern UI, AI-integrated, open)

### Tier 1: Demo Must-Have

These features are required to demonstrate the editor as a functional tool.

| # | Feature | Reason |
|---|---------|--------|
| 4.12 | Add node from UI | An "editor" must allow editing |
| 4.13 | Delete node from UI | Same |
| 4.16 | Node theming (APEX) | Demo visual impact, differentiation |
| 7.4 | Dropdown property editors | Enum values need proper UI, not text input |
| 7.5 | Position editor (XYZ) | Core scenario authoring operation |
| 7.6 | Nested property expansion | Action/Condition detail editing |
| 1.5+1.6 | Full Undo/Redo | Editing without undo is unusable |
| 6.3 | Timeline time axis | Visualize simulation time structure |

### Tier 2: Demo Quality Boost

These features significantly improve the demo impression.

| # | Feature | Reason |
|---|---------|--------|
| 5.7 | Road 3D rendering (.xodr) | 3D view with only grid is underwhelming |
| 5.8 | Vehicle 3D rendering | Visualize entity positions |
| 4.17 | Collapse/expand sub-trees | Complex scenarios overwhelm the view |
| 4.14 | Manual edge connection | Edit node relationships |
| 8.4 | Error → element navigation | Validation usability |
| 12.1 | Keyboard shortcuts (full) | Power user efficiency |
| 3.5 | Template preview | Confidence before applying |

### Tier 3: Nice to Have (For Public Release)

| # | Feature | Reason |
|---|---------|--------|
| 1.7 | Export (JSON, etc.) | Data portability |
| 1.8 | Recent files | Basic UX |
| 1.9 | Drag & drop file open | UX convenience |
| 2.7 | MiscObject entity type | Complete entity support |
| 2.9 | Entity duplicate | Efficiency |
| 3.6 | Custom template creation | User productivity |
| 4.15 | Node search/filter | Large scenario support |
| 5.10 | Entity selection in 3D | Intuitive interaction |
| 6.5 | Event drag/resize | Timeline editing |
| 6.6 | Timeline zoom | Time axis operation |
| 8.5 | Real-time validation | Immediate feedback |
| 8.6 | XSD schema validation | Spec compliance |
| 9.2 | Persist language preference | Basic UX |

### Tier 4: Future (Post-Release)

| # | Feature | Reason |
|---|---------|--------|
| 2.10 | Entity reorder | Low priority |
| 3.7 | Template import/export | Community feature |
| 5.11 | Measurement tools | Specialized |
| 5.12 | Trajectory visualization | Advanced viz |
| 9.3 | Additional languages | i18n expansion |
| 11.4 | Simulation playback viz | After backend completion |
| 11.5 | OSI gRPC streaming | Full GT_Sim integration |

---

## Appendix A: OpenSCENARIO v1.2 XSD Spec Coverage Map

> Generated: 2026-02-28 | XSD Source: `Thirdparty/openscenario-v1.2.0/Schema/OpenSCENARIO.xsd`
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
- **Distribution/Stochastic** (14 types): Entire parameter distribution subsystem for automated test variation.
- **TrajectoryPosition**: The only position type without a typed model.
- **TimeOfDayCondition**: The only ByValueCondition variant not dispatched.
- **Catalog definition files**: Only CatalogLocations and CatalogReference handled; no standalone catalog XML parsing.
- **ExternalObjectReference**, **EntitySelection**, **DomeImage**, **SensorReference/SensorReferenceSet**, **Color/ColorCmyk** (detailed color model), **License** (FileHeader child), **UsedArea**.
