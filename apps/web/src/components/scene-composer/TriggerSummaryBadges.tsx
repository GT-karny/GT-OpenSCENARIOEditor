import { Fragment } from 'react';
import type { Trigger } from '@osce/shared';
import type { TranslateFunc } from './trigger-summary';
import { getConditionNaturalSummary } from './trigger-summary';

interface TriggerSummaryBadgesProps {
  trigger: Trigger;
  t: TranslateFunc;
}

/**
 * Renders all conditions from a Trigger with badge-styled `&` (AND) and `||` (OR) operators.
 * Groups are separated by `||`, conditions within a group by `&`.
 */
export function TriggerSummaryBadges({ trigger, t }: TriggerSummaryBadgesProps) {
  const groups = trigger.conditionGroups.filter((g) => g.conditions.length > 0);

  if (groups.length === 0) {
    return (
      <span className="text-[11px] font-medium text-[var(--color-text-primary)]">
        {t('composer:trigger.immediate')}
      </span>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-0.5">
      {groups.map((group, gi) => (
        <Fragment key={group.id}>
          {gi > 0 && <OperatorBadge op="||" />}
          {group.conditions.map((cond, ci) => (
            <Fragment key={cond.id}>
              {ci > 0 && <OperatorBadge op="&" />}
              <span className="text-[11px] font-medium text-[var(--color-text-primary)]">
                {getConditionNaturalSummary(cond, t)}
              </span>
            </Fragment>
          ))}
        </Fragment>
      ))}
    </span>
  );
}

function OperatorBadge({ op }: { op: '&' | '||' }) {
  return (
    <span
      className="inline-flex items-center px-1 py-0 text-[9px] font-mono rounded
        bg-[var(--color-glass-2)] border border-[var(--color-glass-edge)]
        text-[var(--color-text-muted)] leading-tight"
    >
      {op}
    </span>
  );
}
