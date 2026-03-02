import { useState, useEffect } from 'react';
import type { ScenarioAction } from '@osce/shared';
import { Label } from '../../ui/label';
import { useScenarioStoreApi } from '../../../stores/use-scenario-store';

interface GenericActionEditorProps {
  action: ScenarioAction;
}

export function GenericActionEditor({ action }: GenericActionEditorProps) {
  const storeApi = useScenarioStoreApi();
  const [text, setText] = useState(() => JSON.stringify(action.action, null, 2));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText(JSON.stringify(action.action, null, 2));
    setError(null);
  }, [action.action]);

  const handleBlur = () => {
    try {
      const parsed = JSON.parse(text) as ScenarioAction['action'];
      setError(null);
      storeApi.getState().updateAction(action.id, { action: parsed } as Partial<ScenarioAction>);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Action Data (JSON)</Label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        spellCheck={false}
        className="w-full min-h-[160px] rounded-md border border-input bg-muted px-3 py-2 text-xs font-mono resize-y focus:outline-none focus:ring-1 focus:ring-ring"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
