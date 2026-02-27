import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../../stores/editor-store';

describe('EditorStore', () => {
  beforeEach(() => {
    // Reset store state between tests
    useEditorStore.setState({
      selection: { selectedElementIds: [], hoveredElementId: null, focusedPanelId: null },
      validationResult: null,
      roadNetwork: null,
      currentFileName: null,
      isDirty: false,
    });
  });

  describe('selection', () => {
    it('should set selection', () => {
      useEditorStore.getState().setSelection({ selectedElementIds: ['id-1'] });
      expect(useEditorStore.getState().selection.selectedElementIds).toEqual(['id-1']);
    });

    it('should partially update selection', () => {
      useEditorStore.getState().setSelection({ selectedElementIds: ['id-1'] });
      useEditorStore.getState().setSelection({ hoveredElementId: 'id-2' });
      expect(useEditorStore.getState().selection.selectedElementIds).toEqual(['id-1']);
      expect(useEditorStore.getState().selection.hoveredElementId).toBe('id-2');
    });

    it('should clear selection', () => {
      useEditorStore.getState().setSelection({ selectedElementIds: ['id-1'] });
      useEditorStore.getState().clearSelection();
      expect(useEditorStore.getState().selection.selectedElementIds).toEqual([]);
      expect(useEditorStore.getState().selection.hoveredElementId).toBeNull();
    });
  });

  describe('preferences', () => {
    it('should update preferences partially', () => {
      useEditorStore.getState().updatePreferences({ language: 'ja' });
      expect(useEditorStore.getState().preferences.language).toBe('ja');
      // Other preferences unchanged
      expect(useEditorStore.getState().preferences.theme).toBe('system');
    });
  });

  describe('validation', () => {
    it('should set validation result', () => {
      const result = { valid: true, errors: [], warnings: [] };
      useEditorStore.getState().setValidationResult(result);
      expect(useEditorStore.getState().validationResult).toEqual(result);
    });

    it('should clear validation result', () => {
      useEditorStore.getState().setValidationResult({ valid: true, errors: [], warnings: [] });
      useEditorStore.getState().setValidationResult(null);
      expect(useEditorStore.getState().validationResult).toBeNull();
    });
  });

  describe('panel visibility', () => {
    it('should toggle panel visibility', () => {
      const initial = useEditorStore.getState().panelVisibility.simulation;
      useEditorStore.getState().togglePanel('simulation');
      expect(useEditorStore.getState().panelVisibility.simulation).toBe(!initial);
    });
  });

  describe('file state', () => {
    it('should set file name', () => {
      useEditorStore.getState().setCurrentFileName('test.xosc');
      expect(useEditorStore.getState().currentFileName).toBe('test.xosc');
    });

    it('should set dirty flag', () => {
      useEditorStore.getState().setDirty(true);
      expect(useEditorStore.getState().isDirty).toBe(true);
    });
  });
});
