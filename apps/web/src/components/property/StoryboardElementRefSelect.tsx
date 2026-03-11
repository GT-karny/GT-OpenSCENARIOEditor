import { useMemo } from 'react';
import type { StoryboardElementType } from '@osce/shared';
import { RefSelect } from './RefSelect';
import type { RefSelectItem } from './RefSelect';
import { useStoryboardElements } from '../../hooks/use-storyboard-elements';

interface StoryboardElementRefSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  elementType: StoryboardElementType;
  className?: string;
}

export function StoryboardElementRefSelect({
  value,
  onValueChange,
  elementType,
  className,
}: StoryboardElementRefSelectProps) {
  const elements = useStoryboardElements(elementType);

  const items: RefSelectItem[] = useMemo(
    () => elements.map((el) => ({ name: el.name, description: el.path })),
    [elements],
  );

  return (
    <RefSelect
      value={value}
      onValueChange={onValueChange}
      items={items}
      placeholder={`Select ${elementType}...`}
      emptyMessage={`No ${elementType} elements in scenario`}
      className={className}
    />
  );
}
