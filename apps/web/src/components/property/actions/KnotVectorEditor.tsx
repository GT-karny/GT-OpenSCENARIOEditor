import { Plus, Trash2 } from 'lucide-react';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';

export interface KnotVectorEditorProps {
  knots: number[];
  expectedLength?: number;
  onChange: (knots: number[]) => void;
}

export function KnotVectorEditor({ knots, expectedLength, onChange }: KnotVectorEditorProps) {
  const isValid = expectedLength === undefined || knots.length === expectedLength;

  const handleKnotChange = (index: number, value: string) => {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) return;
    const updated = [...knots];
    updated[index] = parsed;
    onChange(updated);
  };

  const handleAdd = () => {
    const lastVal = knots.length > 0 ? knots[knots.length - 1] : 0;
    onChange([...knots, lastVal]);
  };

  const handleRemove = (index: number) => {
    onChange(knots.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-xs">
          Knots ({knots.length})
        </Label>
        <button
          type="button"
          className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
          onClick={handleAdd}
          title="Add knot"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {!isValid && expectedLength !== undefined && (
        <p className="text-[10px] text-[var(--color-warning)]">
          Expected {expectedLength} knots (controlPoints + order), got {knots.length}
        </p>
      )}

      <div className="flex flex-wrap gap-1">
        {knots.map((knot, i) => (
          <div key={i} className="flex items-center gap-0.5 group">
            <Input
              value={knot}
              onChange={(e) => handleKnotChange(i, e.target.value)}
              className="h-6 w-[52px] text-[10px] text-center px-1"
            />
            <button
              type="button"
              className="p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
              onClick={() => handleRemove(i)}
              title="Remove knot"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
