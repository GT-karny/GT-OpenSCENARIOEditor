import type { ScenarioAction, SpeedAction, SpeedTarget, TransitionDynamics } from '@osce/shared';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { EnumSelect } from '../EnumSelect';
import { useScenarioStoreApi } from '../../../stores/use-scenario-store';
import { DYNAMICS_SHAPES } from '../../../constants/osc-enum-values';

interface SpeedActionEditorProps {
  action: ScenarioAction;
}

export function SpeedActionEditor({ action }: SpeedActionEditorProps) {
  const storeApi = useScenarioStoreApi();
  const inner = action.action as SpeedAction;
  const relTarget =
    inner.target.kind === 'relative'
      ? (inner.target as Extract<SpeedTarget, { kind: 'relative' }>)
      : null;

  const updateInner = (updates: Partial<SpeedAction>) => {
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
                updateInner({ target: { kind: 'relative', entityRef: '', value: 0, speedTargetValueType: 'delta', continuous: false } });
              }
            }}
            className="h-8 text-sm"
          />
        </div>
        {inner.target.kind === 'absolute' && (
          <div className="grid gap-1">
            <Label className="text-xs">Speed (m/s)</Label>
            <Input
              type="number"
              value={inner.target.value}
              onChange={(e) =>
                updateInner({ target: { kind: 'absolute', value: parseFloat(e.target.value) || 0 } })
              }
              className="h-8 text-sm"
            />
          </div>
        )}
        {relTarget !== null && (
          <>
            <div className="grid gap-1">
              <Label className="text-xs">Entity Ref</Label>
              <ParameterAwareInput
                value={relTarget.entityRef}
                onValueChange={(v) =>
                  updateInner({ target: { ...relTarget, entityRef: v } })
                }
                className="h-8 text-sm"
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Value</Label>
              <Input
                type="number"
                value={relTarget.value}
                onChange={(e) =>
                  updateInner({ target: { ...relTarget, value: parseFloat(e.target.value) || 0 } })
                }
                className="h-8 text-sm"
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Value Type</Label>
              <EnumSelect
                value={relTarget.speedTargetValueType}
                options={['delta', 'factor']}
                onValueChange={(v) =>
                  updateInner({
                    target: { ...relTarget, speedTargetValueType: v as 'delta' | 'factor' },
                  })
                }
                className="h-8 text-sm"
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Continuous</Label>
              <EnumSelect
                value={String(relTarget.continuous)}
                options={['false', 'true']}
                onValueChange={(v) =>
                  updateInner({
                    target: { ...relTarget, continuous: v === 'true' },
                  })
                }
                className="h-8 text-sm"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
