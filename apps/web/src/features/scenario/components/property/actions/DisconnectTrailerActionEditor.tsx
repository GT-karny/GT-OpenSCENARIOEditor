import type { ScenarioAction } from '@osce/shared';

interface DisconnectTrailerActionEditorProps {
  action: ScenarioAction;
  onUpdate: (partial: Partial<ScenarioAction>) => void;
}

export function DisconnectTrailerActionEditor({ action: _, onUpdate: _onUpdate }: DisconnectTrailerActionEditorProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">No additional configuration required.</p>
    </div>
  );
}
