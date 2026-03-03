import type { ScenarioAction, LaneChangeAction, TransitionDynamics } from '@osce/shared';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { EnumSelect } from '../EnumSelect';
import { useScenarioStoreApi } from '../../../stores/use-scenario-store';
import { DYNAMICS_SHAPES } from '../../../constants/osc-enum-values';

interface LaneChangeActionEditorProps {
  action: ScenarioAction;
}

export function LaneChangeActionEditor({ action }: LaneChangeActionEditorProps) {
  const storeApi = useScenarioStoreApi();
  const inner = action.action as LaneChangeAction;

  const updateInner = (updates: Partial<LaneChangeAction>) => {
    storeApi.getState().updateAction(action.id, {
      action: { ...inner, ...updates },
    } as Partial<ScenarioAction>);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Dynamics</p>
        <div className="grid gap-1">
          <Label className="text-xs">Shape</Label>
          <EnumSelect
            value={inner.dynamics.dynamicsShape}
            options={DYNAMICS_SHAPES}
            onValueChange={(v) =>
              updateInner({ dynamics: { ...inner.dynamics, dynamicsShape: v as TransitionDynamics['dynamicsShape'] } })
            }
            className="h-8 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Dimension</Label>
          <EnumSelect
            value={inner.dynamics.dynamicsDimension}
            options={['distance', 'rate', 'time']}
            onValueChange={(v) =>
              updateInner({ dynamics: { ...inner.dynamics, dynamicsDimension: v as TransitionDynamics['dynamicsDimension'] } })
            }
            className="h-8 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Value</Label>
          <Input
            type="number"
            value={inner.dynamics.value}
            onChange={(e) =>
              updateInner({ dynamics: { ...inner.dynamics, value: parseFloat(e.target.value) || 0 } })
            }
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Target</p>
        <div className="grid gap-1">
          <Label className="text-xs">Kind</Label>
          <EnumSelect
            value={inner.target.kind}
            options={['absolute', 'relative']}
            onValueChange={(v) => {
              if (v === 'absolute') {
                updateInner({ target: { kind: 'absolute', value: 0 } });
              } else {
                updateInner({ target: { kind: 'relative', entityRef: '', value: 0 } });
              }
            }}
            className="h-8 text-sm"
          />
        </div>
        {inner.target.kind === 'absolute' && (
          <div className="grid gap-1">
            <Label className="text-xs">Lane (relative to current)</Label>
            <Input
              type="number"
              value={inner.target.value}
              onChange={(e) =>
                updateInner({ target: { kind: 'absolute', value: parseInt(e.target.value) || 0 } })
              }
              className="h-8 text-sm"
            />
          </div>
        )}
        {inner.target.kind === 'relative' && (
          <>
            <div className="grid gap-1">
              <Label className="text-xs">Entity Ref</Label>
              <ParameterAwareInput
                value={inner.target.entityRef}
                onValueChange={(v) =>
                  updateInner({ target: { ...inner.target, entityRef: v } as typeof inner.target })
                }
                className="h-8 text-sm"
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Lane Offset</Label>
              <Input
                type="number"
                value={inner.target.value}
                onChange={(e) =>
                  updateInner({ target: { ...inner.target, value: parseInt(e.target.value) || 0 } as typeof inner.target })
                }
                className="h-8 text-sm"
              />
            </div>
          </>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Options</p>
        <div className="grid gap-1">
          <Label className="text-xs">Target Lane Offset (optional)</Label>
          <Input
            type="number"
            value={inner.targetLaneOffset ?? ''}
            placeholder="—"
            step="any"
            onChange={(e) =>
              updateInner({
                targetLaneOffset: e.target.value !== '' ? parseFloat(e.target.value) : undefined,
              })
            }
            className="h-8 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
