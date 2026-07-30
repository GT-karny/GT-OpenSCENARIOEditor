import { useMemo } from 'react';
import type { ScenarioAction, ActivateControllerAction, ScenarioEntity } from '@osce/shared';
import { OptionalFieldWrapper } from '../OptionalFieldWrapper';
import { RefSelect } from '../RefSelect';
import type { RefSelectItem } from '../RefSelect';
import { SegmentedControl } from '../SegmentedControl';
import { actionBody, actionUpdate } from '../lib/typed-updates';
import { useScenarioStore } from '../../../../../stores/use-scenario-store';

const EMPTY_ENTITIES: ScenarioEntity[] = [];
type FlagValue = 'unspecified' | 'on' | 'off';

function toFlagValue(value: boolean | undefined): FlagValue {
  if (value === undefined) return 'unspecified';
  return value ? 'on' : 'off';
}

function fromFlagValue(value: FlagValue): boolean | undefined {
  if (value === 'unspecified') return undefined;
  return value === 'on';
}

interface ActivateControllerActionEditorProps {
  action: ScenarioAction;
  onUpdate: (partial: Partial<ScenarioAction>) => void;
}

export function ActivateControllerActionEditor({
  action,
  onUpdate,
}: ActivateControllerActionEditorProps) {
  const inner = action.action as ActivateControllerAction;
  const entities = useScenarioStore((s) => s.document.entities ?? EMPTY_ENTITIES);

  const controllerItems: RefSelectItem[] = useMemo(
    () =>
      entities.flatMap((entity) =>
        (entity.controllers ?? [])
          .filter((controller) => controller.name)
          .map((controller) => ({
            name: controller.name!,
            description: `${entity.name} · ${controller.controller.kind === 'controller' ? controller.controller.name : 'Catalog controller'}`,
          })),
      ),
    [entities],
  );

  const updateInner = (updates: Partial<ActivateControllerAction>) => {
    onUpdate(actionUpdate(inner, updates));
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Activate Flags</p>
        <div className="grid gap-3">
          {(['lateral', 'longitudinal', 'animation', 'lighting'] as const).map((flag) => (
            <div key={flag} className="grid gap-1">
              <p className="text-xs capitalize text-[var(--color-text-secondary)]">{flag}</p>
              <SegmentedControl
                value={toFlagValue(inner[flag])}
                options={['unspecified', 'on', 'off'] as const}
                labels={{ unspecified: 'Unspecified', on: 'ON', off: 'OFF' }}
                onValueChange={(value) => {
                  const next = fromFlagValue(value);
                  if (next === undefined) {
                    const { [flag]: _, ...rest } = inner;
                    onUpdate(actionBody(rest));
                  } else {
                    updateInner({ [flag]: next });
                  }
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <OptionalFieldWrapper
        label="Controller Ref"
        hasValue={inner.objectControllerRef !== undefined || inner.controllerRef !== undefined}
        onClear={() => {
          const { objectControllerRef: _, controllerRef: __, ...rest } = inner;
          onUpdate(actionBody(rest));
        }}
      >
        <RefSelect
          value={inner.objectControllerRef ?? inner.controllerRef ?? ''}
          onValueChange={(v) => {
            if (v === '') {
              const { objectControllerRef: _, controllerRef: __, ...rest } = inner;
              onUpdate(actionBody(rest));
            } else {
              const { controllerRef: _, ...rest } = inner;
              onUpdate(actionBody({ ...rest, objectControllerRef: v }));
            }
          }}
          items={controllerItems}
          placeholder="Select controller..."
          emptyMessage="No controllers defined"
          className="h-8 text-sm"
        />
      </OptionalFieldWrapper>
    </div>
  );
}
