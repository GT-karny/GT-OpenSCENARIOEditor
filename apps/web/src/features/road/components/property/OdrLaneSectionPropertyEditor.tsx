/**
 * Property editor for lane section(s) in lane editing mode.
 * Shows section info, taper length, lane offset toggle, and lane list.
 */

import type { OdrRoad, OdrLaneSection } from '@osce/shared';
import { useTranslation } from '@osce/i18n';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';

interface OdrLaneSectionPropertyEditorProps {
  road: OdrRoad;
  selectedSectionIndices: number[];
  taperLength: number;
  useLaneOffset: boolean;
  onTaperLengthChange: (length: number) => void;
  onUseLaneOffsetChange: (use: boolean) => void;
}

function SectionInfo({ road, section, index }: { road: OdrRoad; section: OdrLaneSection; index: number }) {
  const { t } = useTranslation('common');
  const nextSection = road.lanes[index + 1];
  const sectionEnd = nextSection ? nextSection.s : road.length;
  const sectionLength = sectionEnd - section.s;

  return (
    <div className="px-3 py-2 border-b border-[var(--color-glass-edge)]">
      <div className="text-[11px] font-medium text-[var(--color-text-primary)] mb-1">
        {t('odrProperty.laneSection.sectionTitle', { index })}
      </div>
      <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-[10px] text-[var(--color-text-muted)]">
        <div>s: {section.s.toFixed(1)}m</div>
        <div>
          {t('odrProperty.laneSection.lengthLabel')} {sectionLength.toFixed(1)}m
        </div>
        <div>
          {t('odrProperty.laneSection.lanesLabel')} {section.leftLanes.length}L /{' '}
          {section.rightLanes.length}R
        </div>
      </div>
      {/* Lane list */}
      <div className="mt-1.5 space-y-0.5">
        {section.leftLanes.map((lane) => (
          <div key={`L${lane.id}`} className="flex items-center gap-2 text-[10px] text-[var(--color-text-muted)]">
            <span className="w-8 text-right font-mono">L{lane.id}</span>
            <span className="flex-1">{lane.type}</span>
            <span className="font-mono">{lane.width[0]?.a.toFixed(1) ?? '?'}m</span>
          </div>
        ))}
        {section.rightLanes.map((lane) => (
          <div key={`R${lane.id}`} className="flex items-center gap-2 text-[10px] text-[var(--color-text-muted)]">
            <span className="w-8 text-right font-mono">R{lane.id}</span>
            <span className="flex-1">{lane.type}</span>
            <span className="font-mono">{lane.width[0]?.a.toFixed(1) ?? '?'}m</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OdrLaneSectionPropertyEditor({
  road,
  selectedSectionIndices,
  taperLength,
  useLaneOffset,
  onTaperLengthChange,
  onUseLaneOffsetChange,
}: OdrLaneSectionPropertyEditorProps) {
  const { t } = useTranslation('common');
  const sections = selectedSectionIndices
    .filter((i) => i >= 0 && i < road.lanes.length)
    .map((i) => ({ index: i, section: road.lanes[i] }));

  if (sections.length === 0) {
    return (
      <div className="p-3 text-xs text-[var(--color-text-muted)]">
        {t('odrProperty.laneSection.noSectionSelected')}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Taper settings */}
      <div className="px-3 py-2 border-b border-[var(--color-glass-edge)]">
        <div className="text-[11px] font-medium text-[var(--color-text-primary)] mb-1.5">
          {t('odrProperty.laneSection.taperSettingsTitle')}
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-[10px] text-[var(--color-text-muted)] w-20">
            {t('odrProperty.laneSection.taperLength')}
          </Label>
          <Input
            type="number"
            value={taperLength}
            onChange={(e) => onTaperLengthChange(Number(e.target.value))}
            min={1}
            max={200}
            step={1}
            className="h-6 text-[11px] w-20"
          />
          <span className="text-[10px] text-[var(--color-text-muted)]">m</span>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <input
            type="checkbox"
            id="use-lane-offset"
            checked={useLaneOffset}
            onChange={(e) => onUseLaneOffsetChange(e.target.checked)}
            className="h-3 w-3"
          />
          <label
            htmlFor="use-lane-offset"
            className="text-[10px] text-[var(--color-text-muted)] cursor-pointer"
          >
            {t('odrProperty.laneSection.generateLaneOffset')}
          </label>
        </div>
      </div>

      {/* Section info */}
      {sections.map(({ index, section }) => (
        <SectionInfo key={index} road={road} section={section} index={index} />
      ))}
    </div>
  );
}
