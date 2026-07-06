/**
 * esmini WASM Web Worker.
 *
 * Runs the esmini scenario engine in a dedicated worker thread.
 * Communicates with the main thread via postMessage using the
 * WorkerRequest/WorkerResponse protocol defined in types.ts.
 *
 * The WASM module (esmini.js) must be placed in public/wasm/esmini.js.
 */

/// <reference lib="webworker" />
declare const self: DedicatedWorkerGlobalScope;

import type {
  WorkerRequest,
  WorkerResponse,
  WasmScenarioObjectState,
  WasmStoryBoardEvent,
  WasmConditionEvent,
  WasmTrafficLightState,
  WasmVehicleLightState,
  WasmOpenScenarioConfig,
  WasmRMPositionResult,
  WasmRMPathPoint,
  WasmGTLaneChange,
} from './types.js';

// NOTE: This file runs as a CLASSIC web worker (it uses importScripts to load
// the esmini glue). Classic workers cannot use runtime ES `import`, so the VFS
// path logic below is inlined here and kept in sync with (and unit-tested via)
// ./vfs-paths.ts. Only `import type` is allowed in this file.

const VFS = {
  scenarioDir: '/scenarios',
  scenarioFile: '/scenarios/scenario.xosc',
  roadFile: '/scenarios/road.xodr',
  catalogDir: '/catalogs',
} as const;

/** Catalog filename esmini expects: derived from internal <Catalog name="...">. */
function catalogVfsPath(xml: string, fallbackKey: string): string {
  const m = xml.match(/<Catalog\b[^>]*\bname\s*=\s*"([^"]+)"/);
  return `${VFS.catalogDir}/${m ? m[1] : fallbackKey}.xosc`;
}

function rewriteLogicFilePath(xosc: string): string {
  return xosc.replace(/(<LogicFile\s+filepath\s*=\s*")([^"]*?)(")/, `$1${VFS.roadFile}$3`);
}

function rewriteCatalogDirectories(xosc: string): string {
  return xosc.replace(
    /(<(?:Vehicle|Controller|Pedestrian|MiscObject|Environment|Maneuver|Trajectory|Route)Catalog>\s*<Directory\s+path\s*=\s*")([^"]*?)(")/g,
    `$1${VFS.catalogDir}/$3`,
  );
}

// Emscripten module factory type
interface EsminiModule {
  FS: {
    writeFile(path: string, data: string | Uint8Array): void;
    mkdir(path: string): void;
    unlink(path: string): void;
  };
  OpenScenario: new (
    path: string,
    config: WasmOpenScenarioConfig,
  ) => EsminiScenario;
  RoadManagerJS: {
    loadOpenDrive(xodrXml: string): boolean;
    laneToWorld(roadId: number, laneId: number, s: number, offset: number): WasmRMPositionResult;
    worldToLane(x: number, y: number): WasmRMPositionResult;
    trackToWorld(roadId: number, s: number, t: number): WasmRMPositionResult;
    getRoadLength(roadId: number): number;
    getLaneWidth(roadId: number, laneId: number, s: number): number;
    getNumberOfRoads(): number;
    getNumberOfLanes(roadId: number, s: number): number;
    calculatePath(
      startRoadId: number, startLaneId: number, startS: number,
      endRoadId: number, endLaneId: number, endS: number,
      sampleInterval: number,
    ): unknown[];
  };
  GTRouteJS: {
    calculateRoute(
      startRoad: number, startLane: number, startS: number,
      endRoad: number, endLane: number, endS: number,
      strategy: number,
    ): unknown;
  };
}

interface EsminiVector<T> {
  size(): number;
  get(index: number): T;
  delete(): void;
}

interface EsminiScenario {
  step(dt: number): number;
  getSimulationTime(): number;
  getNumberOfObjects(): number;
  isComplete(): boolean;
  getCurrentState(): EsminiVector<WasmScenarioObjectState>;
  popStoryBoardEvents(): EsminiVector<WasmStoryBoardEvent>;
  popConditionEvents(): EsminiVector<WasmConditionEvent>;
  getTrafficLightStatesOnly(): WasmTrafficLightState[];
  getVehicleLightStates(): WasmVehicleLightState[];
  delete(): void;
}

let module: EsminiModule | null = null;
let scenario: EsminiScenario | null = null;
let playIntervalId: ReturnType<typeof setInterval> | null = null;

function post(msg: WorkerResponse) {
  self.postMessage(msg);
}

function vectorToArray<T>(vec: EsminiVector<T>, clone?: (item: T) => T): T[] {
  const arr: T[] = [];
  const len = vec.size();
  for (let i = 0; i < len; i++) {
    const item = vec.get(i);
    arr.push(clone ? clone(item) : item);
  }
  vec.delete();
  return arr;
}

/**
 * Deep-copy a WasmScenarioObjectState from an embind proxy into a plain JS object.
 * Embind objects may share underlying WASM memory — reading properties after the
 * next step() call returns stale data. Explicit copy ensures each frame is independent.
 */
function cloneObjectState(obj: WasmScenarioObjectState): WasmScenarioObjectState {
  return {
    name: obj.name,
    id: obj.id,
    model_id: obj.model_id,
    ctrl_type: obj.ctrl_type,
    timestamp: obj.timestamp,
    x: obj.x,
    y: obj.y,
    z: obj.z,
    h: obj.h,
    p: obj.p,
    r: obj.r,
    road_id: obj.road_id,
    junction_id: obj.junction_id,
    t: obj.t,
    lane_id: obj.lane_id,
    lane_offset: obj.lane_offset,
    s: obj.s,
    speed: obj.speed,
    center_offset_x: obj.center_offset_x,
    center_offset_y: obj.center_offset_y,
    center_offset_z: obj.center_offset_z,
    width: obj.width,
    length: obj.length,
    height: obj.height,
    object_type: obj.object_type,
    object_category: obj.object_category,
    wheel_angle: obj.wheel_angle,
    wheel_rot: obj.wheel_rot,
  };
}

async function loadModule(): Promise<EsminiModule> {
  if (module) return module;

  // The Emscripten glue file exports a factory function
  // SINGLE_FILE=1 means the WASM is embedded in the JS file
  importScripts('/wasm/esmini.js');

  // The Emscripten module factory is exposed as a global `esmini`
  // (set by EXPORT_NAME="esmini" in CMakeLists.txt)
  const factory = (self as unknown as Record<string, unknown>).esmini as (
    opts?: Record<string, unknown>,
  ) => Promise<EsminiModule>;

  module = await factory();
  return module;
}

function stopPlayLoop() {
  if (playIntervalId !== null) {
    clearInterval(playIntervalId);
    playIntervalId = null;
  }
}

function ensureDir(fs: EsminiModule['FS'], path: string) {
  try { fs.mkdir(path); } catch { /* already exists */ }
}

async function handleLoad(
  xoscXml: string,
  xodrData?: string,
  catalogs?: Record<string, string>,
  config?: Partial<WasmOpenScenarioConfig>,
) {
  try {
    const mod = await loadModule();

    // Clean up previous scenario
    if (scenario) {
      scenario.delete();
      scenario = null;
    }

    // Write files to Emscripten virtual filesystem
    ensureDir(mod.FS, VFS.scenarioDir);

    let finalXosc = xoscXml;

    // Write xodr and rewrite LogicFile path
    if (xodrData) {
      mod.FS.writeFile(VFS.roadFile, xodrData);
      finalXosc = rewriteLogicFilePath(finalXosc);
    }

    // Write catalog files and rewrite CatalogLocations paths.
    // Catalog files are named after their INTERNAL <Catalog name="...">, which
    // is how esmini resolves CatalogReference (dir/<catalogName>.xosc).
    if (catalogs && Object.keys(catalogs).length > 0) {
      ensureDir(mod.FS, VFS.catalogDir);
      for (const [key, xml] of Object.entries(catalogs)) {
        mod.FS.writeFile(catalogVfsPath(xml, key), xml);
      }
      finalXosc = rewriteCatalogDirectories(finalXosc);
    }

    mod.FS.writeFile(VFS.scenarioFile, finalXosc);

    const wasmConfig: WasmOpenScenarioConfig = {
      max_loop: config?.max_loop ?? 100000,
      min_time_step: config?.min_time_step ?? 1 / 120,
      max_time_step: config?.max_time_step ?? 1 / 25,
      dt: config?.dt ?? 0,
    };

    scenario = new mod.OpenScenario(VFS.scenarioFile, wasmConfig);

    post({
      type: 'loaded',
      numberOfObjects: scenario.getNumberOfObjects(),
    });
  } catch (err) {
    // GT_Sim treats any OpenDRIVE using <include> as a permanent hard error.
    // Flag it in the message so the classifier can surface a specific, actionable
    // toast instead of the generic "missing road" one. Kept in sync with
    // xodrHasInclude() in sim-error.ts (this classic worker cannot import it).
    const includeFailure = !!xodrData && /<(?:[\w.-]+:)?include\b/i.test(xodrData);
    const rawMessage = err instanceof Error ? err.message : String(err);
    post({
      type: 'error',
      message: includeFailure
        ? `OpenDRIVE map uses <include> references (unsupported by the simulator): ${rawMessage}`
        : rawMessage,
    });
  }
}

function handlePlay(speed: number, fps: number) {
  if (!scenario) {
    post({ type: 'error', message: 'No scenario loaded' });
    return;
  }

  stopPlayLoop();

  const dt = (1 / fps) * speed;
  const maxSteps = 100000;
  const MAX_SIM_TIME = 120; // seconds — prevent runaway simulations

  // Batch mode: accumulate all frames in memory, send once at end
  const frames: Array<{
    simulationTime: number;
    objects: WasmScenarioObjectState[];
    trafficLightStates: WasmTrafficLightState[];
    vehicleLightStates: WasmVehicleLightState[];
  }> = [];
  const allStoryBoardEvents: WasmStoryBoardEvent[] = [];
  const allConditionEvents: WasmConditionEvent[] = [];

  for (let i = 0; i < maxSteps; i++) {
    const result = scenario.step(dt);
    const simulationTime = scenario.getSimulationTime();
    const isComplete = scenario.isComplete();

    const objects = vectorToArray(scenario.getCurrentState(), cloneObjectState);
    const storyBoardEvents = vectorToArray(scenario.popStoryBoardEvents());
    const conditionEvents = vectorToArray(scenario.popConditionEvents());
    const trafficLightStates = typeof scenario.getTrafficLightStatesOnly === 'function'
      ? (scenario.getTrafficLightStatesOnly() as WasmTrafficLightState[])
      : [];
    const vehicleLightStates = typeof scenario.getVehicleLightStates === 'function'
      ? (scenario.getVehicleLightStates() as WasmVehicleLightState[])
      : [];

    frames.push({ simulationTime, objects, trafficLightStates, vehicleLightStates });
    allStoryBoardEvents.push(...storyBoardEvents);
    allConditionEvents.push(...conditionEvents);

    if (isComplete || result !== 0 || simulationTime >= MAX_SIM_TIME) {
      break;
    }
  }

  const duration = frames.length > 0
    ? frames[frames.length - 1].simulationTime
    : 0;

  // Send ALL data in a single message
  post({
    type: 'batch-completed',
    frames,
    storyBoardEvents: allStoryBoardEvents,
    conditionEvents: allConditionEvents,
    duration,
  });
}

function handleDispose() {
  stopPlayLoop();
  if (scenario) {
    scenario.delete();
    scenario = null;
  }
}

// --- RoadManager handlers ---

async function handleRmLoadOdr(xodrXml: string) {
  try {
    const mod = await loadModule();
    const ok = mod.RoadManagerJS.loadOpenDrive(xodrXml);
    if (ok) {
      post({ type: 'rm-loaded' });
    } else {
      post({ type: 'rm-error', message: 'Failed to load OpenDRIVE XML' });
    }
  } catch (err) {
    post({ type: 'rm-error', message: err instanceof Error ? err.message : String(err) });
  }
}

async function handleRmPosition(
  requestId: string,
  fn: (mod: EsminiModule) => WasmRMPositionResult,
) {
  try {
    const mod = await loadModule();
    const result = fn(mod);
    post({ type: 'rm-position', requestId, result });
  } catch (err) {
    post({ type: 'rm-error', requestId, message: err instanceof Error ? err.message : String(err) });
  }
}

async function handleRmScalar(
  requestId: string,
  fn: (mod: EsminiModule) => number,
) {
  try {
    const mod = await loadModule();
    const value = fn(mod);
    post({ type: 'rm-scalar', requestId, value });
  } catch (err) {
    post({ type: 'rm-error', requestId, message: err instanceof Error ? err.message : String(err) });
  }
}

async function handleRmPath(
  requestId: string,
  startRoadId: number, startLaneId: number, startS: number,
  endRoadId: number, endLaneId: number, endS: number,
  sampleInterval: number,
) {
  try {
    const mod = await loadModule();
    const rawPoints = mod.RoadManagerJS.calculatePath(
      startRoadId, startLaneId, startS,
      endRoadId, endLaneId, endS,
      sampleInterval,
    );
    // Convert embind result to plain JS array.
    // rawPoints may be an embind vector (with size()/get()) or a plain JS array
    // depending on the embind binding configuration.
    let points: Array<{
      x: number; y: number; z: number; h: number;
      road_id: number; lane_id: number; s: number;
    }>;

    const clonePathPoint = (p: Record<string, number>) => ({
      x: p.x,
      y: p.y,
      z: p.z,
      h: p.h,
      road_id: p.road_id,
      lane_id: p.lane_id,
      s: p.s,
    });

    if (Array.isArray(rawPoints)) {
      points = (rawPoints as Record<string, number>[]).map(clonePathPoint);
    } else if (rawPoints && typeof (rawPoints as EsminiVector<unknown>).size === 'function') {
      // Embind vector — use vectorToArray to convert and release WASM memory
      const vec = rawPoints as EsminiVector<Record<string, number>>;
      points = vectorToArray(vec).map(clonePathPoint);
    } else {
      points = [];
    }
    post({ type: 'rm-path', requestId, points });
  } catch (err) {
    post({ type: 'rm-error', requestId, message: err instanceof Error ? err.message : String(err) });
  }
}

async function handleGtRoute(
  requestId: string,
  startRoadId: number, startLaneId: number, startS: number,
  endRoadId: number, endLaneId: number, endS: number,
  strategy: number,
) {
  try {
    const mod = await loadModule();
    // GTRouteJS.calculateRoute returns a plain JS object (emscripten::val):
    //   { found, length, waypoints:[{x,y,z,h,road_id,lane_id,s}], laneChanges:[{road_id,s,from_lane,to_lane}] }
    const raw = mod.GTRouteJS.calculateRoute(
      startRoadId, startLaneId, startS,
      endRoadId, endLaneId, endS,
      strategy,
    ) as {
      found: boolean;
      length: number;
      waypoints: Array<Record<string, number>>;
      laneChanges: Array<Record<string, number>>;
    };

    const waypoints: WasmRMPathPoint[] = Array.isArray(raw.waypoints)
      ? raw.waypoints.map((p) => ({
          x: p.x, y: p.y, z: p.z, h: p.h,
          road_id: p.road_id, lane_id: p.lane_id, s: p.s,
        }))
      : [];
    const laneChanges: WasmGTLaneChange[] = Array.isArray(raw.laneChanges)
      ? raw.laneChanges.map((c) => ({
          road_id: c.road_id, s: c.s, from_lane: c.from_lane, to_lane: c.to_lane,
        }))
      : [];

    post({
      type: 'gt-route',
      requestId,
      result: { found: !!raw.found, length: raw.length, waypoints, laneChanges },
    });
  } catch (err) {
    post({ type: 'rm-error', requestId, message: err instanceof Error ? err.message : String(err) });
  }
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data;

  switch (msg.type) {
    // Simulation messages
    case 'load':
      handleLoad(msg.xoscXml, msg.xodrData, msg.catalogs, msg.config);
      break;
    case 'play':
      try {
        handlePlay(msg.speed, msg.fps);
      } catch (err) {
        post({
          type: 'error',
          message: `Playback crashed: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
      break;
    case 'pause':
      stopPlayLoop();
      break;
    case 'dispose':
      handleDispose();
      break;

    // RoadManager messages
    case 'rm-load-odr':
      handleRmLoadOdr(msg.xodrXml);
      break;
    case 'rm-lane-to-world':
      handleRmPosition(msg.requestId, (mod) =>
        mod.RoadManagerJS.laneToWorld(msg.roadId, msg.laneId, msg.s, msg.offset),
      );
      break;
    case 'rm-world-to-lane':
      handleRmPosition(msg.requestId, (mod) =>
        mod.RoadManagerJS.worldToLane(msg.x, msg.y),
      );
      break;
    case 'rm-track-to-world':
      handleRmPosition(msg.requestId, (mod) =>
        mod.RoadManagerJS.trackToWorld(msg.roadId, msg.s, msg.t),
      );
      break;
    case 'rm-road-length':
      handleRmScalar(msg.requestId, (mod) =>
        mod.RoadManagerJS.getRoadLength(msg.roadId),
      );
      break;
    case 'rm-lane-width':
      handleRmScalar(msg.requestId, (mod) =>
        mod.RoadManagerJS.getLaneWidth(msg.roadId, msg.laneId, msg.s),
      );
      break;
    case 'rm-road-count':
      handleRmScalar(msg.requestId, (mod) =>
        mod.RoadManagerJS.getNumberOfRoads(),
      );
      break;
    case 'rm-lane-count':
      handleRmScalar(msg.requestId, (mod) =>
        mod.RoadManagerJS.getNumberOfLanes(msg.roadId, msg.s),
      );
      break;
    case 'rm-calculate-path':
      handleRmPath(
        msg.requestId,
        msg.startRoadId, msg.startLaneId, msg.startS,
        msg.endRoadId, msg.endLaneId, msg.endS,
        msg.sampleInterval,
      );
      break;
    case 'gt-calculate-route':
      handleGtRoute(
        msg.requestId,
        msg.startRoadId, msg.startLaneId, msg.startS,
        msg.endRoadId, msg.endLaneId, msg.endS,
        msg.strategy,
      );
      break;
  }
};
