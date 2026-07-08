import type {
  OdrSignalSemantics,
  OdrSemanticsEntry,
  OdrSemanticsKind,
  OdrSemanticsParticipant,
} from '@osce/shared';
import {
  ODR_SEMANTICS_KINDS,
  ODR_SEMANTICS_PARTICIPANT_KINDS,
  ODR_SEMANTICS_SPEED_TYPES,
  ODR_SEMANTICS_LANE_TYPES,
  ODR_SEMANTICS_PRIORITY_TYPES,
  ODR_SEMANTICS_SUPPLEMENTARY_TIME_TYPES,
  ODR_SEMANTICS_SUPPLEMENTARY_DISTANCE_TYPES,
  ODR_SEMANTICS_SUPPLEMENTARY_ENVIRONMENT_TYPES,
  ODR_PERSON_CATEGORIES,
  ODR_VEHICLE_CATEGORIES,
} from '@osce/shared';
import { useTranslation } from '@osce/i18n';
import { Plus, Trash2, X } from 'lucide-react';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Button } from '../../../../components/ui/button';
import { EnumSelect } from '../../../../components/form/EnumSelect';

// e_unitSpeed / e_unitDistance value spaces (UI dropdowns only; stored as string).
const SPEED_UNITS: readonly string[] = ['m/s', 'km/h', 'mph'];
const DISTANCE_UNITS: readonly string[] = ['m', 'km', 'ft', 'mile'];

/** @type enum value space per kind (only kinds that carry a @type). */
const TYPE_OPTIONS: Partial<Record<OdrSemanticsKind, readonly string[]>> = {
  speed: ODR_SEMANTICS_SPEED_TYPES,
  lane: ODR_SEMANTICS_LANE_TYPES,
  priority: ODR_SEMANTICS_PRIORITY_TYPES,
  supplementaryTime: ODR_SEMANTICS_SUPPLEMENTARY_TIME_TYPES,
  supplementaryDistance: ODR_SEMANTICS_SUPPLEMENTARY_DISTANCE_TYPES,
  supplementaryEnvironment: ODR_SEMANTICS_SUPPLEMENTARY_ENVIRONMENT_TYPES,
};

const isParticipantKind = (kind: OdrSemanticsKind): boolean =>
  (ODR_SEMANTICS_PARTICIPANT_KINDS as readonly string[]).includes(kind);

/** Fresh entry for a kind — typed defaults so a switched row is immediately valid. */
function defaultEntryForKind(kind: OdrSemanticsKind): OdrSemanticsEntry {
  const options = TYPE_OPTIONS[kind];
  if (isParticipantKind(kind)) {
    return { kind, participants: [] } as OdrSemanticsEntry;
  }
  if (options) {
    return { kind, type: options[0] } as OdrSemanticsEntry;
  }
  return { kind } as OdrSemanticsEntry;
}

interface SignalSemanticsEditorProps {
  semantics: OdrSignalSemantics | undefined;
  onChange: (semantics: OdrSignalSemantics | undefined) => void;
}

export function SignalSemanticsEditor({ semantics, onChange }: SignalSemanticsEditorProps) {
  const { t } = useTranslation('common');
  const entries = semantics?.entries ?? [];

  const commit = (nextEntries: OdrSemanticsEntry[]) => {
    if (nextEntries.length === 0 && !semantics?.extra) {
      onChange(undefined);
      return;
    }
    onChange({ entries: nextEntries, ...(semantics?.extra ? { extra: semantics.extra } : {}) });
  };

  const updateEntry = (index: number, next: OdrSemanticsEntry) => {
    commit(entries.map((e, i) => (i === index ? next : e)));
  };

  const addEntry = () => commit([...entries, defaultEntryForKind('speed')]);
  const removeEntry = (index: number) => commit(entries.filter((_, i) => i !== index));

  return (
    <div className="pb-3 border-b border-[var(--color-glass-edge)]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider">
          {t('odrProperty.signal.semantics.title')}
        </h3>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px]" onClick={addEntry}>
          <Plus className="h-3 w-3 mr-1" />
          {t('odrProperty.signal.semantics.addEntry')}
        </Button>
      </div>

      {entries.length === 0 ? (
        <p className="text-xs text-[var(--color-text-secondary)] italic">
          {t('odrProperty.signal.semantics.empty')}
        </p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, idx) => (
            <div key={idx} className="p-2 bg-[var(--color-glass-1)] space-y-2">
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-2">
                  <div className="grid gap-1">
                    <Label className="text-[var(--color-text-secondary)] text-xs">
                      {t('odrProperty.signal.semantics.kind')}
                    </Label>
                    <EnumSelect
                      value={entry.kind}
                      options={ODR_SEMANTICS_KINDS as readonly string[]}
                      onValueChange={(v) =>
                        updateEntry(idx, defaultEntryForKind(v as OdrSemanticsKind))
                      }
                      className="h-7 text-xs"
                    />
                  </div>
                  <SemanticsEntryFields
                    entry={entry}
                    onChange={(next) => updateEntry(idx, next)}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t('odrProperty.signal.semantics.removeEntry')}
                  className="h-7 w-7 shrink-0 text-red-400"
                  onClick={() => removeEntry(idx)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface EntryFieldsProps {
  entry: OdrSemanticsEntry;
  onChange: (next: OdrSemanticsEntry) => void;
}

/** Kind-specific inline fields for one semantics row. */
function SemanticsEntryFields({ entry, onChange }: EntryFieldsProps) {
  const { t } = useTranslation('common');
  const typeOptions = TYPE_OPTIONS[entry.kind];

  const typeField = typeOptions ? (
    <div className="grid gap-1">
      <Label className="text-[var(--color-text-secondary)] text-xs">
        {t('odrProperty.signal.semantics.type')}
      </Label>
      <EnumSelect
        value={'type' in entry && entry.type ? entry.type : ''}
        options={typeOptions}
        onValueChange={(v) => onChange({ ...entry, type: v } as OdrSemanticsEntry)}
        className="h-7 text-xs"
      />
    </div>
  ) : null;

  const numberField = (label: string, value: number | undefined, apply: (v: number | undefined) => void) => (
    <div className="grid gap-1">
      <Label className="text-[var(--color-text-secondary)] text-xs">{label}</Label>
      <Input
        type="number"
        value={value ?? ''}
        onChange={(e) => apply(e.target.value === '' ? undefined : Number(e.target.value))}
        className="h-7 text-xs"
      />
    </div>
  );

  const unitField = (units: readonly string[], value: string | undefined, apply: (v: string) => void) => (
    <div className="grid gap-1">
      <Label className="text-[var(--color-text-secondary)] text-xs">
        {t('odrProperty.signal.semantics.unit')}
      </Label>
      <EnumSelect value={value ?? ''} options={units} onValueChange={apply} className="h-7 text-xs" />
    </div>
  );

  switch (entry.kind) {
    case 'speed':
      return (
        <div className="grid grid-cols-3 gap-2">
          {typeField}
          {numberField(t('odrProperty.signal.semantics.value'), entry.value, (v) =>
            onChange({ ...entry, value: v }),
          )}
          {unitField(SPEED_UNITS, entry.unit, (v) => onChange({ ...entry, unit: v }))}
        </div>
      );
    case 'supplementaryDistance':
      return (
        <div className="grid grid-cols-3 gap-2">
          {typeField}
          {numberField(t('odrProperty.signal.semantics.value'), entry.value, (v) =>
            onChange({ ...entry, value: v }),
          )}
          {unitField(DISTANCE_UNITS, entry.unit, (v) => onChange({ ...entry, unit: v }))}
        </div>
      );
    case 'supplementaryTime':
      return (
        <div className="grid grid-cols-2 gap-2">
          {typeField}
          {numberField(t('odrProperty.signal.semantics.value'), entry.value, (v) =>
            onChange({ ...entry, value: v }),
          )}
        </div>
      );
    case 'lane':
    case 'priority':
    case 'supplementaryEnvironment':
      return typeField;
    case 'prohibited':
    case 'supplementaryAllows':
    case 'supplementaryProhibits':
      return (
        <ParticipantsField
          participants={entry.participants}
          onChange={(participants) => onChange({ ...entry, participants })}
        />
      );
    default:
      // warning / routing / streetname / parking / tourist / supplementaryExplanatory
      return null;
  }
}

interface ParticipantsFieldProps {
  participants: OdrSemanticsParticipant[];
  onChange: (participants: OdrSemanticsParticipant[]) => void;
}

function ParticipantsField({ participants, onChange }: ParticipantsFieldProps) {
  const { t } = useTranslation('common');

  const add = (p: OdrSemanticsParticipant) => onChange([...participants, p]);
  const remove = (index: number) => onChange(participants.filter((_, i) => i !== index));
  const setCategory = (index: number, category: string) =>
    onChange(participants.map((p, i) => (i === index ? { ...p, category } : p)));

  return (
    <div className="grid gap-1">
      <Label className="text-[var(--color-text-secondary)] text-xs">
        {t('odrProperty.signal.semantics.participants')}
      </Label>
      {participants.length > 0 && (
        <div className="space-y-1">
          {participants.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-[var(--color-text-primary)] w-16 shrink-0">{p.kind}</span>
              {p.kind !== 'animal' && (
                <EnumSelect
                  value={p.category}
                  options={p.kind === 'person' ? ODR_PERSON_CATEGORIES : ODR_VEHICLE_CATEGORIES}
                  onValueChange={(v) => setCategory(i, v)}
                  className="h-7 text-xs flex-1"
                />
              )}
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('odrProperty.signal.semantics.removeParticipant')}
                className="h-6 w-6 shrink-0 text-red-400 ml-auto"
                onClick={() => remove(i)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-6 px-2 text-[11px] rounded-none"
          onClick={() => add({ kind: 'animal' })}
        >
          {t('odrProperty.signal.semantics.addAnimal')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-6 px-2 text-[11px] rounded-none"
          onClick={() => add({ kind: 'person', category: ODR_PERSON_CATEGORIES[0] })}
        >
          {t('odrProperty.signal.semantics.addPerson')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-6 px-2 text-[11px] rounded-none"
          onClick={() => add({ kind: 'vehicle', category: ODR_VEHICLE_CATEGORIES[0] })}
        >
          {t('odrProperty.signal.semantics.addVehicle')}
        </Button>
      </div>
    </div>
  );
}
