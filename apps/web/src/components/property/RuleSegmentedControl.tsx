import type { Rule } from '@osce/shared';
import { SegmentedControl } from './SegmentedControl';

const RULE_OPTIONS = [
  'equalTo',
  'greaterThan',
  'lessThan',
  'greaterOrEqual',
  'lessOrEqual',
  'notEqualTo',
] as const;

const RULE_ICONS: Record<Rule, string> = {
  equalTo: '=',
  greaterThan: '>',
  lessThan: '<',
  greaterOrEqual: '≥',
  lessOrEqual: '≤',
  notEqualTo: '≠',
};

const RULE_LABELS: Record<Rule, string> = {
  equalTo: 'equalTo',
  greaterThan: 'greaterThan',
  lessThan: 'lessThan',
  greaterOrEqual: 'greaterOrEqual',
  lessOrEqual: 'lessOrEqual',
  notEqualTo: 'notEqualTo',
};

interface RuleSegmentedControlProps {
  value: Rule;
  onValueChange: (value: Rule) => void;
  className?: string;
}

export function RuleSegmentedControl({ value, onValueChange, className }: RuleSegmentedControlProps) {
  return (
    <SegmentedControl
      value={value}
      options={RULE_OPTIONS}
      onValueChange={onValueChange}
      labels={RULE_LABELS}
      icons={RULE_ICONS}
      className={className}
    />
  );
}
