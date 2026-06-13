# esmini WASM Build

The OpenSCENARIO Editor embeds [esmini](https://github.com/esmini/esmini) as a WebAssembly module, built from the GT_Sim fork. The compiled artifact (`esmini.js`) is committed manually — CI does not rebuild it.

## When to rebuild

Rebuild only when the C++ source under [Thirdparty/GT_Sim/GT_esmini/web/wasm/](../../Thirdparty/GT_Sim/GT_esmini/web/wasm/) (the GT esminiJS glue) or the core esmini modules it links change (e.g. new bindings, signal-state APIs, traffic logic fixes). Frequency is low — typically a few times per release cycle.

## Prerequisites

- **Emscripten SDK** installed somewhere on your machine.
  Common locations: `E:/emsdk` (project owner's Windows setup), `~/emsdk` (Linux/macOS).
  See [Emscripten SDK install guide](https://emscripten.org/docs/getting_started/downloads.html).
- **Python** and **ninja** — both ship inside the emsdk.
  On the owner's setup ninja is at `E:/emsdk/python/<version>/Scripts/ninja.exe` and is
  NOT on PATH after `emsdk_env.bat`; pass it explicitly (see below).

## Source layout

- Build root: `Thirdparty/GT_Sim/GT_esmini/web/wasm/`
  (the GT variant of esminiJS — relocated out of `EnvironmentSimulator/Libraries/esminiJS/`,
  which is now **vanilla upstream** and must not carry GT edits; see the README in the
  build root for the relocation rationale)
- Key files:
  - `esminijs.cpp` / `esminijs.hpp` — `OpenScenario` class, step API, dirty-bits handling
  - `embind.cpp` — step API + introspection bindings
  - `embind_rm.cpp` — `RoadManagerJS` coordinate-conversion wrapper
  - `gt_embind_route.cpp` — `GTRouteJS` lane-change-aware route binding
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

> **Note for Windows + Git Bash users:** Git Bash cannot resolve the Emscripten PATH correctly via `source` (only `.bat`/`.ps1` entry points exist). Either run the build from `cmd.exe`, or write a temporary `.bat` and invoke it via `cmd.exe //C "path\to\file.bat"`.

### 2. Configure (first build, or when CMakeLists.txt changes)

```cmd
cd Thirdparty\GT_Sim\GT_esmini\web\wasm
mkdir build & cd build
emcmake cmake -G Ninja -DCMAKE_MAKE_PROGRAM=E:/emsdk/python/3.13.3_64bit/Scripts/ninja.exe ..
```

The `CMAKE_MAKE_PROGRAM` override is required on Windows because emsdk's ninja is not on PATH. Adjust the embedded-Python version segment to your emsdk.

### 3. Build

```cmd
set PATH=E:\emsdk\python\3.13.3_64bit\Scripts;%PATH%
ninja
```

After the first configure, `ninja` alone rebuilds only changed files.

## Output

- Build artifact: `Thirdparty/GT_Sim/GT_esmini/web/wasm/build/esmini.js` (~5MB, single-file with embedded WASM; `MODULARIZE=1`, `EXPORT_NAME="esmini"`).
- Deploy target: copy to `apps/web/public/wasm/esmini.js`.

## Verification

After deploying, run the WASM E2E suite — it executes the seeded sample scenarios
in-browser and asserts entities actually move during playback (guarding the
dirty-bits class of regression, see below):

```bash
cd apps/web && npx playwright test wasm-simulation
```

## Notes

- **Expected warnings:** `-Winconsistent-missing-override` and similar from esmini headers. No errors should appear.
- **Do not edit `apps/web/public/wasm/` files directly** — they are build outputs.
- **CI does not rebuild WASM** — the artifact is a manually-committed binary.
- **Do not build in `EnvironmentSimulator/Libraries/esminiJS/`** — since the upstream
  v3.3.0 catch-up that directory is vanilla upstream; the GT build lives only in
  `GT_esmini/web/wasm/`.

## Resolved issues

### Entities stayed frozen during simulation (per-step dirty bits not cleared) — FIXED

**Status:** Resolved in GT_Sim `672fb061` (included in the `f2674640` submodule pin,
deployed with the 2026-06 rebuild). `apps/web/e2e/wasm-simulation.spec.ts` now asserts
entity positions change between the first and last frame across the seeded sample
scenarios, so a regression of this class fails E2E.

**Symptom (historical):** Running any scenario completed and produced frames with a
correctly advancing simulation time, but every entity stayed pinned to its `Init`
position; `speed` was set correctly while `s` / `x` / `y` never changed.

**Root cause:** The standalone esmini player clears each object's per-step dirty bits
once per frame via `ScenarioEngine::SwapAndClearDirtyBits()`. The WASM glue called only
`scenarioEngine->step(dt)` + `prepareGroundTruth(dt)`, so the `LONGITUDINAL` dirty bit
set by an `Init` `SpeedAction` persisted forever and
`ScenarioEngine::defaultController()` skipped `MoveAlongS()` on every subsequent frame.
The fix mirrors the canonical `ScenarioPlayer::ScenarioFrame()` sequence by calling
`SwapAndClearDirtyBits()` after each `prepareGroundTruth()` (both the step API and the
batch `get_object_state` loop).
