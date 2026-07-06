import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { cleanup, fireEvent } from '@testing-library/react';
import type { OdrRoad, OdrSpeedMaxSpecial } from '@osce/shared';
import { initTestI18n, renderWithProviders } from '../../../../helpers/render-with-providers';
import { OdrRoadPropertyEditor } from '../../../../../features/road/components/property/OdrRoadPropertyEditor';

beforeAll(async () => {
  await initTestI18n();
});
afterEach(cleanup);

const road = (max: number | OdrSpeedMaxSpecial): OdrRoad => ({
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
  type: [{ s: 0, type: 'motorway', speed: { max, unit: 'm/s' } }],
});

const numberInputs = (root: HTMLElement) =>
  [...root.querySelectorAll('input[type="number"]')] as HTMLInputElement[];

describe('OdrRoadPropertyEditor road-type speed max', () => {
  it('shows an editable number input for a numeric max', () => {
    const { container } = renderWithProviders(
      <OdrRoadPropertyEditor road={road(30)} onUpdate={() => {}} />,
    );
    const inputs = numberInputs(container);
    expect(inputs).toHaveLength(1);
    expect(inputs[0].value).toBe('30');
  });

  it('drops the number input for a special literal ("no limit")', () => {
    const { container } = renderWithProviders(
      <OdrRoadPropertyEditor road={road('no limit')} onUpdate={() => {}} />,
    );
    expect(numberInputs(container)).toHaveLength(0);
  });

  it('edits the numeric max through onUpdate', () => {
    let updated: OdrRoad['type'];
    const { container } = renderWithProviders(
      <OdrRoadPropertyEditor road={road(30)} onUpdate={(_, u) => (updated = u.type)} />,
    );
    fireEvent.change(numberInputs(container)[0], { target: { value: '25' } });
    expect(updated?.[0].speed?.max).toBe(25);
  });
});
