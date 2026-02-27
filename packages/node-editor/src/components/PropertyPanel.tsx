/**
 * Property panel that shows and edits properties of the selected element.
 */

import { useContext, useMemo } from 'react';
import type { StoreApi } from 'zustand';
import type {
  Story,
  Act,
  ManeuverGroup,
  ScenarioEvent,
  ScenarioAction,
  Trigger,
  ScenarioEntity,
} from '@osce/shared';
import type { ScenarioStore } from '@osce/scenario-engine';
import { useEditorStore } from '../hooks/use-editor-store.js';
import { ScenarioStoreContext } from './NodeEditorProvider.js';
import { detectElementType } from '../utils/detect-element-type.js';
import { StoryProperties } from './property-editors/StoryProperties.js';
import { ActProperties } from './property-editors/ActProperties.js';
import { ManeuverGroupProperties } from './property-editors/ManeuverGroupProperties.js';
import { EventProperties } from './property-editors/EventProperties.js';
import { ActionProperties } from './property-editors/ActionProperties.js';
import { TriggerProperties } from './property-editors/TriggerProperties.js';
import { EntityProperties } from './property-editors/EntityProperties.js';

export interface PropertyPanelProps {
  className?: string;
}

export function PropertyPanel({ className }: PropertyPanelProps) {
  const selectedIds = useEditorStore((s) => s.selectedElementIds);
  const scenarioStore = useContext(ScenarioStoreContext) as StoreApi<ScenarioStore> | null;

  const selectedElement = useMemo(() => {
    if (!scenarioStore || selectedIds.length === 0) return null;
    const state = scenarioStore.getState();
    return state.getElementById(selectedIds[0]);
  }, [scenarioStore, selectedIds]);

  const elementType = useMemo(() => {
    if (!selectedElement) return null;
    return detectElementType(selectedElement);
  }, [selectedElement]);

  if (selectedIds.length === 0) {
    return (
      <div className={`p-4 text-sm text-gray-400 ${className ?? ''}`}>
        Select an element to view properties
      </div>
    );
  }

  if (selectedIds.length > 1) {
    return (
      <div className={`p-4 text-sm text-gray-500 ${className ?? ''}`}>
        {selectedIds.length} elements selected
      </div>
    );
  }

  if (!selectedElement || !elementType) {
    return (
      <div className={`p-4 text-sm text-gray-400 ${className ?? ''}`}>
        Unknown element
      </div>
    );
  }

  const store = scenarioStore!;

  return (
    <div className={`p-4 overflow-y-auto ${className ?? ''}`}>
      {elementType === 'story' && (
        <StoryProperties
          story={selectedElement as Story}
          onUpdate={(updates) => store.getState().updateStory(selectedIds[0], updates)}
        />
      )}
      {elementType === 'act' && (
        <ActProperties
          act={selectedElement as Act}
          onUpdate={(updates) => store.getState().updateAct(selectedIds[0], updates)}
        />
      )}
      {elementType === 'maneuverGroup' && (
        <ManeuverGroupProperties
          group={selectedElement as ManeuverGroup}
          onUpdate={(updates) => store.getState().updateManeuverGroup(selectedIds[0], updates)}
        />
      )}
      {elementType === 'event' && (
        <EventProperties
          event={selectedElement as ScenarioEvent}
          onUpdate={(updates) => store.getState().updateEvent(selectedIds[0], updates)}
        />
      )}
      {elementType === 'action' && (
        <ActionProperties
          action={selectedElement as ScenarioAction}
          onUpdate={(updates) => store.getState().updateAction(selectedIds[0], updates)}
        />
      )}
      {elementType === 'trigger' && (
        <TriggerProperties trigger={selectedElement as Trigger} />
      )}
      {elementType === 'entity' && (
        <EntityProperties
          entity={selectedElement as ScenarioEntity}
          onUpdate={(updates) => store.getState().updateEntity(selectedIds[0], updates)}
        />
      )}
      {elementType === 'storyboard' && (
        <div className="space-y-3">
          <div className="text-sm font-semibold text-slate-800">Storyboard</div>
          <div className="text-xs text-gray-500">Root element of the scenario</div>
        </div>
      )}
      {elementType === 'init' && (
        <div className="space-y-3">
          <div className="text-sm font-semibold text-emerald-800">Init</div>
          <div className="text-xs text-gray-500">Initial state configuration</div>
        </div>
      )}
    </div>
  );
}
