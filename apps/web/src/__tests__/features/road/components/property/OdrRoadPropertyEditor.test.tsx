import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import type { OdrRoad } from '@osce/shared';
import { initTestI18n, renderWithProviders } from '../../../../helpers/render-with-providers';
import { OdrRoadPropertyEditor } from '../../../../../features/road/components/property/OdrRoadPropertyEditor';

beforeAll(async () => {
  await initTestI18n();
});
afterEach(cleanup);

const road = (over: Partial<OdrRoad> = {}): OdrRoad => ({
  id: '1',
  name: 'R',
  length: 100,
  junction: '-1',
  planView: [{ s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'line' }],
  elevationProfile: [],
  lateralProfile: [],
  laneOffset: [],
  lanes: [],
  objects: [],
  signals: [],
  ...over,
});

describe('OdrRoadPropertyEditor road-type entries', () => {
  it('adds a default type entry (town, 40 km/h)', () => {
    const onUpdate = vi.fn();
    renderWithProviders(<OdrRoadPropertyEditor road={road({ type: [] })} onUpdate={onUpdate} />);

    fireEvent.click(screen.getByText('Add type entry'));

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const [, updates] = onUpdate.mock.calls[0];
    expect(updates.type).toEqual([{ s: 0, type: 'town', speed: { max: 40, unit: 'km/h' } }]);
  });

  it('removes a type entry by index', () => {
    const onUpdate = vi.fn();
    const entries = [
      { s: 0, type: 'town', speed: { max: 40, unit: 'km/h' } },
      { s: 50, type: 'motorway', speed: { max: 100, unit: 'km/h' } },
    ];
    renderWithProviders(<OdrRoadPropertyEditor road={road({ type: entries })} onUpdate={onUpdate} />);

    fireEvent.click(screen.getAllByLabelText('Remove type entry')[0]);

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const [, updates] = onUpdate.mock.calls[0];
    expect(updates.type).toEqual([entries[1]]);
  });
});

describe('OdrRoadPropertyEditor plan view', () => {
  it('shows the segment count', () => {
    renderWithProviders(<OdrRoadPropertyEditor road={road()} onUpdate={() => {}} />);
    expect(screen.getByText('1 segments')).toBeInTheDocument();
  });

  it('requests a new line segment by shape only (command re-chains placement)', () => {
    const onAddGeometry = vi.fn();
    renderWithProviders(
      <OdrRoadPropertyEditor road={road()} onUpdate={() => {}} onAddGeometry={onAddGeometry} />,
    );

    fireEvent.click(screen.getByText('Add segment'));

    expect(onAddGeometry).toHaveBeenCalledTimes(1);
    const [roadId, geometry] = onAddGeometry.mock.calls[0];
    expect(roadId).toBe('1');
    // The editor supplies only the segment shape; the add-geometry command owns
    // the s / x / y / hdg re-chaining onto the prior segment, so no pose is sent.
    expect(geometry).toEqual({ type: 'line', length: 50 });
  });

  it('hides Add segment when no handler is provided', () => {
    renderWithProviders(<OdrRoadPropertyEditor road={road()} onUpdate={() => {}} />);
    expect(screen.queryByText('Add segment')).not.toBeInTheDocument();
  });
});
