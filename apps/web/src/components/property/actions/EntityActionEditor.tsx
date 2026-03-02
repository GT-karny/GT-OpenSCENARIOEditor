import type { ScenarioAction, EntityAction, Position } from '@osce/shared';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { EnumSelect } from '../EnumSelect';
import { PositionEditor } from '../PositionEditor';
import { useScenarioStoreApi } from '../../../stores/use-scenario-store';

interface EntityActionEditorProps {
  action: ScenarioAction;
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

export function EntityActionEditor({ action }: EntityActionEditorProps) {
  const storeApi = useScenarioStoreApi();
  const inner = action.action as EntityAction;

  const updateInner = (updates: Partial<EntityAction>) => {
    storeApi.getState().updateAction(action.id, {
      action: { ...inner, ...updates },
    } as Partial<ScenarioAction>);
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-1">
        <Label className="text-xs">Entity Ref</Label>
        <Input
          value={inner.entityRef}
          placeholder="entity name"
          onChange={(e) => updateInner({ entityRef: e.target.value })}
          className="h-8 text-sm"
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
              storeApi.getState().updateAction(action.id, {
                action: { ...rest, actionType },
              } as Partial<ScenarioAction>);
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
