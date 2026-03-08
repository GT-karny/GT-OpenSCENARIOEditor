import type { ScenarioAction, SpeedAction, SpeedTarget, TransitionDynamics } from '@osce/shared';
import { Label } from '../../ui/label';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { EnumSelect } from '../EnumSelect';
import { DYNAMICS_SHAPES } from '../../../constants/osc-enum-values';

interface SpeedActionEditorProps {
  action: ScenarioAction;
  onUpdate: (partial: Partial<ScenarioAction>) => void;
}

export function SpeedActionEditor({ action, onUpdate }: SpeedActionEditorProps) {
  const inner = action.action as SpeedAction;
  const relTarget =
    inner.target.kind === 'relative'
      ? (inner.target as Extract<SpeedTarget, { kind: 'relative' }>)
      : null;

  const updateInner = (updates: Partial<SpeedAction>) => {
    onUpdate({
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
          <ParameterAwareInput
            elementId={action.id}
            fieldName="action.dynamics.value"
            value={inner.dynamics.value}
            onValueChange={(v) =>
              updateInner({ dynamics: { ...inner.dynamics, value: parseFloat(v) || 0 } })
            }
            acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
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
            <ParameterAwareInput
              elementId={action.id}
              fieldName="action.target.value"
              value={inner.target.value}
              onValueChange={(v) =>
                updateInner({ target: { kind: 'absolute', value: parseFloat(v) || 0 } })
              }
              acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
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
                acceptedTypes={['string']}
                className="h-8 text-sm"
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Value</Label>
              <ParameterAwareInput
                elementId={action.id}
                fieldName="action.target.value"
                value={relTarget.value}
                onValueChange={(v) =>
                  updateInner({ target: { ...relTarget, value: parseFloat(v) || 0 } })
                }
                acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
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
