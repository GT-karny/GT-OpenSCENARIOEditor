import { useTranslation } from '@osce/i18n';
import { useScenarioStore } from '../../stores/use-scenario-store';
import { useEditorStore } from '../../stores/editor-store';
import { useSimulationStore } from '../../stores/simulation-store';
import type { SimulationStatus } from '@osce/shared';

function getStatusDot(
  simStatus: SimulationStatus,
): { color: string; shadow: string } {
  switch (simStatus) {
    case 'running':
      return {
        color: 'var(--color-warning, #f59e0b)',
        shadow: '0 0 3px rgba(245, 158, 11, 0.4)',
      };
    case 'error':
      return {
        color: 'var(--color-destructive)',
        shadow: '0 0 3px rgba(239, 68, 68, 0.4)',
      };
    case 'completed':
      return {
        color: 'var(--color-success)',
        shadow: '0 0 3px rgba(93, 216, 168, 0.3)',
      };
    default:
      return {
        color: 'var(--color-success)',
        shadow: '0 0 3px rgba(93, 216, 168, 0.3)',
      };
  }
}

function useStatusLabel(simStatus: SimulationStatus): string {
  const { t } = useTranslation('common');
  switch (simStatus) {
    case 'running':
      return t('labels.simulating');
    case 'completed':
      return t('labels.completed');
    case 'error':
      return t('labels.error');
    default:
      return t('labels.ready');
  }
}

export function StatusBar() {
  const { t } = useTranslation('common');
  const entityCount = useScenarioStore((s) => s.document.entities.length);
  const storyCount = useScenarioStore((s) => s.document.storyboard.stories.length);
  const validationResult = useEditorStore((s) => s.validationResult);
  const currentFileName = useEditorStore((s) => s.currentFileName);
  const isDirty = useEditorStore((s) => s.isDirty);
  const simStatus = useSimulationStore((s) => s.status);

  const dot = getStatusDot(simStatus);
  const statusLabel = useStatusLabel(simStatus);

  return (
    <div role="contentinfo" data-testid="status-bar" className="relative flex items-center justify-between h-[26px] px-6 border-t border-[var(--color-glass-edge-mid)] bg-[var(--color-glass-1)] backdrop-blur-[28px] saturate-[1.3] text-[10px] text-[var(--color-text-tertiary)] tracking-[0.03em] statusbar-glow enter" style={{ animationDelay: '0.4s' }}>
      <div className="flex items-center gap-6">
        <span role="status" aria-live="polite" aria-label={statusLabel} className="flex items-center gap-1">
          <span
            data-testid="status-dot"
            className="w-[5px] h-[5px]"
            style={{ backgroundColor: dot.color, boxShadow: dot.shadow }}
          />
          <span>{statusLabel}</span>
        </span>
        <span>
          {t('labels.entities')}: {entityCount}
        </span>
        <span>
          {t('labels.stories')}: {storyCount}
        </span>
        {validationResult && (
          <span
            className={
              validationResult.valid ? 'text-success' : 'text-destructive'
            }
          >
            {validationResult.errors.length} errors, {validationResult.warnings.length} warnings
          </span>
        )}
      </div>
      <div className="flex items-center gap-6">
        {currentFileName && (
          <span>
            {currentFileName}
            {isDirty ? ' *' : ''}
          </span>
        )}
        {!currentFileName && <span>Untitled{isDirty ? ' *' : ''}</span>}
        <span>OpenSCENARIO v1.2</span>
      </div>
    </div>
  );
}
