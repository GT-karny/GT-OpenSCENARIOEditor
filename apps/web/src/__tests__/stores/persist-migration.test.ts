import { describe, it, expect, beforeEach, vi } from 'vitest';
import { migrateEditorPreferences } from '../../stores/editor-store';
import { migrateProjectState } from '../../stores/project-store';

const EDITOR_KEY = 'osce-editor-preferences';
const PROJECT_KEY = 'osce-project-state';

/**
 * zustand persist re-persists the envelope at the current source version whenever
 * migrate runs (`migrated === true`). Seeding a `version: 0` envelope therefore
 * both hydrates the values (proving migrate returned them) and bumps the on-disk
 * envelope to `version: 1` (proving migrate fired and was wired in). The store
 * singleton caches its one-time hydration, so each rehydration test resets the
 * module registry and dynamically imports a fresh store against seeded storage.
 */
describe('persisted store migration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  describe('editor-store (osce-editor-preferences)', () => {
    it('hydrates a version-0 payload and re-stamps it at the current version', async () => {
      localStorage.setItem(
        EDITOR_KEY,
        JSON.stringify({
          state: {
            preferences: { language: 'ja', theme: 'dark' },
            panelVisibility: {
              nodeEditor: false,
              '3dViewer': true,
              timeline: true,
              properties: true,
              entityList: true,
              validation: true,
              templates: true,
              simulation: false,
            },
            entityPropertyTab: 'initialState',
            showIntersectionTimeline: true,
          },
          version: 0,
        }),
      );

      const { useEditorStore } = await import('../../stores/editor-store');
      const state = useEditorStore.getState();

      // (a) seeded values survived migrate + merge
      expect(state.entityPropertyTab).toBe('initialState');
      expect(state.showIntersectionTimeline).toBe(true);
      expect(state.preferences.language).toBe('ja');
      expect(state.preferences.theme).toBe('dark');
      expect(state.panelVisibility.nodeEditor).toBe(false);
      // merge backfills preference keys absent from the v0 payload
      expect(state.preferences.autoSave).toBe(true);

      // (b) migrate fired: zustand re-persisted the envelope at the new version
      const envelope = JSON.parse(localStorage.getItem(EDITOR_KEY) as string);
      expect(envelope.version).toBe(1);
    });

    it('migrateEditorPreferences passes a version-0 state through unchanged', () => {
      const v0 = {
        preferences: { language: 'ja' },
        panelVisibility: {},
        entityPropertyTab: 'definition',
        showIntersectionTimeline: false,
      };
      expect(migrateEditorPreferences(v0, 0)).toBe(v0);
    });
  });

  describe('project-store (osce-project-state)', () => {
    it('hydrates a version-0 payload and re-stamps it at the current version', async () => {
      localStorage.setItem(
        PROJECT_KEY,
        JSON.stringify({
          state: {
            recentProjectIds: ['proj-a', 'proj-b'],
            projectsRoot: '/tmp/projects',
          },
          version: 0,
        }),
      );

      const { useProjectStore } = await import('../../stores/project-store');
      const state = useProjectStore.getState();

      // (a) seeded values survived migrate + merge
      expect(state.recentProjectIds).toEqual(['proj-a', 'proj-b']);
      expect(state.projectsRoot).toBe('/tmp/projects');

      // (b) migrate fired: zustand re-persisted the envelope at the new version
      const envelope = JSON.parse(localStorage.getItem(PROJECT_KEY) as string);
      expect(envelope.version).toBe(1);
    });

    it('migrateProjectState passes a version-0 state through unchanged', () => {
      const v0 = { recentProjectIds: ['x'], projectsRoot: null };
      expect(migrateProjectState(v0, 0)).toBe(v0);
    });
  });
});
