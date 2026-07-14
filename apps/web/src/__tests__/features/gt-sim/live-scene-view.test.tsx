import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import type { GtSimOsiObject, GtSimOsiTrafficLight } from '@osce/esmini';
import { LiveSceneView } from '../../../features/gt-sim/live/components/LiveSceneView';
import type { RoadGeometry } from '../../../features/gt-sim/live/lib/sceneGeometry';
import { initTestI18n } from '../../helpers/render-with-providers';

beforeAll(async () => {
  await initTestI18n();
});

afterEach(() => {
  cleanup();
});

function makeObject(overrides: Partial<GtSimOsiObject> = {}): GtSimOsiObject {
  return {
    id: 1,
    name: 'ego',
    x: 10,
    y: 20,
    z: 0,
    h: 0,
    speed: 5,
    head_light: 'off',
    indicator: 'off',
    brake_light: 'off',
    obj_type: 'vehicle',
    vehicle_class: 'car',
    length: 4,
    width: 2,
    ...overrides,
  };
}

describe('LiveSceneView', () => {
  it('shows the "waiting for data" empty state with no objects', () => {
    render(<LiveSceneView objects={[]} className="h-40" />);
    expect(screen.getByText('Waiting for data...')).toBeInTheDocument();
  });

  it('renders one SVG group per object, hiding the empty-state text', () => {
    const objects = [makeObject({ id: 1, name: 'ego' }), makeObject({ id: 2, name: 'other', x: 30 })];
    const { container } = render(<LiveSceneView objects={objects} className="h-40" />);
    expect(screen.queryByText('Waiting for data...')).not.toBeInTheDocument();
    // One <g> per rendered object (ego + non-ego), keyed by object id.
    const objectGroups = container.querySelectorAll('svg > g[transform]');
    expect(objectGroups.length).toBe(objects.length);
  });

  it('shows no layer bar when road geometry / traffic lights / VD data are all absent', () => {
    render(<LiveSceneView objects={[makeObject()]} className="h-40" />);
    expect(screen.queryByRole('button', { name: 'Signals' })).not.toBeInTheDocument();
  });

  it('shows a layer toggle only for the overlays actually present, and toggling hides that layer', () => {
    const trafficLights: GtSimOsiTrafficLight[] = [
      { id: 1, x: 5, y: 5, z: 0, h: 0, color: 'red', mode: 'constant', icon: 0 },
    ];
    const roadGeometry: RoadGeometry = {
      boundaries: [],
      signs: [
        { id: 1, road_id: 1, x: 1, y: 1, z: 0, h: 0, s: 0, t: 0, name: 'Stop', orientation: 0, height: 1, width: 1 },
      ],
    };
    const { container } = render(
      <LiveSceneView objects={[makeObject()]} roadGeometry={roadGeometry} trafficLights={trafficLights} className="h-40" />,
    );

    // Signals + Signs toggles present; Stop lines / v_target / Maneuver absent (no data).
    expect(screen.getByRole('button', { name: 'Signals' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Signs' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Stop lines' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'v_target' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Maneuver' })).not.toBeInTheDocument();

    // The active traffic-light circle is present (fill matches the 'red' phase).
    expect(container.querySelector('circle[fill="rgb(235,50,50)"]')).not.toBeNull();

    // Toggling the Signals layer off removes the traffic-light node from the DOM.
    fireEvent.click(screen.getByRole('button', { name: 'Signals' }));
    expect(container.querySelector('circle[fill="rgb(235,50,50)"]')).toBeNull();
  });
});
