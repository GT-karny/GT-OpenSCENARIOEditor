import type { ScenarioAction, LaneChangeAction } from '@osce/shared';
import { useState } from 'react';
import { Label } from '../../ui/label';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { EntityRefSelect } from '../EntityRefSelect';
import { SegmentedControl } from '../SegmentedControl';
import { TransitionDynamicsEditor } from '../TransitionDynamicsEditor';
import { OptionalFieldWrapper } from '../OptionalFieldWrapper';

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

  const relValue = inner.target.kind === 'relative' ? inner.target.value : 0;
  const isRight = relValue < 0 || Object.is(relValue, -0);
  const [dir, setDir] = useState<'left' | 'right'>(isRight ? 'right' : 'left');
  const currentDir = isRight ? 'right' : relValue > 0 ? 'left' : dir;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Target</p>
        <div className="grid gap-1">
          <Label className="text-xs">
            {inner.target.kind === 'absolute' ? 'Lane ID' : 'Lanes'}
          </Label>
          <div className="flex gap-1">
            {inner.target.kind === 'relative' && (
              <SegmentedControl
                value={currentDir}
                options={['left', 'right'] as const}
                onValueChange={(d) => {
                  setDir(d);
                  const mag = Math.abs(inner.target.value);
                  const signed = d === 'left' ? mag : -mag;
                  updateInner({
                    target: { ...inner.target, value: signed } as typeof inner.target,
                  });
                }}
                labels={{ left: 'Left', right: 'Right' }}
                className="shrink-0"
              />
            )}
            {inner.target.kind === 'absolute' ? (
              <ParameterAwareInput
                elementId={action.id}
                fieldName="action.target.value"
                value={inner.target.value}
                onValueChange={(v) => {
                  updateInner({ target: { kind: 'absolute', value: parseInt(v) || 0 } });
                }}
                acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
                className="h-8 text-sm flex-1 min-w-0"
              />
            ) : (
              <ParameterAwareInput
                elementId={action.id}
                fieldName="action.target.value"
                value={Math.abs(inner.target.value)}
                onValueChange={(v) => {
                  const mag = Math.abs(parseInt(v) || 0);
                  const sign = currentDir === 'left' ? 1 : -1;
                  updateInner({
                    target: { ...inner.target, value: mag * sign } as typeof inner.target,
                  });
                }}
                acceptedTypes={['int', 'unsignedInt', 'unsignedShort']}
                className="h-8 text-sm flex-1 min-w-0"
              />
            )}
            <SegmentedControl
              value={inner.target.kind}
              options={['absolute', 'relative'] as const}
              onValueChange={(v) => {
                if (v === 'absolute') {
                  updateInner({ target: { kind: 'absolute', value: inner.target.value } });
                } else {
                  updateInner({ target: { kind: 'relative', entityRef: '', value: inner.target.value } });
                }
              }}
              labels={{ absolute: 'Abs', relative: 'Rel' }}
              className="shrink-0"
            />
          </div>
        </div>
        {inner.target.kind === 'relative' && (
          <div className="grid gap-1">
            <Label className="text-xs">Entity Ref</Label>
            <EntityRefSelect
              value={inner.target.entityRef}
              onValueChange={(v) =>
                updateInner({ target: { ...inner.target, entityRef: v } as typeof inner.target })
              }
            />
          </div>
        )}
      </div>

      <OptionalFieldWrapper
        label="Target Lane Offset (m)"
        hasValue={inner.targetLaneOffset !== undefined}
        onClear={() => updateInner({ targetLaneOffset: undefined })}
      >
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
      </OptionalFieldWrapper>

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
