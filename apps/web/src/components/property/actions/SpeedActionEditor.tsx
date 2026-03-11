import type { ScenarioAction, SpeedAction, SpeedTarget } from '@osce/shared';
import { Label } from '../../ui/label';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { EntityRefSelect } from '../EntityRefSelect';
import { EnumSelect } from '../EnumSelect';
import { TransitionDynamicsEditor } from '../TransitionDynamicsEditor';

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
              <EntityRefSelect
                value={relTarget.entityRef}
                onValueChange={(v) =>
                  updateInner({ target: { ...relTarget, entityRef: v } })
                }
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

      <TransitionDynamicsEditor
        elementId={action.id}
        fieldPrefix="action.dynamics"
        dynamics={inner.dynamics}
        onUpdate={(dynamics) => updateInner({ dynamics })}
        unitMap={{ time: 's', distance: 'm', rate: 'm/s²' }}
      />
    </div>
  );
}
