import type { DynamicsDimension, DynamicsShape, TransitionDynamics } from '@osce/shared';
import { cn } from '@/lib/utils';
import { ParameterAwareInput } from './ParameterAwareInput';
import { DYNAMICS_DIMENSIONS, DYNAMICS_SHAPES } from '../../constants/osc-enum-values';

/* ------------------------------------------------------------------ */
/*  SVG curve paths for each DynamicsShape (viewBox 0 0 16 16)        */
/* ------------------------------------------------------------------ */

export const SHAPE_PATHS: Record<DynamicsShape, string> = {
  linear: 'M2,14 L14,2',
  cubic: 'M2,14 C2,6 14,10 14,2',
  sinusoidal: 'M2,14 C6,14 6,2 8,2 C10,2 10,14 14,2',
  step: 'M2,14 H8 V2 H14',
};

export const SHAPE_LABELS: Record<DynamicsShape, string> = {
  linear: 'Linear',
  cubic: 'Cubic',
  sinusoidal: 'Sinusoidal',
  step: 'Step',
};

const DEFAULT_UNIT_MAP: Record<DynamicsDimension, string> = {
  time: 's',
  distance: 'm',
  rate: '/s',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface TransitionDynamicsEditorProps {
  elementId: string;
  fieldPrefix: string;
  dynamics: TransitionDynamics;
  onUpdate: (dynamics: TransitionDynamics) => void;
  unitMap?: Record<DynamicsDimension, string>;
}

export function TransitionDynamicsEditor({
  elementId,
  fieldPrefix,
  dynamics,
  onUpdate,
  unitMap = DEFAULT_UNIT_MAP,
}: TransitionDynamicsEditorProps) {
  const updateShape = (shape: DynamicsShape) => {
    onUpdate({ ...dynamics, dynamicsShape: shape });
  };

  const updateDimension = (dim: DynamicsDimension) => {
    onUpdate({ ...dynamics, dynamicsDimension: dim });
  };

  const updateValue = (v: string) => {
    onUpdate({ ...dynamics, value: parseFloat(v) || 0 });
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Transition</p>

      {/* Row 1: Value + Dimension segment */}
      <div className="flex gap-1">
        <ParameterAwareInput
          elementId={elementId}
          fieldName={`${fieldPrefix}.value`}
          value={dynamics.value}
          onValueChange={updateValue}
          acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
          className="h-8 text-sm flex-1 min-w-0"
        />
        <div className="flex gap-0 p-0.5 bg-muted rounded-sm shrink-0">
          {DYNAMICS_DIMENSIONS.map((dim) => (
            <button
              key={dim}
              type="button"
              onClick={() => updateDimension(dim)}
              className={cn(
                'px-2 py-1 text-[10px] font-medium transition-all rounded-sm whitespace-nowrap',
                dynamics.dynamicsDimension === dim
                  ? 'glass-item selected'
                  : 'text-muted-foreground hover:text-foreground hover:bg-[var(--color-glass-hover)]',
              )}
            >
              {unitMap[dim]}
            </button>
          ))}
        </div>
      </div>

      {/* Row 2: Shape — 4 icon buttons */}
      <div className="flex gap-0.5 p-0.5 bg-muted rounded-sm">
        {DYNAMICS_SHAPES.map((shape) => (
          <button
            key={shape}
            type="button"
            title={SHAPE_LABELS[shape]}
            onClick={() => updateShape(shape)}
            className={cn(
              'flex-1 flex items-center justify-center py-1.5 transition-all rounded-sm',
              dynamics.dynamicsShape === shape
                ? 'glass-item selected'
                : 'text-muted-foreground hover:text-foreground hover:bg-[var(--color-glass-hover)]',
            )}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="shrink-0"
            >
              <path
                d={SHAPE_PATHS[shape]}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
