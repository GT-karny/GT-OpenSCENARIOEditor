import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { createOpenDriveStore } from '@osce/opendrive-engine';
import type { OdrSemanticsEntry, OdrSignal } from '@osce/shared';
import { initTestI18n, renderWithProviders } from '../../../../helpers/render-with-providers';
import { OdrSignalPropertyEditor } from '../../../../../features/road/components/property/OdrSignalPropertyEditor';

beforeAll(async () => {
  await initTestI18n();
  // Radix Select relies on these DOM APIs that jsdom does not implement.
  window.HTMLElement.prototype.hasPointerCapture = vi.fn();
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);

/** The combobox trigger rendered in the same field group as a given label. */
function comboboxAfterLabel(labelText: string): HTMLElement {
  const label = screen.getByText(labelText);
  return label.parentElement!.querySelector('[role="combobox"]') as HTMLElement;
}

const entriesOf = (s: OdrSignal): OdrSemanticsEntry[] => s.semantics?.entries ?? [];

/** Store with one road + one signal; the editor is (re)rendered against the live signal. */
function setup(initial?: OdrSignal['semantics']) {
  const api = createOpenDriveStore();
  api.getState().addRoad({ id: '1' });
  api.getState().addSignal('1', { id: '100' });
  if (initial) api.getState().updateSignal('1', '100', { semantics: initial });
  const current = () => api.getState().getDocument().roads[0].signals[0];
  const view = renderWithProviders(
    <OdrSignalPropertyEditor
      signal={current()}
      roadId="1"
      onUpdate={(r, s, u) => api.getState().updateSignal(r, s, u)}
    />,
  );
  const rerender = () =>
    view.rerender(
      <OdrSignalPropertyEditor
        signal={current()}
        roadId="1"
        onUpdate={(r, s, u) => api.getState().updateSignal(r, s, u)}
      />,
    );
  return { api, current, rerender };
}

describe('SignalSemanticsEditor', () => {
  it('adds a default speed entry through the real store, and undoes it', () => {
    const { api, current, rerender } = setup();

    fireEvent.click(screen.getByText('Add entry'));
    expect(entriesOf(current())).toHaveLength(1);
    expect(entriesOf(current())[0]).toMatchObject({ kind: 'speed', type: 'maximum' });

    api.getState().undo();
    expect(entriesOf(current())).toHaveLength(0);
    rerender();
    expect(screen.getByText('No semantics defined')).toBeInTheDocument();
  });

  it('resets fields to kind defaults when the kind is switched', () => {
    const { current, rerender } = setup({
      entries: [{ kind: 'speed', type: 'maximum', value: 50, unit: 'km/h' }],
    });

    fireEvent.click(comboboxAfterLabel('Kind'));
    fireEvent.click(screen.getByRole('option', { name: 'prohibited' }));
    // Speed's value/unit are dropped; a participant list replaces them.
    expect(entriesOf(current())[0]).toEqual({ kind: 'prohibited', participants: [] });
    rerender();
    expect(screen.getByText('Participants')).toBeInTheDocument();
  });

  it('adds a vehicle participant with an editable category', () => {
    const { current, rerender } = setup({ entries: [{ kind: 'prohibited', participants: [] }] });

    fireEvent.click(screen.getByText('+ Vehicle'));
    expect(entriesOf(current())[0]).toMatchObject({
      kind: 'prohibited',
      participants: [{ kind: 'vehicle', category: 'bicycle' }],
    });
    rerender();

    fireEvent.click(comboboxAfterLabel('Participants'));
    fireEvent.click(screen.getByRole('option', { name: 'bus' }));
    const entry = entriesOf(current())[0] as Extract<OdrSemanticsEntry, { kind: 'prohibited' }>;
    expect(entry.participants).toEqual([{ kind: 'vehicle', category: 'bus' }]);
  });

  it('removes an entry (and clears the block when empty)', () => {
    const { current } = setup({ entries: [{ kind: 'warning' }] });

    fireEvent.click(screen.getByLabelText('Remove entry'));
    expect(entriesOf(current())).toHaveLength(0);
    expect(current().semantics).toBeUndefined();
  });
});
