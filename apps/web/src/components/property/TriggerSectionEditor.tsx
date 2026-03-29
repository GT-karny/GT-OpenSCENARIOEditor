import { Fragment } from 'react';
import { useTranslation } from '@osce/i18n';
import { Plus, X, Zap } from 'lucide-react';
import type { Trigger, Condition, ConditionGroup } from '@osce/shared';
import { cn } from '../../lib/utils';
import { useScenarioStore } from '../../stores/use-scenario-store';
import { getConditionShortSummary } from '../scene-composer/trigger-summary';
import { ConditionItem } from './ConditionPropertyEditor';

interface TriggerSectionEditorProps {
  trigger: Trigger;
  selectedConditionId: string | null;
  onSelectCondition: (conditionId: string | null) => void;
  onUpdateCondition: (conditionId: string, partial: Partial<Condition>) => void;
  onAddCondition: (groupId: string) => void;
  onRemoveCondition: (conditionId: string) => void;
  onAddOrGroup: () => void;
  onRemoveGroup: (groupId: string) => void;
}

/**
 * Section-based trigger editor shared by EventPropertyEditor and ManeuverEventPanel.
 * Each ConditionGroup is a visual section separated by OR dividers.
 * Clicking a condition selects it and shows its properties below.
 */
export function TriggerSectionEditor({
  trigger,
  selectedConditionId,
  onSelectCondition,
  onUpdateCondition,
  onAddCondition,
  onRemoveCondition,
  onAddOrGroup,
  onRemoveGroup,
}: TriggerSectionEditorProps) {
  const { t } = useTranslation('composer');
  const groups = trigger.conditionGroups;
  const hasConditions = groups.some((g) => g.conditions.length > 0);

  const selectedCondition = findCondition(trigger, selectedConditionId);

  const handleRemoveCondition = (conditionId: string) => {
    if (selectedConditionId === conditionId) {
      onSelectCondition(null);
    }
    onRemoveCondition(conditionId);
  };

  const handleRemoveGroup = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (group && selectedConditionId) {
      const isSelectedInGroup = group.conditions.some((c) => c.id === selectedConditionId);
      if (isSelectedInGroup) {
        onSelectCondition(null);
      }
    }
    onRemoveGroup(groupId);
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <Zap className="h-3 w-3" />
          Start Conditions
        </p>
      </div>

      {/* Condition list panel */}
      <div className="glass rounded-none p-2 space-y-1.5">
        {!hasConditions ? (
          <p className="text-[11px] text-muted-foreground italic px-1">
            {t('trigger.noConditions')}
          </p>
        ) : (
          groups.map((group, gi) => (
            <Fragment key={group.id}>
              {gi > 0 && (
                <div className="flex justify-start px-1">
                  <span className="text-[9px] font-semibold text-[var(--color-accent-vivid)]">
                    OR
                  </span>
                </div>
              )}
              <ConditionGroupSection
                group={group}
                selectedConditionId={selectedConditionId}
                onSelectCondition={onSelectCondition}
                onAddCondition={() => onAddCondition(group.id)}
                onRemoveCondition={handleRemoveCondition}
                onRemoveGroup={() => handleRemoveGroup(group.id)}
                t={t}
              />
            </Fragment>
          ))
        )}

        {/* Add OR Group button */}
        <button
          type="button"
          onClick={onAddOrGroup}
          className="flex items-center gap-1 text-[10px] text-[var(--color-accent-vivid)] hover:opacity-80 transition-opacity"
        >
          <Plus className="h-3 w-3" />
          {t('trigger.addOrGroup')}
        </button>
      </div>

      {/* Selected condition editor */}
      {selectedCondition ? (
        <div className="pt-2 border-t border-[var(--color-glass-edge)]">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 px-1">
            {t('trigger.conditionDetail')}
          </p>
          <ConditionItem
            condition={selectedCondition}
            onUpdateCondition={onUpdateCondition}
          />
        </div>
      ) : hasConditions ? (
        <p className="text-[10px] text-muted-foreground italic px-1 pt-1">
          {t('trigger.selectCondition')}
        </p>
      ) : null}
    </div>
  );
}

// ── Internal components ──────────────────────────────────────────

interface ConditionGroupSectionProps {
  group: ConditionGroup;
  selectedConditionId: string | null;
  onSelectCondition: (conditionId: string) => void;
  onAddCondition: () => void;
  onRemoveCondition: (conditionId: string) => void;
  onRemoveGroup: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (...args: any[]) => string;
}

function ConditionGroupSection({
  group,
  selectedConditionId,
  onSelectCondition,
  onAddCondition,
  onRemoveCondition,
  onRemoveGroup,
  t,
}: ConditionGroupSectionProps) {
  const bindings = useScenarioStore((s) => s.document._editor.parameterBindings);
  return (
    <div className="group/grp relative rounded border border-[var(--color-glass-edge)] bg-[var(--color-glass-2)]/20 p-1 space-y-0.5">
      {/* Group delete button — top-right corner */}
      <button
        type="button"
        onClick={onRemoveGroup}
        className="absolute -top-1.5 -right-1.5 z-10 p-0.5 rounded-full bg-[var(--color-glass-1)] border border-[var(--color-glass-edge)] opacity-0 group-hover/grp:opacity-100 text-muted-foreground hover:text-destructive transition-all"
        title={t('trigger.removeGroup')}
      >
        <X className="h-2.5 w-2.5" />
      </button>
        {group.conditions.map((condition, ci) => (
          <div
            key={condition.id}
            className={cn(
              'flex items-center justify-between px-2 py-1 rounded cursor-pointer transition-colors group/cond',
              selectedConditionId === condition.id
                ? 'bg-[var(--color-accent-1)]/10 border border-[var(--color-accent-1)]/30'
                : 'border border-transparent hover:bg-[var(--color-glass-2)]',
            )}
            onClick={() => onSelectCondition(condition.id)}
          >
            <span className="text-[11px] font-mono text-[var(--color-text-primary)] truncate">
              {ci > 0 && (
                <span className="text-[9px] font-semibold text-[var(--color-accent-vivid)] mr-1.5">
                  &amp;
                </span>
              )}
              {getConditionShortSummary(condition, bindings)}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveCondition(condition.id);
              }}
              className="ml-1 shrink-0 opacity-0 group-hover/cond:opacity-100 text-muted-foreground hover:text-destructive transition-all"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {/* Add Condition button */}
        <button
          type="button"
          onClick={onAddCondition}
          className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-[var(--color-accent-vivid)] hover:opacity-80 transition-opacity"
        >
          <Plus className="h-2.5 w-2.5" />
          {t('trigger.addCondition')}
        </button>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────

function findCondition(trigger: Trigger, conditionId: string | null): Condition | undefined {
  if (!conditionId) return undefined;
  for (const group of trigger.conditionGroups) {
    const found = group.conditions.find((c) => c.id === conditionId);
    if (found) return found;
  }
  return undefined;
}
