import type { ScenarioAction, LaneChangeAction } from '@osce/shared';
import { Label } from '../../ui/label';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { EntityRefSelect } from '../EntityRefSelect';
import { EnumSelect } from '../EnumSelect';
import { TransitionDynamicsEditor } from '../TransitionDynamicsEditor';

interface LaneChangeActionEditorProps {
  action: ScenarioAction;
  onUpdate: (partial: Partial<ScenarioAction>) => void;
}

export function LaneChangeActionEditor({ action, onUpdate }: LaneChangeActionEditorProps) {
  const inner = action.action as LaneChangeAction;

  const updateInner = (updates: Partial<LaneChangeAction>) => {
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
                updateInner({ target: { kind: 'relative', entityRef: '', value: 0 } });
              }
            }}
            className="h-8 text-sm"
          />
        </div>
        {inner.target.kind === 'absolute' && (
          <div className="grid gap-1">
            <Label className="text-xs">Lane (relative to current)</Label>
            <ParameterAwareInput
              elementId={action.id}
              fieldName="action.target.value"
              value={inner.target.value}
              onValueChange={(v) =>
                updateInner({ target: { kind: 'absolute', value: parseInt(v) || 0 } })
              }
              acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
              className="h-8 text-sm"
            />
          </div>
        )}
        {inner.target.kind === 'relative' && (
          <>
            <div className="grid gap-1">
              <Label className="text-xs">Entity Ref</Label>
              <EntityRefSelect
                value={inner.target.entityRef}
                onValueChange={(v) =>
                  updateInner({ target: { ...inner.target, entityRef: v } as typeof inner.target })
                }
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Lane Offset</Label>
              <ParameterAwareInput
                elementId={action.id}
                fieldName="action.target.value"
                value={inner.target.value}
                onValueChange={(v) =>
                  updateInner({ target: { ...inner.target, value: parseInt(v) || 0 } as typeof inner.target })
                }
                acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
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
          <ParameterAwareInput
            elementId={action.id}
            fieldName="action.targetLaneOffset"
            value={inner.targetLaneOffset ?? ''}
            placeholder="—"
            onValueChange={(v) =>
              updateInner({
                targetLaneOffset: v !== '' ? parseFloat(v) : undefined,
              })
            }
            acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
            className="h-8 text-sm"
          />
        </div>
      </div>

      <TransitionDynamicsEditor
        elementId={action.id}
        fieldPrefix="action.dynamics"
        dynamics={inner.dynamics}
        onUpdate={(dynamics) => updateInner({ dynamics })}
        unitMap={{ time: 's', distance: 'm', rate: 'm/s' }}
      />
    </div>
  );
}
