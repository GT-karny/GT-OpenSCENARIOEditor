/**
 * Assembly preset persistence — editor-wide, auto-saved.
 *
 * - Electron: electron-store via IPC (saved to %APPDATA%/OpenSCENARIO Editor/config.json)
 * - Browser:  localStorage fallback
 *
 * Auto-saves on every Zustand store change.
 */

import {
  assemblyPresetStore,
  serializePresets,
  deserializePresets,
} from '@osce/opendrive-engine';
import type { AssemblyPreset } from '@osce/opendrive-engine';
import { isElectron } from './platform';

const STORAGE_KEY = 'osce:signal-assembly-presets';

// ---------------------------------------------------------------------------
// Load
// ---------------------------------------------------------------------------

/** Load presets from Electron store or localStorage. */
async function loadPresets(): Promise<void> {
  try {
    if (isElectron()) {
      const raw = await window.electronAPI!.getAssemblyPresets();
      if (Array.isArray(raw) && raw.length > 0) {
        // electron-store stores parsed objects directly (no JSON string)
        const presets = raw as AssemblyPreset[];
        for (const preset of presets) {
          assemblyPresetStore.getState().saveCustomPreset(preset);
        }
        return;
      }
    }
  } catch {
    // Fall through to localStorage
  }

  // localStorage fallback (browser or Electron with empty store)
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return;
    const presets = deserializePresets(json);
    for (const preset of presets) {
      assemblyPresetStore.getState().saveCustomPreset(preset);
    }
  } catch {
    // Silently ignore corrupt data
  }
}

// ---------------------------------------------------------------------------
// Save
// ---------------------------------------------------------------------------

/** Save current presets to Electron store and localStorage. */
function savePresets(): void {
  const { customPresets } = assemblyPresetStore.getState();

  // Electron: save via IPC (editor-wide config.json)
  if (isElectron()) {
    try {
      window.electronAPI!.saveAssemblyPresets(customPresets);
    } catch {
      // Silently ignore IPC errors
    }
  }

  // Also save to localStorage (backup / browser fallback)
  try {
    if (customPresets.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, serializePresets(customPresets));
    }
  } catch {
    // localStorage may be full or unavailable
  }
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

/** Initialize persistence: load on startup, auto-save on every change. */
export function initPresetPersistence(): () => void {
  // Load (async for Electron IPC, but fire-and-forget is fine)
  loadPresets();

  // Auto-save on every store change
  const unsubscribe = assemblyPresetStore.subscribe(() => {
    savePresets();
  });

  return unsubscribe;
}

// ---------------------------------------------------------------------------
// Export / Import (manual file operations)
// ---------------------------------------------------------------------------

/** Export custom presets as a downloadable JSON file. */
export function exportPresetsToFile(): void {
  const { customPresets } = assemblyPresetStore.getState();
  const json = serializePresets(customPresets);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'signal-assembly-presets.json';
  a.click();
  URL.revokeObjectURL(url);
}

/** Import presets from a JSON file (merges with existing). */
export function importPresetsFromFile(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const presets = deserializePresets(reader.result as string);
        let count = 0;
        for (const preset of presets) {
          assemblyPresetStore.getState().saveCustomPreset(preset);
          count++;
        }
        resolve(count);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
