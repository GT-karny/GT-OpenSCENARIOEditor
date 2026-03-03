import { useTranslation } from '@osce/i18n';
import type { ParameterAssignment, ParameterDeclaration } from '@osce/shared';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface ParameterAssignmentEditorProps {
  declarations: ParameterDeclaration[];
  assignments: ParameterAssignment[];
  onAssignmentsChange: (assignments: ParameterAssignment[]) => void;
}

export function ParameterAssignmentEditor({
  declarations,
  assignments,
  onAssignmentsChange,
}: ParameterAssignmentEditorProps) {
  const { t } = useTranslation('common');

  if (declarations.length === 0) return null;

  const assignmentMap = new Map(assignments.map((a) => [a.parameterRef, a.value]));

  const handleChange = (paramName: string, value: string) => {
    const updated = assignments.filter((a) => a.parameterRef !== paramName);
    if (value !== '') {
      updated.push({ parameterRef: paramName, value });
    }
    onAssignmentsChange(updated);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{t('catalog.parameterOverrides')}</p>
      {declarations.map((decl) => {
        const override = assignmentMap.get(decl.name) ?? '';
        return (
          <div key={decl.name} className="grid gap-1">
            <Label className="text-[10px] flex items-center gap-2">
              <span>{decl.name}</span>
              <span className="text-muted-foreground">({decl.parameterType})</span>
              <span className="text-muted-foreground">
                default: {decl.value}
              </span>
            </Label>
            <Input
              value={override}
              placeholder={t('catalog.usingDefault')}
              onChange={(e) => handleChange(decl.name, e.target.value)}
              className="h-7 text-xs"
            />
          </div>
        );
      })}
    </div>
  );
}
