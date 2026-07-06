import type { ScenarioAction, VariableAction, ModifyRule } from '@osce/shared';
import { Label } from '../../../../../components/ui/label';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { SegmentedControl } from '../SegmentedControl';
import { actionBody, actionUpdate } from '../lib/typed-updates';

const ACTION_TYPES = ['set', 'modify'] as const;
// Values match the XSD VariableModifyRule choice (AddValue | MultiplyByValue).
const MODIFY_RULES: readonly ModifyRule[] = ['addValue', 'multiplyByValue'];
const MODIFY_RULE_LABELS: Record<ModifyRule, string> = {
  addValue: 'Add',
  multiplyByValue: 'Multiply',
};

interface VariableActionEditorProps {
  action: ScenarioAction;
  onUpdate: (partial: Partial<ScenarioAction>) => void;
}

export function VariableActionEditor({ action, onUpdate }: VariableActionEditorProps) {
  const inner = action.action as VariableAction;

  const updateInner = (updates: Partial<VariableAction>) => {
    onUpdate(actionUpdate(inner, updates));
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-1">
        <Label className="text-xs">Variable Ref</Label>
        <ParameterAwareInput
          elementId={action.id}
          fieldName="variableRef"
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
              onUpdate(actionBody({ ...rest, actionType, value: inner.value ?? '' }));
            } else {
              const { value: _v, ...rest } = inner;
              onUpdate(
                actionBody({
                  ...rest,
                  actionType,
                  rule: inner.rule ?? 'addValue',
                  modifyValue: inner.modifyValue ?? 0,
                }),
              );
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
            fieldName="value"
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
            <SegmentedControl
              value={inner.rule ?? 'addValue'}
              options={MODIFY_RULES}
              onValueChange={(v) => updateInner({ rule: v })}
              labels={MODIFY_RULE_LABELS}
              className="h-8"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-xs">Value</Label>
            <ParameterAwareInput
              elementId={action.id}
              fieldName="modifyValue"
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
