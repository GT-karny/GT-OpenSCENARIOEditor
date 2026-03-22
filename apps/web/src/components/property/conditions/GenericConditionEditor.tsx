import { useState, useEffect } from 'react';
import type { Condition, ByEntityCondition, ByValueCondition } from '@osce/shared';
import { Label } from '../../ui/label';

interface GenericConditionEditorProps {
  condition: Condition;
  onUpdate: (conditionId: string, partial: Partial<Condition>) => void;
}

export function GenericConditionEditor({ condition, onUpdate }: GenericConditionEditorProps) {
  const inner = condition.condition;

  const innerBody = inner.kind === 'byEntity' ? inner.entityCondition : inner.valueCondition;
  const [text, setText] = useState(() => JSON.stringify(innerBody, null, 2));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const body = inner.kind === 'byEntity' ? inner.entityCondition : inner.valueCondition;
    setText(JSON.stringify(body, null, 2));
    setError(null);
  }, [inner]);

  const handleBlur = () => {
    try {
      const parsed = JSON.parse(text);
      setError(null);
      let newConditionBody: ByEntityCondition | ByValueCondition;
      if (inner.kind === 'byEntity') {
        newConditionBody = { ...inner, entityCondition: parsed } as ByEntityCondition;
      } else {
        newConditionBody = { ...inner, valueCondition: parsed } as ByValueCondition;
      }
      onUpdate(condition.id, {
        condition: newConditionBody,
      } as Partial<Condition>);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Condition Data (JSON)</Label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        spellCheck={false}
        className="w-full min-h-[120px] rounded-none border border-input bg-muted px-3 py-2 text-xs font-mono resize-y focus:outline-none focus:ring-1 focus:ring-ring"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
