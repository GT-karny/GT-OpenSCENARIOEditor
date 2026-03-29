/**
 * Editor-wide assembly preset persistence via electron-store.
 * Saved to: %APPDATA%/OpenSCENARIO Editor/config.json (alongside recent files)
 */

import Store from 'electron-store';

interface AssemblyPresetsSchema {
  assemblyPresets: unknown[];
}

const store = new Store<AssemblyPresetsSchema>({
  defaults: {
    assemblyPresets: [],
  },
});

export function getAssemblyPresets(): unknown[] {
  return store.get('assemblyPresets');
}

export function saveAssemblyPresets(presets: unknown[]): void {
  store.set('assemblyPresets', presets);
}
