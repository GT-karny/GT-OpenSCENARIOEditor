/**
 * Assembly preview for the signal property editor.
 * Uses Canvas2D rendering for realistic head previews.
 * Interactive: click a head to select it, buttons to add/remove.
 */

import { useEffect, useState, useMemo } from 'react';
import type { OdrSignal } from '@osce/shared';
import type { SignalAssemblyMetadata } from '@osce/opendrive-engine';
import {
  getPresetById,
  computeHeadWidth,
  computeHeadHeight,
  renderSignalHeadToCanvas,
} from '@osce/opendrive-engine';
import { Button } from '../../ui/button';

interface SignalAssemblyPreviewProps {
  assembly: SignalAssemblyMetadata;
  signals: OdrSignal[];
  selectedHeadId?: string;
  onSelectHead: (signalId: string) => void;
  onAddHead: () => void;
  onRemoveHead: (signalId: string) => void;
  onChangePoleType: (poleType: 'straight' | 'arm') => void;
}

// Layout constants for the SVG preview
const SVG_WIDTH = 200;
const SVG_HEIGHT = 250;
const ORIGIN_X = 100;
const ORIGIN_Y = 40;
const SCALE = 120; // pixels per metre
const ARM_LENGTH_PX = 60;

export function SignalAssemblyPreview({
  assembly,
  signals,
  selectedHeadId,
  onSelectHead,
  onAddHead,
  onRemoveHead,
  onChangePoleType,
}: SignalAssemblyPreviewProps) {
  const isArm = assembly.poleType === 'arm';

  const heads = useMemo(
    () =>
      assembly.headPositions.map((hp) => {
        const signal = signals.find((s) => s.id === hp.signalId);
        const preset = hp.presetId ? getPresetById(hp.presetId) : null;
        const bulbCount = preset?.bulbs.length ?? 3;
        const orientation = preset?.orientation ?? 'vertical';
        const w = computeHeadWidth(bulbCount, orientation);
        const h = computeHeadHeight(bulbCount, orientation);
        return { ...hp, signal, w, h, presetId: hp.presetId ?? '3-light-vertical' };
      }),
    [assembly.headPositions, signals],
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider">
          Assembly Preview
        </h3>
        <select
          value={assembly.poleType}
          onChange={(e) => onChangePoleType(e.target.value as 'straight' | 'arm')}
          className="h-6 text-xs bg-[var(--color-glass-1)] text-[var(--color-text-primary)] border border-[var(--color-glass-edge)] rounded-none px-1"
        >
          <option value="straight">Straight</option>
          <option value="arm">Arm</option>
        </select>
      </div>

      <svg
        width={SVG_WIDTH}
        height={SVG_HEIGHT}
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="w-full bg-[var(--color-glass-1)] border border-[var(--color-glass-edge)]"
      >
        {/* Ground line */}
        <line
          x1={ORIGIN_X - 30}
          y1={SVG_HEIGHT - 20}
          x2={ORIGIN_X + 30}
          y2={SVG_HEIGHT - 20}
          stroke="var(--color-glass-edge)"
          strokeWidth={2}
        />

        {/* Vertical pole */}
        <line
          x1={ORIGIN_X}
          y1={ORIGIN_Y}
          x2={ORIGIN_X}
          y2={SVG_HEIGHT - 20}
          stroke="var(--color-text-secondary)"
          strokeWidth={3}
          strokeLinecap="round"
        />

        {/* Horizontal arm (if arm type) */}
        {isArm && (
          <line
            x1={ORIGIN_X}
            y1={ORIGIN_Y}
            x2={ORIGIN_X + ARM_LENGTH_PX}
            y2={ORIGIN_Y}
            stroke="var(--color-text-secondary)"
            strokeWidth={3}
            strokeLinecap="round"
          />
        )}

        {/* Signal heads with Canvas2D previews */}
        {heads.map((head, i) => {
          const px = ORIGIN_X + (head.x ?? 0) * SCALE;
          const py = ORIGIN_Y + (head.y ?? i * 0.75) * SCALE;
          const pw = head.w * SCALE;
          const ph = head.h * SCALE;
          const isSelected = head.signalId === selectedHeadId;

          return (
            <g
              key={head.signalId}
              onClick={() => onSelectHead(head.signalId)}
              style={{ cursor: 'pointer' }}
            >
              {isSelected && (
                <rect
                  x={px - pw / 2 - 3}
                  y={py - ph / 2 - 3}
                  width={pw + 6}
                  height={ph + 6}
                  fill="none"
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                />
              )}
              <HeadImage presetId={head.presetId} x={px - pw / 2} y={py - ph / 2} w={pw} h={ph} />
              <text
                x={px + pw / 2 + 4}
                y={py + 3}
                fill="var(--color-text-secondary)"
                fontSize={9}
                fontFamily="monospace"
              >
                {head.position}
              </text>
            </g>
          );
        })}

        {heads.length === 0 && (
          <text
            x={SVG_WIDTH / 2}
            y={SVG_HEIGHT / 2}
            textAnchor="middle"
            fill="var(--color-text-secondary)"
            fontSize={11}
          >
            No signal heads
          </text>
        )}
      </svg>

      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-6 text-xs rounded-none"
          onClick={onAddHead}
        >
          Add Head
        </Button>
        {selectedHeadId && (
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-xs rounded-none text-[var(--color-danger)]"
            onClick={() => onRemoveHead(selectedHeadId)}
          >
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}

/** Renders a single head as an SVG <image> using Canvas2D. */
function HeadImage({
  presetId,
  x,
  y,
  w,
  h,
}: {
  presetId: string;
  x: number;
  y: number;
  w: number;
  h: number;
}) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const canvas = renderSignalHeadToCanvas(presetId);
    if (canvas) setUrl(canvas.toDataURL());
  }, [presetId]);

  if (!url) {
    return <rect x={x} y={y} width={w} height={h} fill="var(--color-glass-2)" stroke="var(--color-glass-edge)" strokeWidth={1} />;
  }
  return <image href={url} x={x} y={y} width={w} height={h} />;
}
