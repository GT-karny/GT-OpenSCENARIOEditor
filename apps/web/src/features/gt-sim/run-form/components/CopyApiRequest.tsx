/**
 * "Copy as curl-able JSON" helper — lets a developer grab the exact
 * `POST /api/simulations` body the form would submit, for scripting/debugging
 * outside the UI.
 *
 * Ported from the GT_Sim fork's `components/project/CopyApiRequest.tsx`. The
 * `localStorage` key is kept as-is (harmless local dev convenience, not a
 * cross-cluster contract) but namespaced to avoid colliding with any future
 * fork-parity key elsewhere in the editor.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from '@osce/i18n';
import type { GtSimSimulationRequest, ScenarioParam } from '@osce/esmini';
import { Button, TextInput } from '../../ui';

const STORAGE_KEY = 'gtSim.runForm.copyApiRequest.baseUrl';
const DEFAULT_BASE = 'http://127.0.0.1:8000';

interface CopyApiRequestProps {
  getRequest: () => GtSimSimulationRequest | null;
  scenarioParams: ScenarioParam[];
  paramSource: Record<string, string>;
}

export function CopyApiRequest({ getRequest, scenarioParams, paramSource }: CopyApiRequestProps) {
  const { t } = useTranslation('common');
  const [baseUrl, setBaseUrl] = useState(() => localStorage.getItem(STORAGE_KEY) || DEFAULT_BASE);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, baseUrl);
  }, [baseUrl]);

  const handleCopy = async () => {
    const request = getRequest();
    if (!request) return;

    // Full expansion: include all scenario params with current values.
    if (scenarioParams.length > 0) {
      const allParams: Record<string, string> = {};
      for (const p of scenarioParams) {
        allParams[p.name] = paramSource[p.name] ?? p.value;
      }
      request.param_overrides = allParams;
    }

    const json = JSON.stringify(request, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
    } catch {
      // Clipboard access denied/unavailable — silently ignore (no toast; this
      // is a dev-convenience action, not a user-facing operation).
    }
  };

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-display font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
        {t('gtSim.runForm.copyRequest.heading')}
      </h4>

      <div className="space-y-1">
        <label className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
          <span className="shrink-0">{t('gtSim.runForm.copyRequest.baseUrlLabel')}</span>
          <TextInput
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="font-mono text-xs"
            wrapperClassName="flex-1 min-w-0"
          />
        </label>
        <p className="text-[11px] font-mono text-[var(--color-text-tertiary)]">
          POST {baseUrl}/api/simulations
        </p>
        <p className="text-[11px] font-mono text-[var(--color-text-tertiary)]">
          {t('gtSim.runForm.copyRequest.contentTypeLine')}
        </p>
      </div>

      <Button size="sm" variant="secondary" onClick={handleCopy} className="w-full">
        {copied ? t('gtSim.runForm.copyRequest.copied') : t('gtSim.runForm.copyRequest.copy')}
      </Button>
    </div>
  );
}
