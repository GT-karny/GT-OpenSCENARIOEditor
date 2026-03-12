import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { ValidationIssueList } from '../validation/ValidationIssueList';
import { useEditorStore } from '../../stores/editor-store';
import { useValidation } from '../../hooks/use-validation';
import { Button } from '../ui/button';
import { CheckCircle } from 'lucide-react';

export function ValidationPanel() {
  const result = useEditorStore((s) => s.validationResult);
  const { runValidation } = useValidation();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2 ml-auto">
          {result && (
            <Badge data-testid="validation-summary" variant={result.valid ? 'secondary' : 'destructive'} className="text-[10px]">
              {result.errors.length}E / {result.warnings.length}W
            </Badge>
          )}
          <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Run validation" onClick={runValidation}>
            <CheckCircle className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="divider-glow" />

      <ScrollArea className="flex-1">
        {result ? (
          <ValidationIssueList errors={result.errors} warnings={result.warnings} />
        ) : (
          <p className="p-4 text-center text-xs text-muted-foreground">
            Click validate to check the scenario
          </p>
        )}
      </ScrollArea>
    </div>
  );
}
