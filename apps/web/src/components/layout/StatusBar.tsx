import { useTranslation } from '@osce/i18n';
import { useScenarioStore } from '../../stores/use-scenario-store';
import { useEditorStore } from '../../stores/editor-store';
import { useDocumentRegistry } from '../../stores/document-registry';
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
  const editorMode = useEditorStore((s) => s.editorMode);
  const xoscFileName = useEditorStore((s) => s.currentFileName);
  // Dirty is derived from each document's command-history revision (registry).
  const isXoscDirty = useDocumentRegistry((s) => s.current.scenario !== s.saved.scenario);
  const xodrFileName = useEditorStore((s) => s.roadNetworkFileName);
  const isXodrDirty = useDocumentRegistry(
    (s) => s.current.roadNetwork !== s.saved.roadNetwork,
  );
  const isCatalogDirty = useDocumentRegistry((s) => s.current.catalog !== s.saved.catalog);
  const isDistributionDirty = useDocumentRegistry(
    (s) => s.current.distribution !== s.saved.distribution,
  );
  const simStatus = useSimulationStore((s) => s.status);
  const compatibilityProfile = useEditorStore((s) => s.preferences.compatibilityProfile);
  const speedUnit = useEditorStore((s) => s.preferences.speedUnit);
  const updatePreferences = useEditorStore((s) => s.updatePreferences);

  const isRoadNetwork = editorMode === 'roadNetwork';
  const displayName = isRoadNetwork ? xodrFileName : xoscFileName;
  const displayDirty = isRoadNetwork ? isXodrDirty : isXoscDirty;

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
        {!isRoadNetwork && (
          <>
            <span>
              {t('labels.entities')}: {entityCount}
            </span>
            <span>
              {t('labels.stories')}: {storyCount}
            </span>
          </>
        )}
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
        {/* Per-document dirty indicators: surface unsaved state for every
            document independently, so a dirty road network or catalog is visible
            while editing a scenario (and vice versa). */}
        {(isXoscDirty || isXodrDirty || isCatalogDirty || isDistributionDirty) && (
          <span
            className="flex items-center gap-3"
            data-testid="dirty-indicators"
            title={t('labels.unsavedChanges')}
          >
            {isXoscDirty && (
              <span
                data-testid="dirty-indicator-scenario"
                className="flex items-center gap-1 text-[var(--color-text-secondary)]"
              >
                {t('labels.scenarioDoc')}
                <span className="text-[var(--color-warning,#f59e0b)]">●</span>
              </span>
            )}
            {isXodrDirty && (
              <span
                data-testid="dirty-indicator-roadNetwork"
                className="flex items-center gap-1 text-[var(--color-text-secondary)]"
              >
                {t('labels.roadDoc')}
                <span className="text-[var(--color-warning,#f59e0b)]">●</span>
              </span>
            )}
            {isCatalogDirty && (
              <span
                data-testid="dirty-indicator-catalog"
                className="flex items-center gap-1 text-[var(--color-text-secondary)]"
              >
                {t('labels.catalogDoc')}
                <span className="text-[var(--color-warning,#f59e0b)]">●</span>
              </span>
            )}
            {isDistributionDirty && (
              <span
                data-testid="dirty-indicator-distribution"
                className="flex items-center gap-1 text-[var(--color-text-secondary)]"
              >
                {t('labels.distributionDoc')}
                <span className="text-[var(--color-warning,#f59e0b)]">●</span>
              </span>
            )}
          </span>
        )}
        <span>
          {displayName ?? 'Untitled'}
          {displayDirty ? ' ●' : ''}
        </span>
        {!isRoadNetwork && (
          <span className="flex items-center gap-0">
            {(['mps', 'kmph'] as const).map((unit) => (
              <button
                key={unit}
                type="button"
                onClick={() => updatePreferences({ speedUnit: unit })}
                className={`px-1.5 py-0.5 text-[10px] transition-colors ${
                  speedUnit === unit
                    ? 'bg-[var(--color-glass-3)] text-[var(--color-text-primary)]'
                    : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-glass-hover)] hover:text-[var(--color-text-secondary)]'
                }`}
              >
                {unit === 'mps' ? 'm/s' : 'km/h'}
              </button>
            ))}
          </span>
        )}
        <span>
          {isRoadNetwork
            ? 'OpenDRIVE'
            : `OpenSCENARIO v${compatibilityProfile.oscVersion}${
                compatibilityProfile.simulator !== 'any' ? ` · ${compatibilityProfile.simulator}` : ''
              }`}
        </span>
      </div>
    </div>
  );
}
