/**
 * WP6 SKELETON — stage the GT_Sim backend + native binaries into the desktop
 * app's extraResources before `electron-builder` runs.
 *
 * STATUS: skeleton only. The exact source layout on the fork side and the final
 * on-disk layout under `resources/` are confirmed in WP6. This file documents
 * the intended collection so `python-server.ts`'s packaged path resolution
 * (`resources/gtsim-backend/`, treated as GT_SIM_WEB_PACKAGE_ROOT) and
 * `electron-builder.yml`'s `extraResources` can be finalized together.
 *
 * Packaged layout target (mirrors backend/config.py PACKAGED branch):
 *
 *   resources/gtsim-backend/            <- GT_SIM_WEB_PACKAGE_ROOT
 *     server/gt_sim_web.exe             PyInstaller one-folder of web/backend
 *     server/_internal/…                (PyInstaller deps; python312.zip etc.)
 *     bin/GT_Sim.exe                    simulator (config: PACKAGE_ROOT/bin)
 *     bin/GT_RoadGen.exe
 *     bin/esminiRMLib.dll               ** must be OUTSIDE asar **
 *     bin/GT_esminiLib.dll
 *     config/                           real_vehicle_params.json, thresholds…
 *     resources/xosc, resources/xodr    scenario/road assets
 *     data/                             created at runtime (results, db, projects)
 *
 * electron-builder.yml (WP6):
 *   extraResources:
 *     - from: <staged>/gtsim-backend
 *       to: gtsim-backend
 *   asarUnpack: '**/*.dll'   # DLLs must be loadable from disk
 *
 * Env override for dev/CI: GT_SIM_WEB_PACKAGE_ROOT points config.py at this dir.
 */

// TODO(WP6): implement staging. Sketch:
//   1. locate the fork esmini root (reuse resolveEsminiRoot logic / env).
//   2. run the fork's PyInstaller build (web/pyinstaller/) → gt_sim_web.exe.
//   3. copy GT_Sim.exe / GT_RoadGen.exe / *.DLL from build/GT_esmini/Release
//      and DriverScript/bin into gtsim-backend/bin.
//   4. copy config/ and resources/{xosc,xodr}.
//   5. emit into apps/desktop/<staging>/gtsim-backend for electron-builder.

console.error('[stage-gtsim-backend] WP6 skeleton — not yet implemented.');
process.exit(1);
