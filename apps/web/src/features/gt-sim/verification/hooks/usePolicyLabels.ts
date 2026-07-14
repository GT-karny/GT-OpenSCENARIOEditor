/**
 * i18n label lookup for traffic-policy constraint sources and kinds, shared by
 * `ActivePolicyPanel` and `PolicyTimelinePanel`.
 *
 * The fork hardcoded English labels inside `lib/policyDisplay.ts`; here labels
 * come from i18n while `lib/policyDisplay.ts` stays a pure (React-free) module
 * that only owns colors and value formatting. Typed i18n rejects dynamic
 * template-literal keys (`t(\`gtSim.vd...${x}\`)`), so the known ids are
 * enumerated with static `t()` calls (same approach as cluster D's metric
 * labels). Unknown ids fall back to the raw id, matching the fork.
 */
import { useMemo } from 'react';
import { useTranslation } from '@osce/i18n';
import type { PolicyConstraintKind } from '@osce/esmini';

export interface PolicyLabels {
  /** Human-readable source name; falls back to the raw id for unknown sources. */
  sourceLabel: (source: string) => string;
  /** Short badge label for the constraint kind; falls back to the raw kind. */
  kindLabel: (kind: PolicyConstraintKind) => string;
}

export function usePolicyLabels(): PolicyLabels {
  const { t } = useTranslation('common');
  return useMemo(() => {
    const sourceLabels: Record<string, string> = {
      traffic_light: t('gtSim.vd.policy.sources.trafficLight'),
      stop_sign: t('gtSim.vd.policy.sources.stopSign'),
      yield_sign: t('gtSim.vd.policy.sources.yieldSign'),
      lead_vehicle: t('gtSim.vd.policy.sources.leadVehicle'),
      conflict_point: t('gtSim.vd.policy.sources.conflictPoint'),
      crosswalk: t('gtSim.vd.policy.sources.crosswalk'),
    };
    const kindLabels: Record<PolicyConstraintKind, string> = {
      none: t('gtSim.vd.policy.kinds.none'),
      stop_at_s: t('gtSim.vd.policy.kinds.stop'),
      max_speed: t('gtSim.vd.policy.kinds.speedLimit'),
      max_speed_to_s: t('gtSim.vd.policy.kinds.speedLimit'),
      yield: t('gtSim.vd.policy.kinds.yield'),
      wait_until: t('gtSim.vd.policy.kinds.wait'),
    };
    return {
      sourceLabel: (source: string) => sourceLabels[source] ?? source,
      kindLabel: (kind: PolicyConstraintKind) => kindLabels[kind] ?? kind,
    };
  }, [t]);
}
