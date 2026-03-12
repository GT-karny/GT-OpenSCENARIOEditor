import type { ScenarioAction, VariableAction } from '@osce/shared';
import { Label } from '../../ui/label';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { SegmentedControl } from '../SegmentedControl';
import { EnumSelect } from '../EnumSelect';

const ACTION_TYPES = ['set', 'modify'] as const;
const MODIFY_RULES = ['add', 'multiply'] as const;

interface VariableActionEditorProps {
  action: ScenarioAction;
  onUpdate: (partial: Partial<ScenarioAction>) => void;
}

export function VariableActionEditor({ action, onUpdate }: VariableActionEditorProps) {
  const inner = action.action as VariableAction;

  const updateInner = (updates: Partial<VariableAction>) => {
    onUpdate({
      action: { ...inner, ...updates },
    } as Partial<ScenarioAction>);
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-1">
        <Label className="text-xs">Variable Ref</Label>
        <ParameterAwareInput
          elementId={action.id}
          fieldName="action.variableRef"
          value={inner.variableRef}
          onValueChange={(v) => updateInner({ variableRef: v })}
          acceptedTypes={['string']}
          className="h-8 text-sm"
        />
      </div>

      <div className="grid gap-1">
        <Label className="text-xs">Action</Label>
        <SegmentedControl
          value={inner.actionType}
          options={ACTION_TYPES}
          onValueChange={(v) => {
            const actionType = v as VariableAction['actionType'];
            if (actionType === 'set') {
              const { rule: _r, modifyValue: _m, ...rest } = inner;
              onUpdate({
                action: { ...rest, actionType, value: inner.value ?? '' },
              } as Partial<ScenarioAction>);
            } else {
              const { value: _v, ...rest } = inner;
              onUpdate({
                action: {
                  ...rest,
                  actionType,
                  rule: inner.rule ?? 'add',
                  modifyValue: inner.modifyValue ?? 0,
                },
              } as Partial<ScenarioAction>);
            }
          }}
          labels={{ set: 'Set', modify: 'Modify' }}
        />
      </div>

      {inner.actionType === 'set' && (
        <div className="grid gap-1">
          <Label className="text-xs">Value</Label>
          <ParameterAwareInput
            elementId={action.id}
            fieldName="action.value"
            value={inner.value ?? ''}
            onValueChange={(v) => updateInner({ value: v })}
            acceptedTypes={['string', 'double', 'int', 'boolean']}
            className="h-8 text-sm"
          />
        </div>
      )}

      {inner.actionType === 'modify' && (
        <div className="grid grid-cols-[1fr_1.5fr] gap-2">
          <div className="grid gap-1">
            <Label className="text-xs">Rule</Label>
            <EnumSelect
              value={inner.rule ?? 'add'}
              options={[...MODIFY_RULES]}
              onValueChange={(v) => updateInner({ rule: v })}
              className="h-8 text-sm"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-xs">Value</Label>
            <ParameterAwareInput
              elementId={action.id}
              fieldName="action.modifyValue"
              value={inner.modifyValue ?? 0}
              onValueChange={(v) => updateInner({ modifyValue: parseFloat(v) || 0 })}
              acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
              className="h-8 text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}
