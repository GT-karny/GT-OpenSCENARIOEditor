import { useCallback } from 'react';
import type { OdrLaneSection } from '@osce/shared';
import { cn } from '@/lib/utils';
import { SPositionSlider } from '../SPositionSlider';

interface CrossSectionToolbarProps {
  /** Current s-position along the road */
  sPosition: number;
  /** Total road length */
  roadLength: number;
  /** Callback when s-position changes */
  onSPositionChange: (s: number) => void;
  /** All lane sections of the road */
  laneSections: OdrLaneSection[];
  /** Index of the currently active lane section */
  activeLaneSectionIndex: number;
  /** Callback when lane section selection changes */
  onLaneSectionChange?: (index: number) => void;
  /** Currently selected lane ID */
  selectedLaneId?: number | null;
  /** Callback to add a lane on the left side */
  onAddLaneLeft?: () => void;
  /** Callback to add a lane on the right side */
  onAddLaneRight?: () => void;
  /** Callback to delete the selected lane */
  onDeleteSelectedLane?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Toolbar for the cross-section editor.
 * Contains s-position slider, lane section selector, and lane editing buttons.
 */
export function CrossSectionToolbar({
  sPosition,
  roadLength,
  onSPositionChange,
  laneSections,
  activeLaneSectionIndex,
  onLaneSectionChange,
  selectedLaneId,
  onAddLaneLeft,
  onAddLaneRight,
  onDeleteSelectedLane,
  className,
}: CrossSectionToolbarProps) {
  const handleSectionChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onLaneSectionChange?.(parseInt(e.target.value, 10));
    },
    [onLaneSectionChange],
  );

  const hasSelection = selectedLaneId != null && selectedLaneId !== 0;

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-1.5 border-b border-[var(--color-glass-edge)]',
        'bg-[var(--color-glass-1)]',
        className,
      )}
    >
      {/* S-Position slider */}
      <div className="flex-1 min-w-0">
        <SPositionSlider value={sPosition} roadLength={roadLength} onChange={onSPositionChange} />
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-[var(--color-glass-edge-mid)]" />

      {/* Lane section selector */}
      {laneSections.length > 1 && (
        <>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">
              Section
            </span>
            <select
              value={activeLaneSectionIndex}
              onChange={handleSectionChange}
              className="h-6 px-1.5 text-[11px] font-mono bg-transparent border border-input rounded-none text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
            >
              {laneSections.map((section, i) => (
                <option key={i} value={i} className="bg-[var(--color-bg-deep)]">
                  {i} (s={section.s.toFixed(1)})
                </option>
              ))}
            </select>
          </div>
          <div className="w-px h-5 bg-[var(--color-glass-edge-mid)]" />
        </>
      )}

      {/* Lane editing buttons */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onAddLaneLeft}
          disabled={!onAddLaneLeft}
          title="Add lane (left side)"
          className={cn(
            'h-6 px-2 text-[10px] font-display uppercase tracking-wider',
            'border border-[var(--color-glass-edge)] rounded-none',
            'text-muted-foreground hover:text-foreground',
            'hover:bg-[var(--color-glass-hover)] hover:border-[var(--color-glass-edge-mid)]',
            'disabled:opacity-30 disabled:pointer-events-none',
            'transition-all duration-150',
          )}
        >
          + Left
        </button>
        <button
          type="button"
          onClick={onAddLaneRight}
          disabled={!onAddLaneRight}
          title="Add lane (right side)"
          className={cn(
            'h-6 px-2 text-[10px] font-display uppercase tracking-wider',
            'border border-[var(--color-glass-edge)] rounded-none',
            'text-muted-foreground hover:text-foreground',
            'hover:bg-[var(--color-glass-hover)] hover:border-[var(--color-glass-edge-mid)]',
            'disabled:opacity-30 disabled:pointer-events-none',
            'transition-all duration-150',
          )}
        >
          + Right
        </button>
        <button
          type="button"
          onClick={onDeleteSelectedLane}
          disabled={!hasSelection || !onDeleteSelectedLane}
          title={hasSelection ? `Delete lane ${selectedLaneId}` : 'Select a lane to delete'}
          className={cn(
            'h-6 px-2 text-[10px] font-display uppercase tracking-wider',
            'border border-[var(--color-glass-edge)] rounded-none',
            'text-muted-foreground',
            hasSelection
              ? 'hover:text-destructive hover:border-destructive/30 hover:bg-destructive/10'
              : '',
            'disabled:opacity-30 disabled:pointer-events-none',
            'transition-all duration-150',
          )}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
