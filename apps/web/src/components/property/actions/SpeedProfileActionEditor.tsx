import type {
  ScenarioAction,
  SpeedProfileAction,
  SpeedProfileEntry,
  DynamicsDimension,
  FollowingMode,
} from '@osce/shared';
import { Label } from '../../ui/label';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { EntityRefSelect } from '../EntityRefSelect';
import { SegmentedControl } from '../SegmentedControl';
import { OptionalFieldWrapper } from '../OptionalFieldWrapper';
import { Plus, Trash2 } from 'lucide-react';
import { useSpeedUnit } from '../../../hooks/use-speed-unit';

const FOLLOWING_MODES = ['follow', 'position'] as const;
const DYNAMICS_DIMENSIONS = ['time', 'distance', 'rate'] as const;

interface SpeedProfileActionEditorProps {
  action: ScenarioAction;
  onUpdate: (partial: Partial<ScenarioAction>) => void;
}

export function SpeedProfileActionEditor({ action, onUpdate }: SpeedProfileActionEditorProps) {
  const inner = action.action as SpeedProfileAction;
  const { label: speedLabel, toDisplay, toInternal } = useSpeedUnit();

  const updateInner = (updates: Partial<SpeedProfileAction>) => {
    onUpdate({
      action: { ...inner, ...updates },
    } as Partial<ScenarioAction>);
  };

  const updateEntry = (index: number, updates: Partial<SpeedProfileEntry>) => {
    const entries = [...inner.entries];
    entries[index] = { ...entries[index], ...updates };
    updateInner({ entries });
  };

  const addEntry = () => {
    updateInner({ entries: [...inner.entries, { speed: 0 }] });
  };

  const removeEntry = (index: number) => {
    updateInner({ entries: inner.entries.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-1">
        <Label className="text-xs">Following Mode</Label>
        <SegmentedControl
          value={inner.followingMode}
          options={FOLLOWING_MODES}
          onValueChange={(v) => updateInner({ followingMode: v as FollowingMode })}
          labels={{ follow: 'Follow', position: 'Position' }}
        />
      </div>

      <OptionalFieldWrapper
        label="Entity Ref"
        hasValue={inner.entityRef !== undefined}
        onClear={() => {
          const { entityRef: _, ...rest } = inner;
          onUpdate({ action: rest } as Partial<ScenarioAction>);
        }}
      >
        <EntityRefSelect
          value={inner.entityRef ?? ''}
          onValueChange={(v) => updateInner({ entityRef: v })}
        />
      </OptionalFieldWrapper>

      <OptionalFieldWrapper
        label="Dynamics Dimension"
        hasValue={inner.dynamicsDimension !== undefined}
        onClear={() => {
          const { dynamicsDimension: _, ...rest } = inner;
          onUpdate({ action: rest } as Partial<ScenarioAction>);
        }}
      >
        <SegmentedControl
          value={inner.dynamicsDimension ?? 'time'}
          options={DYNAMICS_DIMENSIONS}
          onValueChange={(v) => updateInner({ dynamicsDimension: v as DynamicsDimension })}
          labels={{ time: 'Time', distance: 'Distance', rate: 'Rate' }}
        />
      </OptionalFieldWrapper>

      {/* Speed entries */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs">
            Speed Entries ({inner.entries.length})
          </Label>
          <button
            type="button"
            onClick={addEntry}
            className="flex items-center gap-0.5 text-[10px] text-primary hover:underline"
          >
            <Plus className="size-3" />
            Add
          </button>
        </div>

        {inner.entries.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2">
            No entries. Click &quot;Add&quot; to create a speed point.
          </p>
        ) : (
          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            {inner.entries.map((entry, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 rounded-none border border-[var(--color-glass-edge)] px-2 py-1 hover:border-[var(--color-glass-edge-mid)] hover:bg-[var(--color-glass-hover)] transition-colors"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-none bg-[var(--color-glass-2)] text-[10px] font-semibold text-[var(--color-text-secondary)]">
                  #{i + 1}
                </span>
                <ParameterAwareInput
                  elementId={action.id}
                  fieldName={`action.entries[${i}].speed`}
                  value={toDisplay(entry.speed)}
                  placeholder={speedLabel}
                  onValueChange={(v) => updateEntry(i, { speed: toInternal(parseFloat(v) || 0) })}
                  acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
                  className="h-6 text-xs flex-1 min-w-0"
                />
                <span className="text-[10px] text-muted-foreground shrink-0">{speedLabel}</span>
                <ParameterAwareInput
                  elementId={action.id}
                  fieldName={`action.entries[${i}].time`}
                  value={entry.time ?? ''}
                  placeholder="t"
                  onValueChange={(v) => {
                    if (v === '') {
                      const { time: _, ...rest } = entry;
                      const entries = [...inner.entries];
                      entries[i] = rest as SpeedProfileEntry;
                      updateInner({ entries });
                    } else {
                      updateEntry(i, { time: parseFloat(v) || 0 });
                    }
                  }}
                  acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
                  className="h-6 text-xs w-16 shrink-0"
                />
                <span className="text-[10px] text-muted-foreground shrink-0">s</span>
                <button
                  type="button"
                  onClick={() => removeEntry(i)}
                  className="shrink-0 p-0.5 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
