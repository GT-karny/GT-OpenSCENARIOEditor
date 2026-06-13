# esmini WASM Build

The OpenSCENARIO Editor embeds [esmini](https://github.com/esmini/esmini) as a WebAssembly module, built from the GT_Sim fork. The compiled artifact (`esmini.js`) is committed manually — CI does not rebuild it.

## When to rebuild

Rebuild only when the C++ esmini source under [Thirdparty/GT_Sim/EnvironmentSimulator/Libraries/esminiJS/](../../Thirdparty/GT_Sim/EnvironmentSimulator/Libraries/esminiJS/) changes (e.g. new bindings, signal-state APIs, traffic logic fixes). Frequency is low — typically a few times per release cycle.

## Prerequisites

- **Emscripten SDK** installed somewhere on your machine.
  Common locations: `E:/emsdk` (project owner's Windows setup), `~/emsdk` (Linux/macOS).
  See [Emscripten SDK install guide](https://emscripten.org/docs/getting_started/downloads.html).
- **Python** and **ninja** — both ship inside the emsdk.

## Source layout

- Build root: `Thirdparty/GT_Sim/EnvironmentSimulator/Libraries/esminiJS/`
- Key files:
  - `esminijs.cpp`
  - `esminijs.hpp`
  - `embind.cpp`
  - `CMakeLists.txt`

## Build procedure

### 1. Activate emsdk

The exact command depends on your shell and emsdk install location. The goal is to get `emcc`, `em++`, and `emcmake` on PATH.

**Windows (cmd.exe):**
```cmd
E:\emsdk\emsdk_env.bat
```

**Linux / macOS (bash/zsh):**
```bash
source ~/emsdk/emsdk_env.sh
```

> **Note for Windows + Git Bash users:** Git Bash cannot resolve the Emscripten PATH correctly via `source`. Either run the build from `cmd.exe`, or write a temporary `.bat` and invoke it via `cmd.exe //C "path\to\file.bat"`.

### 2. Configure (only when CMakeLists.txt changes)

```bash
cd Thirdparty/GT_Sim/EnvironmentSimulator/Libraries/esminiJS/build
emcmake cmake ..
```

### 3. Build

```bash
ninja
```

The CMake cache is already configured in the repo, so `ninja` alone rebuilds only changed files in normal use.

## Output

- Build artifact: `Thirdparty/GT_Sim/EnvironmentSimulator/Libraries/esminiJS/build/esmini.js` (~5MB, single-file with embedded WASM).
- Deploy target: copy (or symlink) to `apps/web/public/wasm/esmini.js`.

## Notes

- **Expected warnings:** `-Winconsistent-missing-override` from esmini headers. No errors should appear.
- **Do not edit `apps/web/public/wasm/` files directly** — they are build outputs.
- **CI does not rebuild WASM** — the artifact is a manually-committed binary.

## Known issues (require a rebuild to fix)

### Entities stay frozen during simulation (per-step dirty bits not cleared)

**Symptom:** Running any scenario completes and produces frames with a correctly
advancing simulation time, but every entity stays pinned to its `Init` position.
Inspecting a frame shows the entity's `speed` is set correctly (e.g. 30 m/s) while
its `s` / `x` / `y` never change.

**Root cause:** The standalone esmini player clears each object's per-step dirty
bits once per frame via `ScenarioEngine::SwapAndClearDirtyBits()` (see
`Modules/PlayerBase/playerbase.cpp`, in the main loop around the
`ScenarioFrame()` calls). The WASM binding `OpenScenario::step()` in
`esminijs.cpp` calls `scenarioEngine->step(dt)` + `prepareGroundTruth(dt)` but
**never clears the dirty bits**. The `Init` `SpeedAction` sets the `LONGITUDINAL`
dirty bit on frame 0; because it is never cleared, `ScenarioEngine::defaultController()`
sees `obj->dirty_.Check(DirtyBit::LONGITUDINAL) == true` on every subsequent frame
and skips `MoveAlongS()`, so the object never advances along the road. The batch
APIs (`get_object_state`, `get_object_state_by_second`) have the same omission.

**Fix (in `esminijs.cpp`):** clear dirty bits at the end of each step, mirroring
the standalone player. In `OpenScenario::step(double dt)`, after
`this->scenarioEngine->prepareGroundTruth(dt);`, add:

```cpp
// Mirror ScenarioPlayer::ScenarioFrame — clear per-step dirty bits so the
// default controller moves entities on the next frame.
this->scenarioEngine->SwapAndClearDirtyBits();
```

Apply the same call inside the `get_object_state` batch loop (after each
`prepareGroundTruth`). Then rebuild per the procedure above and redeploy
`esmini.js`. This is the blocker for full WASM-simulation parity (roadmap A1);
until it lands, the editor's playback pipeline is fully wired but entity motion
is absent. The store→viewer wiring, error surfacing, and playback transport are
verified independently by `apps/web/e2e/wasm-simulation.spec.ts`.
