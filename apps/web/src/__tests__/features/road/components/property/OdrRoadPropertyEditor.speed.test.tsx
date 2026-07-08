import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { useState } from 'react';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import type { OdrRoad, OdrSpeedMaxSpecial } from '@osce/shared';
import { initTestI18n, renderWithProviders } from '../../../../helpers/render-with-providers';
import { OdrRoadPropertyEditor } from '../../../../../features/road/components/property/OdrRoadPropertyEditor';

beforeAll(async () => {
  await initTestI18n();
  // Radix Select relies on these DOM APIs that jsdom does not implement.
  window.HTMLElement.prototype.hasPointerCapture = vi.fn();
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
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

  it('restores the last numeric max when switching special → numeric (P4-7 stash)', () => {
    // A stateful host keeps the same editor instance mounted so its per-entry
    // stash (useRef) survives the numeric → special → numeric round-trip.
    function Harness() {
      const [r, setR] = useState<OdrRoad>(road(30));
      return (
        <OdrRoadPropertyEditor
          road={r}
          onUpdate={(_, u) => setR((prev) => ({ ...prev, ...u }))}
        />
      );
    }

    const { container } = renderWithProviders(<Harness />);
    expect(numberInputs(container)[0].value).toBe('30');

    // numeric → 'no limit' (special): the number input disappears.
    fireEvent.click(screen.getAllByRole('combobox')[2]);
    fireEvent.click(screen.getByRole('option', { name: 'no limit' }));
    expect(numberInputs(container)).toHaveLength(0);

    // 'no limit' → numeric: the stashed 30 comes back (not a reset to 0).
    fireEvent.click(screen.getAllByRole('combobox')[2]);
    fireEvent.click(screen.getByRole('option', { name: 'numeric' }));
    const restored = numberInputs(container);
    expect(restored).toHaveLength(1);
    expect(restored[0].value).toBe('30');
  });
});
