import type { Story } from '@osce/shared';
import { PropertyField } from './PropertyField.js';

export interface StoryPropertiesProps {
  story: Story;
  onUpdate?: (updates: Partial<Story>) => void;
}

export function StoryProperties({ story, onUpdate }: StoryPropertiesProps) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-blue-800">Story</div>
      <PropertyField
        label="Name"
        value={story.name}
        onChange={(v) => onUpdate?.({ name: v })}
      />
      <PropertyField
        label="Acts"
        value={story.acts.length}
        type="readonly"
      />
      <PropertyField
        label="ID"
        value={story.id}
        type="readonly"
      />
    </div>
  );
}
