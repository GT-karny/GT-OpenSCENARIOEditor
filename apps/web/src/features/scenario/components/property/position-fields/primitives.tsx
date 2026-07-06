/**
 * Shared primitives for the per-position-type field components:
 * small pure helpers (parseNum/omitKey/applyOrientation) plus the reusable
 * NumField/TextField/OrientationFields building blocks.
 */

import { Label } from '../../../../../components/ui/label';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { EnumSelect } from '../../../../../components/form/EnumSelect';
import type { Orientation } from '@osce/shared';
import { REFERENCE_CONTEXTS } from '@osce/shared';

export function parseNum(value: string): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function omitKey<T>(obj: T, key: string): T {
  const result = { ...obj } as Record<string, unknown>;
  delete result[key];
  return result as T;
}

export function applyOrientation<T extends { orientation?: Orientation }>(pos: T, o: Orientation | undefined): T {
  if (o === undefined) {
    const { orientation: _, ...rest } = pos as T & { orientation?: Orientation };
    return rest as T;
  }
  return { ...pos, orientation: o };
}

// --- Reusable field primitives ---

export function NumField({
  label,
  value,
  onChange,
  optional,
  elementId,
  fieldName,
}: {
  label: string;
  value: number | undefined;
  onChange: (value: string) => void;
  optional?: boolean;
  elementId?: string;
  fieldName?: string;
}) {
  return (
    <div className="grid gap-1">
      <Label className="text-xs">
        {label}
        {optional && <span className="text-muted-foreground ml-1">?</span>}
      </Label>
      <ParameterAwareInput
        elementId={elementId}
        fieldName={fieldName}
        value={value ?? ''}
        onValueChange={onChange}
        acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
        placeholder={optional ? '—' : '0'}
        className="h-8 text-sm"
        step="any"
      />
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  elementId,
  fieldName,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  elementId?: string;
  fieldName?: string;
}) {
  return (
    <div className="grid gap-1">
      <Label className="text-xs">{label}</Label>
      <ParameterAwareInput
        elementId={elementId}
        fieldName={fieldName}
        value={value}
        onValueChange={onChange}
        acceptedTypes={['string']}
        className="h-8 text-sm"
      />
    </div>
  );
}

// --- OrientationFields ---

function isOrientationEmpty(ori: Partial<Orientation>): boolean {
  return ori.type === undefined && ori.h === undefined && ori.p === undefined && ori.r === undefined;
}

export function OrientationFields({
  orientation,
  onChange,
  elementId,
  prefix,
}: {
  orientation: Orientation | undefined;
  onChange: (o: Orientation | undefined) => void;
  elementId?: string;
  prefix?: string;
}) {
  const ori = orientation ?? {};

  const update = (updates: Partial<Orientation>) => {
    const next = { ...ori, ...updates };
    onChange(isOrientationEmpty(next) ? undefined : next);
  };

  const clearKey = (key: keyof Orientation) => {
    const next = { ...ori };
    delete next[key];
    onChange(isOrientationEmpty(next) ? undefined : next);
  };

  const handleOriValue = (key: 'h' | 'p' | 'r', value: string) => {
    if (value === '') {
      clearKey(key);
    } else {
      const n = parseFloat(value);
      if (Number.isFinite(n)) update({ [key]: n });
    }
  };

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">Orientation</p>
      <div className="grid gap-1">
        <Label className="text-xs">
          Type <span className="text-muted-foreground">?</span>
        </Label>
        <EnumSelect
          value={ori.type ?? ''}
          options={['', ...REFERENCE_CONTEXTS]}
          onValueChange={(v) =>
            v
              ? update({ type: v as 'relative' | 'absolute' })
              : clearKey('type')
          }
          className="h-8 text-sm"
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="grid gap-1">
          <Label className="text-xs">
            H <span className="text-muted-foreground">?</span>
          </Label>
          <ParameterAwareInput
            elementId={elementId}
            fieldName={prefix ? `${prefix}.h` : undefined}
            value={ori.h ?? ''}
            onValueChange={(v) => handleOriValue('h', v)}
            acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
            placeholder="—"
            step="any"
            className="h-8 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">
            P <span className="text-muted-foreground">?</span>
          </Label>
          <ParameterAwareInput
            elementId={elementId}
            fieldName={prefix ? `${prefix}.p` : undefined}
            value={ori.p ?? ''}
            onValueChange={(v) => handleOriValue('p', v)}
            acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
            placeholder="—"
            step="any"
            className="h-8 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">
            R <span className="text-muted-foreground">?</span>
          </Label>
          <ParameterAwareInput
            elementId={elementId}
            fieldName={prefix ? `${prefix}.r` : undefined}
            value={ori.r ?? ''}
            onValueChange={(v) => handleOriValue('r', v)}
            acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
            placeholder="—"
            step="any"
            className="h-8 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
