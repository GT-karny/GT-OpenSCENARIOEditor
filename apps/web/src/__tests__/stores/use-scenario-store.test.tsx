import { describe, it, expect, beforeAll } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { I18nextProvider } from '@osce/i18n';
import { initI18n, i18n } from '@osce/i18n';
import { ScenarioStoreProvider, useScenarioStoreContext } from '../../stores/scenario-store-context';
import { useScenarioStore } from '../../stores/use-scenario-store';
import type { ReactNode } from 'react';

function wrapper({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <ScenarioStoreProvider>{children}</ScenarioStoreProvider>
    </I18nextProvider>
  );
}

beforeAll(async () => {
  await initI18n('en');
});

describe('useScenarioStore', () => {
  it('should provide access to the scenario document', () => {
    const { result } = renderHook(() => useScenarioStore((s) => s.document), { wrapper });
    expect(result.current).toBeDefined();
    expect(result.current.id).toBeDefined();
    expect(result.current.storyboard).toBeDefined();
  });

  it('should provide undo/redo availability', () => {
    const { result } = renderHook(
      () => ({
        undoAvailable: useScenarioStore((s) => s.undoAvailable),
        redoAvailable: useScenarioStore((s) => s.redoAvailable),
      }),
      { wrapper },
    );
    expect(result.current.undoAvailable).toBe(false);
    expect(result.current.redoAvailable).toBe(false);
  });

  it('should allow adding entities via store api', () => {
    const { result } = renderHook(
      () => ({
        entities: useScenarioStore((s) => s.document.entities),
        storeApi: useScenarioStoreContext(),
      }),
      { wrapper },
    );

    act(() => {
      result.current.storeApi.getState().addEntity({
        name: 'TestVehicle',
        type: 'vehicle',
        definition: {
          kind: 'vehicle',
          name: 'TestVehicle',
          vehicleCategory: 'car',
          performance: { maxSpeed: 69, maxAcceleration: 200, maxDeceleration: 10 },
          boundingBox: {
            center: { x: 0, y: 0, z: 0 },
            dimensions: { width: 2, length: 4, height: 1.5 },
          },
          axles: {
            frontAxle: {
              maxSteering: 0.5,
              wheelDiameter: 0.6,
              trackWidth: 1.8,
              positionX: 3.1,
              positionZ: 0.3,
            },
            rearAxle: {
              maxSteering: 0,
              wheelDiameter: 0.6,
              trackWidth: 1.8,
              positionX: 0,
              positionZ: 0.3,
            },
            additionalAxles: [],
          },
          parameterDeclarations: [],
          properties: [],
        },
      });
    });

    expect(result.current.entities.length).toBeGreaterThan(0);
    const added = result.current.entities.find((e) => e.name === 'TestVehicle');
    expect(added).toBeDefined();
    expect(added!.type).toBe('vehicle');
  });
});
