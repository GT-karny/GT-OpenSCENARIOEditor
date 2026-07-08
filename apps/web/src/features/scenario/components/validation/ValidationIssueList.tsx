import type { ValidationIssue } from '@osce/shared';
import { ValidationIssueRow } from './ValidationIssueRow';

interface ValidationIssueListProps {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export function ValidationIssueList({ errors, warnings }: ValidationIssueListProps) {
  if (errors.length === 0 && warnings.length === 0) {
    return (
      <p className="p-4 text-center text-xs text-muted-foreground">No issues found.</p>
    );
  }

  return (
    <div>
      {errors.map((issue, i) => (
        <ValidationIssueRow key={`err-${i}`} issue={issue} />
      ))}
      {warnings.map((issue, i) => (
        <ValidationIssueRow key={`warn-${i}`} issue={issue} />
      ))}
    </div>
  );
}
