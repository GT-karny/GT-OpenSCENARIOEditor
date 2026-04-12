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
- For Podman dev container users: this build is **not** run inside the container. Use the host emsdk install. See [.devcontainer/README.md](../../.devcontainer/README.md) for the rationale.
