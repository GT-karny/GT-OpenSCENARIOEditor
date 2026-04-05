import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Slider } from '../../ui/slider';
import { generateKnots, inferBiasSpread } from '../../../lib/nurbs-knot-utils';

// Re-export for consumers
export { generateKnots, generateClampedUniformKnots } from '../../../lib/nurbs-knot-utils';

export interface KnotVectorEditorProps {
  knots: number[];
  order: number;
  controlPointCount: number;
  onChange: (knots: number[]) => void;
}

// ---------------------------------------------------------------------------
// Custom mode: single knot input (decimal-safe)
// ---------------------------------------------------------------------------

function KnotInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [localValue, setLocalValue] = useState(String(value));

  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  const commit = useCallback(() => {
    const parsed = parseFloat(localValue);
    if (!isNaN(parsed)) {
      onChange(parsed);
    } else {
      setLocalValue(String(value));
    }
  }, [localValue, onChange, value]);

  return (
    <Input
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          commit();
          (e.target as HTMLInputElement).blur();
        }
      }}
      className="h-6 w-[52px] text-[10px] text-center px-1"
    />
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

type KnotMode = 'auto' | 'custom';

export function KnotVectorEditor({
  knots,
  order,
  controlPointCount,
  onChange,
}: KnotVectorEditorProps) {
  const expectedLength = controlPointCount > 0 ? controlPointCount + order : 0;

  // Infer slider state from existing knots
  const inferred = useMemo(
    () => inferBiasSpread(knots, controlPointCount, order),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [knots.join(','), controlPointCount, order],
  );

  const [mode, setMode] = useState<KnotMode>(
    inferred ? 'auto' : knots.length > 0 ? 'custom' : 'auto',
  );
  const [bias, setBias] = useState(inferred?.bias ?? 0.5);
  const [spread, setSpread] = useState(inferred?.spread ?? 0);

  // Sync inferred values when knots change externally in auto mode
  useEffect(() => {
    if (inferred && mode === 'auto') {
      setBias(inferred.bias);
      setSpread(inferred.spread);
    }
  }, [inferred, mode]);

  // --- Slider handlers ---
  const handleBiasChange = useCallback(
    (values: number[]) => {
      const newBias = values[0];
      setBias(newBias);
      if (controlPointCount < 2) return;
      onChange(generateKnots(controlPointCount, order, newBias, spread));
    },
    [controlPointCount, order, spread, onChange],
  );

  const handleSpreadChange = useCallback(
    (values: number[]) => {
      const newSpread = values[0];
      setSpread(newSpread);
      if (controlPointCount < 2) return;
      onChange(generateKnots(controlPointCount, order, bias, newSpread));
    },
    [controlPointCount, order, bias, onChange],
  );

  const handleModeSwitch = useCallback(
    (newMode: KnotMode) => {
      setMode(newMode);
      if (newMode === 'auto' && controlPointCount >= 2) {
        onChange(generateKnots(controlPointCount, order, bias, spread));
      }
    },
    [controlPointCount, order, bias, spread, onChange],
  );

  // --- Custom mode handlers ---
  const handleKnotChange = useCallback(
    (index: number, value: number) => {
      const updated = [...knots];
      updated[index] = value;
      onChange(updated);
    },
    [knots, onChange],
  );

  const handleAdd = useCallback(() => {
    const lastVal = knots.length > 0 ? knots[knots.length - 1] : 0;
    onChange([...knots, lastVal]);
  }, [knots, onChange]);

  const handleRemove = useCallback(
    (index: number) => {
      onChange(knots.filter((_, i) => i !== index));
    },
    [knots, onChange],
  );

  // Format knot vector as display string
  const knotDisplay = knots
    .map((k) => {
      if (Number.isInteger(k)) return k.toString();
      const s = k.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
      return s;
    })
    .join(', ');

  const isValidLength = expectedLength === 0 || knots.length === expectedLength;

  return (
    <div className="space-y-1.5">
      {/* Header with mode toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-xs">Knots ({knots.length})</Label>
        <div className="flex gap-0.5">
          <button
            type="button"
            className={`px-1.5 py-0.5 text-[10px] transition-colors ${
              mode === 'auto'
                ? 'bg-[var(--color-accent-dim)] text-[var(--color-accent)]'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => handleModeSwitch('auto')}
          >
            Auto
          </button>
          <button
            type="button"
            className={`px-1.5 py-0.5 text-[10px] transition-colors ${
              mode === 'custom'
                ? 'bg-[var(--color-accent-dim)] text-[var(--color-accent)]'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => handleModeSwitch('custom')}
          >
            Custom
          </button>
        </div>
      </div>

      {!isValidLength && expectedLength > 0 && (
        <p className="text-[10px] text-[var(--color-warning)]">
          Expected {expectedLength} knots (controlPoints + order), got {knots.length}
        </p>
      )}

      {mode === 'auto' ? (
        <div className="space-y-2">
          {controlPointCount < 2 ? (
            <p className="text-[10px] text-muted-foreground">
              Add control points to generate knots
            </p>
          ) : (
            <>
              {/* Bias slider: where the 0→1 transition is */}
              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Bias</span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {bias.toFixed(2)}
                  </span>
                </div>
                <Slider
                  value={[bias]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={handleBiasChange}
                />
              </div>

              {/* Spread slider: how gradual the transition is */}
              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Spread</span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {spread.toFixed(2)}
                  </span>
                </div>
                <Slider
                  value={[spread]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={handleSpreadChange}
                />
              </div>
            </>
          )}

          {/* Read-only knot preview */}
          {knots.length > 0 && (
            <p className="text-[10px] text-muted-foreground font-mono break-all leading-relaxed">
              [{knotDisplay}]
            </p>
          )}
        </div>
      ) : (
        /* Custom mode: manual knot editing */
        <div className="space-y-1">
          <div className="flex flex-wrap gap-1">
            {knots.map((knot, i) => (
              <div key={i} className="flex items-center gap-0.5 group">
                <KnotInput
                  value={knot}
                  onChange={(v) => handleKnotChange(i, v)}
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
          <button
            type="button"
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            onClick={handleAdd}
          >
            <Plus className="h-3 w-3" />
            Add knot
          </button>
        </div>
      )}
    </div>
  );
}
