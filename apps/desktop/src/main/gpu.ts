import { appendFileSync } from 'node:fs';
import path from 'node:path';
import { app } from 'electron';

/**
 * GPU fallback and diagnostics for Windows `THREE.WebGLRenderer: Context Lost`
 * reports.
 *
 * Electron 33 on Windows defaults to ANGLE's D3D11 backend, which has known
 * context-loss issues on some GPU/driver combinations (the renderer's compositor
 * can lock up entirely when the GPU process crash-loops after a lost context —
 * this is what makes the app "totally unresponsive" rather than just losing the
 * 3D view). There is no single flag that is safe for every machine, so this is
 * an opt-in override via `OSCE_GPU_MODE`, not a default — flip it only on
 * machines that reproduce the crash:
 *
 *   OSCE_GPU_MODE=angle-gl     — ANGLE OpenGL backend instead of D3D11
 *   OSCE_GPU_MODE=angle-d3d9   — ANGLE Direct3D9 backend (older/more conservative)
 *   OSCE_GPU_MODE=swiftshader  — force SwiftShader software rendering (no GPU)
 *   OSCE_GPU_MODE=off          — disable GPU hardware acceleration entirely
 *
 * Must run before `app.whenReady()` — `commandLine.appendSwitch` and
 * `disableHardwareAcceleration` are no-ops once the app is ready.
 */
export function applyGpuModeOverride(): void {
  const mode = process.env.OSCE_GPU_MODE;
  if (!mode) return;

  switch (mode) {
    case 'angle-gl':
      app.commandLine.appendSwitch('use-angle', 'gl');
      break;
    case 'angle-d3d9':
      app.commandLine.appendSwitch('use-angle', 'd3d9');
      break;
    case 'swiftshader':
      // Keep GPU process compositing disabled too — SwiftShader only covers
      // WebGL/GL, not the compositor, and a mismatched compositor backend can
      // itself cause context loss on some drivers.
      app.commandLine.appendSwitch('use-gl', 'swiftshader');
      app.commandLine.appendSwitch('disable-gpu-compositing');
      break;
    case 'off':
      app.disableHardwareAcceleration();
      break;
    default:
      logGpuEvent(
        `Unknown OSCE_GPU_MODE="${mode}" — ignoring. Expected one of: ` +
          'angle-gl, angle-d3d9, swiftshader, off.',
      );
      return;
  }

  logGpuEvent(`Applied OSCE_GPU_MODE override: ${mode}`);
}

/**
 * Log GPU/renderer process failures so a Context Lost report can be correlated
 * with a GPU process crash (or ruled out). Purely observational — does not
 * attempt recovery, since Chromium already restarts the GPU process on its own.
 */
export function installGpuDiagnostics(): void {
  app.on('child-process-gone', (_event, details) => {
    logGpuEvent(
      `child-process-gone: type=${details.type} reason=${details.reason} ` +
        `exitCode=${details.exitCode} name=${details.name ?? ''}`,
    );
  });

  app.on('render-process-gone', (_event, _webContents, details) => {
    logGpuEvent(`render-process-gone: reason=${details.reason} exitCode=${details.exitCode}`);
  });
}

/**
 * Packaged Windows builds run under the GUI subsystem with no attached
 * console, so `console.log`/`console.error` in the main process are invisible
 * even when the app is launched from a terminal (verified: stdout/stderr stay
 * empty whether launched directly or via `Start-Process -Redirect*`). Mirror
 * GPU events to a small file under userData so a field report is actually
 * diagnosable; still logs to console too since that *does* work in `pnpm dev`.
 */
function logGpuEvent(message: string): void {
  const line = `[gpu] ${message}`;
  console.log(line);
  try {
    const logPath = path.join(app.getPath('userData'), 'gpu.log');
    appendFileSync(logPath, `${new Date().toISOString()} ${line}\n`);
  } catch {
    // Best-effort — a failure to write the diagnostic log must never crash
    // startup or mask the underlying GPU issue.
  }
}
