import type { ScenarioAction, SpeedAction, SpeedTarget } from '@osce/shared';
import { Label } from '../../ui/label';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { EntityRefSelect } from '../EntityRefSelect';
import { SegmentedControl } from '../SegmentedControl';
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
          <SegmentedControl
            value={inner.target.kind}
            options={['absolute', 'relative'] as const}
            onValueChange={(v) => {
              if (v === 'absolute') {
                updateInner({ target: { kind: 'absolute', value: 0 } });
              } else {
                updateInner({ target: { kind: 'relative', entityRef: '', value: 0, speedTargetValueType: 'delta', continuous: false } });
              }
            }}
            labels={{ absolute: 'Absolute', relative: 'Relative' }}
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
              <div className="flex gap-1">
                <ParameterAwareInput
                  elementId={action.id}
                  fieldName="action.target.value"
                  value={relTarget.value}
                  onValueChange={(v) =>
                    updateInner({ target: { ...relTarget, value: parseFloat(v) || 0 } })
                  }
                  acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
                  className="h-8 text-sm flex-1 min-w-0"
                />
                <SegmentedControl
                  value={relTarget.speedTargetValueType}
                  options={['delta', 'factor'] as const}
                  onValueChange={(v) =>
                    updateInner({
                      target: { ...relTarget, speedTargetValueType: v },
                    })
                  }
                  className="shrink-0"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={relTarget.continuous}
                onChange={(e) =>
                  updateInner({
                    target: { ...relTarget, continuous: e.target.checked },
                  })
                }
              />
              Continuous
            </label>
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
