/**
 * Time axis ruler with APEX-styled tick labels.
 * Renders above entity tracks in the timeline, showing second-based tick marks.
 */

import { useTranslation } from '@osce/i18n';
import type { TimeAxisConfig } from '../utils/compute-time-axis.js';
import { ENTITY_LABEL_WIDTH } from '../utils/timeline-constants.js';

export interface TimelineRulerProps {
  config: TimeAxisConfig;
}

export function TimelineRuler({ config }: TimelineRulerProps) {
  const { t } = useTranslation('common');

  return (
    <div
      className="flex shrink-0"
      style={{ borderBottom: '1px solid var(--color-glass-edge, rgba(180, 170, 230, 0.07))' }}
    >
      {/* Entity label spacer */}
      <div
        className="shrink-0"
        style={{
          width: ENTITY_LABEL_WIDTH,
          borderRight: '1px solid var(--color-glass-edge, rgba(180, 170, 230, 0.07))',
          padding: '6px 8px',
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display, 'Orbitron', sans-serif)",
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--color-text-tertiary, rgba(255, 255, 255, 0.20))',
          }}
        >
          {t('timeline.entity')}
        </span>
      </div>

      {/* Tick marks area */}
      <div className="relative flex-1 overflow-hidden" style={{ height: 24 }}>
        <div className="relative h-full" style={{ width: config.totalWidth }}>
          {config.ticks.map((tick) => (
            <span
              key={tick.time}
              className="absolute select-none"
              style={{
                left: tick.x,
                top: 6,
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                fontSize: 9,
                color: 'var(--color-text-tertiary, rgba(255, 255, 255, 0.20))',
                transform: tick.time === 0 ? undefined : 'translateX(-50%)',
              }}
            >
              {tick.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
