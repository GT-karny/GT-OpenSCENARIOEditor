import type { ValidationIssue } from '@osce/shared';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { useEditorStore } from '../../stores/editor-store';

interface ValidationIssueRowProps {
  issue: ValidationIssue;
}

export function ValidationIssueRow({ issue }: ValidationIssueRowProps) {
  const setSelection = useEditorStore((s) => s.setSelection);

  const handleClick = () => {
    if (issue.elementId) {
      setSelection({ selectedElementIds: [issue.elementId] });
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-full text-left px-3 py-2 hover:bg-accent transition-colors border-b last:border-b-0"
    >
      <div className="flex items-start gap-2">
        {issue.severity === 'error' ? (
          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
        )}
        <div className="min-w-0">
          <p className="text-xs">{issue.message}</p>
          <p className="text-[10px] text-muted-foreground truncate">{issue.path}</p>
        </div>
      </div>
    </button>
  );
}
