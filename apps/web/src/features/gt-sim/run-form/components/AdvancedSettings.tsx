/**
 * Collapsible advanced execution settings (Hz/timeout/OSI IP/window geometry).
 *
 * Ported from the GT_Sim fork's `components/simulation/AdvancedSettings.tsx`.
 */
import { useTranslation } from '@osce/i18n';
import { NumberInput, TextInput, ToggleSwitch } from '../../ui';

export interface AdvancedSettingsProps {
  showAdvanced: boolean;
  setShowAdvanced: (v: boolean) => void;
  hz: number;
  setHz: (v: number) => void;
  timeout: number;
  setTimeout_: (v: number) => void;
  osiEnabled: boolean;
  osiIp: string;
  setOsiIp: (v: string) => void;
  headless: boolean;
  threads: boolean;
  setThreads: (v: boolean) => void;
  winX: number;
  setWinX: (v: number) => void;
  winY: number;
  setWinY: (v: number) => void;
  winW: number;
  setWinW: (v: number) => void;
  winH: number;
  setWinH: (v: number) => void;
  validationErrors: Record<string, string>;
  compact?: boolean;
}

export function AdvancedSettings({
  showAdvanced,
  setShowAdvanced,
  hz,
  setHz,
  timeout,
  setTimeout_,
  osiEnabled,
  osiIp,
  setOsiIp,
  headless,
  threads,
  setThreads,
  winX,
  setWinX,
  winY,
  setWinY,
  winW,
  setWinW,
  winH,
  setWinH,
  validationErrors,
  compact = false,
}: AdvancedSettingsProps) {
  const { t } = useTranslation('common');

  return (
    <div>
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-1.5 text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors cursor-pointer mb-1.5"
      >
        <svg
          className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M6 3l5 5-5 5V3z" />
        </svg>
        {t('gtSim.runForm.advanced.toggle')}
      </button>

      {showAdvanced && (
        <div className={compact ? 'space-y-3' : 'space-y-4'}>
          <div className={`grid grid-cols-2 ${compact ? 'gap-3' : 'gap-4'}`}>
            <div>
              <NumberInput
                label={t('gtSim.runForm.advanced.frequency')}
                value={hz}
                onChange={(e) => setHz(Number(e.target.value))}
              />
              {validationErrors.hz && (
                <p className="text-[var(--color-destructive)] text-xs mt-1">
                  {validationErrors.hz}
                </p>
              )}
            </div>
            <div>
              <NumberInput
                label={t('gtSim.runForm.advanced.timeout')}
                value={timeout}
                onChange={(e) => setTimeout_(Number(e.target.value))}
              />
              {validationErrors.timeout && (
                <p className="text-[var(--color-destructive)] text-xs mt-1">
                  {validationErrors.timeout}
                </p>
              )}
            </div>
          </div>

          {osiEnabled && (
            <div>
              <TextInput
                label={t('gtSim.runForm.advanced.osiIp')}
                value={osiIp}
                onChange={(e) => setOsiIp(e.target.value)}
                className="w-48"
              />
              {validationErrors.osiIp && (
                <p className="text-[var(--color-destructive)] text-xs mt-1">
                  {validationErrors.osiIp}
                </p>
              )}
            </div>
          )}

          {!headless && (
            <>
              <ToggleSwitch
                label={t('gtSim.runForm.advanced.threadedViewer')}
                checked={threads}
                onChange={setThreads}
                description={t('gtSim.runForm.advanced.threadedViewerDesc')}
              />
              <div>
                <h3 className="text-xs text-[var(--color-text-tertiary)] mb-1.5">
                  {t('gtSim.runForm.advanced.windowGeometry')}
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  <NumberInput
                    label={t('gtSim.runForm.advanced.x')}
                    value={winX}
                    onChange={(e) => setWinX(Number(e.target.value))}
                  />
                  <NumberInput
                    label={t('gtSim.runForm.advanced.y')}
                    value={winY}
                    onChange={(e) => setWinY(Number(e.target.value))}
                  />
                  <NumberInput
                    label={t('gtSim.runForm.advanced.width')}
                    value={winW}
                    onChange={(e) => setWinW(Number(e.target.value))}
                  />
                  <NumberInput
                    label={t('gtSim.runForm.advanced.height')}
                    value={winH}
                    onChange={(e) => setWinH(Number(e.target.value))}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
