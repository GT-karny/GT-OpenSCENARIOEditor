import { ArrowRight } from 'lucide-react';
import type { Trigger } from '@osce/shared';
import { getTriggerSummary } from './trigger-summary';

interface SceneTransitionArrowProps {
  trigger: Trigger;
  onClick?: () => void;
}

export function SceneTransitionArrow({ trigger, onClick }: SceneTransitionArrowProps) {
  const summary = getTriggerSummary(trigger);

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 px-3 group shrink-0"
      title="Click to edit trigger in Properties panel"
    >
      <span className="text-[10px] text-[var(--color-accent-vivid)] font-mono opacity-60 group-hover:opacity-100 transition-opacity whitespace-nowrap max-w-[90px] truncate">
        {summary}
      </span>
      <ArrowRight className="h-4 w-4 text-[var(--color-accent-vivid)] opacity-40 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
