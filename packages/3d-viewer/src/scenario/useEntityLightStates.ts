/**
 * Hook to extract vehicle light states from Init LightStateActions.
 * Returns a Map of entity name → active light states for 3D rendering.
 */

import { useMemo } from 'react';
import { useStore } from 'zustand';
import type { ScenarioDocument, EntityInitActions } from '@osce/shared';

export interface VehicleLightState {
  indicatorLeft: 'on' | 'flashing' | null;
  indicatorRight: 'on' | 'flashing' | null;
  headLight: boolean;
  highBeam: boolean;
  brakeLight: boolean;
}

const LIGHT_TYPE_PREFIX = 'vehicleLight:';

function parseLightType(lightType: string): string | null {
  if (lightType.startsWith(LIGHT_TYPE_PREFIX)) {
    return lightType.slice(LIGHT_TYPE_PREFIX.length);
  }
  return lightType;
}

/**
 * Extract vehicle light states from Init section (pure function).
 */
export function extractEntityLightStates(
  doc: ScenarioDocument,
): Map<string, VehicleLightState> {
  const result = new Map<string, VehicleLightState>();

  for (const entityActions of doc.storyboard.init.entityActions) {
    const lightState = extractLightState(entityActions);
    if (lightState) {
      result.set(entityActions.entityRef, lightState);
    }
  }

  return result;
}

function extractLightState(entityActions: EntityInitActions): VehicleLightState | null {
  let indicatorLeft: 'on' | 'flashing' | null = null;
  let indicatorRight: 'on' | 'flashing' | null = null;
  let headLight = false;
  let highBeam = false;
  let brakeLight = false;

  for (const initAction of entityActions.privateActions) {
    if (initAction.action.type !== 'lightStateAction') continue;
    if (initAction.action.mode === 'off') continue;

    const lightType = parseLightType(initAction.action.lightType);
    const mode = initAction.action.mode;

    switch (lightType) {
      case 'indicatorLeft':
        indicatorLeft = mode;
        break;
      case 'indicatorRight':
        indicatorRight = mode;
        break;
      case 'warningLights':
        indicatorLeft = mode;
        indicatorRight = mode;
        break;
      case 'lowBeam':
      case 'daytimeRunningLights':
        headLight = true;
        break;
      case 'highBeam':
        highBeam = true;
        break;
      case 'brakeLights':
        brakeLight = true;
        break;
    }
  }

  if (!indicatorLeft && !indicatorRight && !headLight && !highBeam && !brakeLight) return null;
  return { indicatorLeft, indicatorRight, headLight, highBeam, brakeLight };
}

/**
 * React hook to subscribe to entity light states from the scenario store.
 */
export function useEntityLightStates(
  store: ReturnType<typeof import('@osce/scenario-engine').createScenarioStore>,
): Map<string, VehicleLightState> {
  const initEntityActions = useStore(
    store,
    (state: { document: ScenarioDocument }) => state.document.storyboard.init.entityActions,
  );

  return useMemo(
    () => {
      const doc = store.getState().document;
      return extractEntityLightStates(doc);
    },
    [initEntityActions, store],
  );
}
