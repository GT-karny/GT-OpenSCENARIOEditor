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
  WasmOpenScenarioConfig,
} from './types.js';

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
  delete(): void;
}

let module: EsminiModule | null = null;
let scenario: EsminiScenario | null = null;
let playIntervalId: ReturnType<typeof setInterval> | null = null;

function post(msg: WorkerResponse) {
  self.postMessage(msg);
}

function vectorToArray<T>(vec: EsminiVector<T>): T[] {
  const arr: T[] = [];
  const len = vec.size();
  for (let i = 0; i < len; i++) {
    arr.push(vec.get(i));
  }
  vec.delete();
  return arr;
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

function executeStep(dt: number) {
  if (!scenario) {
    post({ type: 'error', message: 'No scenario loaded' });
    return;
  }

  const result = scenario.step(dt);
  const simulationTime = scenario.getSimulationTime();
  const isComplete = scenario.isComplete();

  const stateVec = scenario.getCurrentState();
  const objects = vectorToArray(stateVec);

  const sbVec = scenario.popStoryBoardEvents();
  const storyBoardEvents = vectorToArray(sbVec);

  const condVec = scenario.popConditionEvents();
  const conditionEvents = vectorToArray(condVec);

  post({
    type: 'frame',
    simulationTime,
    objects,
    storyBoardEvents,
    conditionEvents,
    isComplete,
  });

  if (isComplete || result !== 0) {
    stopPlayLoop();
    post({ type: 'completed', simulationTime });
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
    ensureDir(mod.FS, '/scenarios');

    let finalXosc = xoscXml;

    // Write xodr and rewrite LogicFile path
    if (xodrData) {
      mod.FS.writeFile('/scenarios/road.xodr', xodrData);
      finalXosc = finalXosc.replace(
        /(<LogicFile\s+filepath\s*=\s*")([^"]*?)(")/,
        '$1/scenarios/road.xodr$3',
      );
    }

    // Write catalog files and rewrite CatalogLocations paths
    if (catalogs && Object.keys(catalogs).length > 0) {
      ensureDir(mod.FS, '/catalogs');
      for (const [name, xml] of Object.entries(catalogs)) {
        mod.FS.writeFile(`/catalogs/${name}.xosc`, xml);
      }
      // Rewrite all CatalogLocation Directory paths to /catalogs/
      finalXosc = finalXosc.replace(
        /(<(?:Vehicle|Controller|Pedestrian|MiscObject|Environment|Maneuver|Trajectory|Route)Catalog>\s*<Directory\s+path\s*=\s*")([^"]*?)(")/g,
        '$1/catalogs/$3',
      );
    }

    mod.FS.writeFile('/scenarios/scenario.xosc', finalXosc);

    const wasmConfig: WasmOpenScenarioConfig = {
      max_loop: config?.max_loop ?? 100000,
      min_time_step: config?.min_time_step ?? 1 / 120,
      max_time_step: config?.max_time_step ?? 1 / 25,
      dt: config?.dt ?? 0,
    };

    scenario = new mod.OpenScenario('/scenarios/scenario.xosc', wasmConfig);

    post({
      type: 'loaded',
      numberOfObjects: scenario.getNumberOfObjects(),
    });
  } catch (err) {
    post({
      type: 'error',
      message: err instanceof Error ? err.message : String(err),
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
  const intervalMs = 1000 / fps;

  playIntervalId = setInterval(() => {
    executeStep(dt);
  }, intervalMs);
}

function handleDispose() {
  stopPlayLoop();
  if (scenario) {
    scenario.delete();
    scenario = null;
  }
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data;

  switch (msg.type) {
    case 'load':
      handleLoad(msg.xoscXml, msg.xodrData, msg.catalogs, msg.config);
      break;
    case 'step':
      executeStep(msg.dt);
      break;
    case 'play':
      handlePlay(msg.speed, msg.fps);
      break;
    case 'pause':
      stopPlayLoop();
      break;
    case 'dispose':
      handleDispose();
      break;
  }
};
