import type { ScenarioAction, EntityAction, Position } from '@osce/shared';
import { Label } from '../../ui/label';
import { EnumSelect } from '../../form/EnumSelect';
import { EntityRefSelect } from '../EntityRefSelect';
import { PositionEditor } from '../PositionEditor';
import { actionBody, actionUpdate } from '../lib/typed-updates';

interface EntityActionEditorProps {
  action: ScenarioAction;
  onUpdate: (partial: Partial<ScenarioAction>) => void;
}

const DEFAULT_WORLD_POSITION: Position = {
  type: 'worldPosition',
  x: 0,
  y: 0,
  z: 0,
  h: 0,
  p: 0,
  r: 0,
};

export function EntityActionEditor({ action, onUpdate }: EntityActionEditorProps) {
  const inner = action.action as EntityAction;

  const updateInner = (updates: Partial<EntityAction>) => {
    onUpdate(actionUpdate(inner, updates));
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-1">
        <Label className="text-xs">Entity Ref</Label>
        <EntityRefSelect
          value={inner.entityRef}
          onValueChange={(v) => updateInner({ entityRef: v })}
        />
      </div>

      <div className="grid gap-1">
        <Label className="text-xs">Action</Label>
        <EnumSelect
          value={inner.actionType}
          options={['addEntity', 'deleteEntity']}
          onValueChange={(v) => {
            const actionType = v as EntityAction['actionType'];
            if (actionType === 'addEntity') {
              updateInner({ actionType, position: inner.position ?? DEFAULT_WORLD_POSITION });
            } else {
              const { position: _, ...rest } = inner;
              onUpdate(actionBody({ ...rest, actionType }));
            }
          }}
          className="h-8 text-sm"
        />
      </div>

      {inner.actionType === 'addEntity' && inner.position && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Spawn Position</p>
          <PositionEditor
            position={inner.position}
            onChange={(p) => updateInner({ position: p })}
          />
        </div>
      )}

      {inner.actionType === 'addEntity' && !inner.position && (
        <button
          onClick={() => updateInner({ position: DEFAULT_WORLD_POSITION })}
          className="text-xs text-primary underline"
        >
          + Set spawn position
        </button>
      )}
    </div>
  );
}
