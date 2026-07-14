/**
 * Scenario parameter overrides + preset tabs, for the currently selected
 * scenario.
 *
 * Ported from the GT_Sim fork's `components/project/ParameterPanel.tsx`. The
 * fork parsed the corrupted-preset-file 409 out of a stringly-typed
 * `Error.message` (`/^409:\s*(\{.*\})$/`) because its hand-rolled `fetch`
 * wrapper threw plain `Error`s; `@osce/esmini`'s `GtSimApiClient` throws a
 * structured `GtSimApiError` with `statusCode`/`responseBody`, so this reads
 * those fields directly instead of regex-matching the message.
 *
 * queryKey `['presets', projectId, scenarioFile]` follows the shared
 * convention (resource-name-prefixed, scoped by every discriminator the
 * backend actually scopes by). A `refetchInterval` fallback keeps the list
 * fresh even if the presets WS stream (`PresetSelector`'s `usePresetWatcher`)
 * never connects (design instruction #5).
 */
import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@osce/i18n';
import { GtSimApiError } from '@osce/esmini';
import type { ScenarioInfo, ScenarioParam } from '@osce/esmini';
import { useGtSimApi } from '../../lib';
import { TextInput, Checkbox, EmptyState } from '../../ui';
import { PresetSelector } from './PresetSelector';

/** Fallback poll interval used when the presets WS stream is not connected. */
const PRESETS_POLL_INTERVAL_MS = 20_000;

interface CorruptDetail {
  path: string;
  message: string;
  line?: number;
}

function extractCorruptDetail(err: unknown): CorruptDetail | null {
  if (!(err instanceof GtSimApiError) || err.statusCode !== 409 || !err.responseBody) {
    return null;
  }
  try {
    const parsed = JSON.parse(err.responseBody) as {
      detail?: { code?: string; path?: unknown; message?: unknown; line?: unknown };
    };
    const detail = parsed.detail;
    if (detail && detail.code === 'preset_file_corrupted') {
      return {
        path: String(detail.path ?? ''),
        message: String(detail.message ?? ''),
        line: typeof detail.line === 'number' ? detail.line : undefined,
      };
    }
  } catch {
    // Response body wasn't the expected JSON shape — not a corrupt-preset 409.
  }
  return null;
}

interface ParameterPanelProps {
  projectId: string;
  scenario: ScenarioInfo | null;
  paramOverrides: Record<string, string>;
  onParamOverridesChange: (overrides: Record<string, string>) => void;
}

export function ParameterPanel({
  projectId,
  scenario,
  paramOverrides,
  onParamOverridesChange,
}: ParameterPanelProps) {
  const { t } = useTranslation('common');
  const api = useGtSimApi();
  const scenarioFile = scenario?.file ?? '';
  // Memoized so the useMemo/useEffect below don't retrigger on unrelated renders.
  const scenarioParams = useMemo(() => scenario?.params ?? [], [scenario]);

  const {
    data: presets,
    error: presetsError,
  } = useQuery({
    queryKey: ['presets', projectId, scenarioFile],
    queryFn: () => api!.getPresets(projectId, scenarioFile),
    enabled: api !== null && !!scenarioFile,
    retry: false,
    refetchInterval: PRESETS_POLL_INTERVAL_MS,
  });

  const corruptDetail = extractCorruptDetail(presetsError);

  // Default values from scenario params.
  const defaultValues = useMemo(() => {
    const vals: Record<string, string> = {};
    for (const p of scenarioParams) vals[p.name] = p.value;
    return vals;
  }, [scenarioParams]);

  // Initialize param overrides when scenario changes.
  useEffect(() => {
    if (scenarioParams.length === 0) return;
    const next: Record<string, string> = {};
    for (const p of scenarioParams) {
      next[p.name] = paramOverrides[p.name] ?? p.value;
    }
    onParamOverridesChange(next);
    // Only run when scenario changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioFile]);

  if (!scenario) {
    return (
      <div className="p-3">
        <EmptyState message={t('gtSim.runForm.parameters.selectScenario')} />
      </div>
    );
  }

  if (scenarioParams.length === 0) {
    return (
      <div>
        <h3 className="text-xs text-[var(--color-text-tertiary)] mb-2">
          {t('gtSim.runForm.parameters.heading')}
        </h3>
        <p className="text-[var(--color-text-tertiary)] text-xs">
          {t('gtSim.runForm.parameters.noParams')}
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xs text-[var(--color-text-tertiary)] mb-2">
        {t('gtSim.runForm.parameters.heading')}
      </h3>

      {/* Corrupt preset file banner */}
      {corruptDetail && (
        <div className="mb-2 px-2 py-1.5 bg-[var(--color-destructive)]/10 border border-[var(--color-destructive)]/40 text-[10px] text-[var(--color-destructive)]">
          <div className="font-medium">{t('gtSim.presets.corrupted.title')}</div>
          <div className="text-[var(--color-text-tertiary)] mt-0.5 break-all">
            {corruptDetail.path}
            {corruptDetail.line ? ` (line ${corruptDetail.line})` : ''}: {corruptDetail.message}
          </div>
        </div>
      )}

      {/* Preset tabs */}
      <PresetSelector
        projectId={projectId}
        scenarioFile={scenarioFile}
        presets={presets ?? []}
        currentValues={paramOverrides}
        defaultValues={defaultValues}
        onLoad={onParamOverridesChange}
        disabled={!!corruptDetail}
      />

      {/* Parameter inputs */}
      <div className="space-y-1.5">
        {scenarioParams.map((p: ScenarioParam) => {
          const isChanged = paramOverrides[p.name] !== undefined && paramOverrides[p.name] !== p.value;
          return (
            <div key={p.name} className="flex items-center gap-2">
              <span
                className="text-xs font-mono text-[var(--color-text-secondary)] w-32 shrink-0 truncate"
                title={p.name}
              >
                {p.name}
                {isChanged && <span className="text-[var(--color-warning)] ml-0.5">*</span>}
              </span>
              <span className="text-[10px] text-[var(--color-text-tertiary)] w-10 shrink-0">
                {p.type}
              </span>
              {p.type === 'boolean' ? (
                <Checkbox
                  label=""
                  checked={paramOverrides[p.name] === 'true' || paramOverrides[p.name] === '1'}
                  onChange={(e) =>
                    onParamOverridesChange({
                      ...paramOverrides,
                      [p.name]: e.target.checked ? 'true' : 'false',
                    })
                  }
                />
              ) : (
                <TextInput
                  value={paramOverrides[p.name] ?? p.value}
                  onChange={(e) =>
                    onParamOverridesChange({
                      ...paramOverrides,
                      [p.name]: e.target.value,
                    })
                  }
                  className="font-mono text-xs"
                  placeholder={p.value}
                />
              )}
              {isChanged && (
                <button
                  type="button"
                  onClick={() => onParamOverridesChange({ ...paramOverrides, [p.name]: p.value })}
                  className="text-[var(--color-text-tertiary)] hover:text-[var(--color-foreground)] text-xs cursor-pointer shrink-0"
                  title={t('gtSim.runForm.parameters.resetTooltip')}
                >
                  &#x21BA;
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
