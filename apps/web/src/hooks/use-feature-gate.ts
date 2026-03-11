import { useCallback } from 'react';
import type { FeatureGateResult } from '@osce/shared';
import {
  checkFeatureGate,
  ACTION_FEATURE_REGISTRY,
  CONDITION_FEATURE_REGISTRY,
} from '@osce/scenario-engine';
import { useEditorStore } from '../stores/editor-store';

/**
 * React hook for checking feature availability against the current compatibility profile.
 */
export function useFeatureGate() {
  const profile = useEditorStore((s) => s.preferences.compatibilityProfile);

  const checkAction = useCallback(
    (actionType: string): FeatureGateResult =>
      checkFeatureGate(actionType, ACTION_FEATURE_REGISTRY, profile),
    [profile],
  );

  const checkCondition = useCallback(
    (conditionType: string): FeatureGateResult =>
      checkFeatureGate(conditionType, CONDITION_FEATURE_REGISTRY, profile),
    [profile],
  );

  return { checkAction, checkCondition, profile };
}
