import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { createOpenDriveStore } from '@osce/opendrive-engine';
import type { OdrJunction } from '@osce/shared';
import { initTestI18n, renderWithProviders } from '../../../../helpers/render-with-providers';
import { OdrJunctionPropertyEditor } from '../../../../../features/road/components/property/OdrJunctionPropertyEditor';

beforeAll(async () => {
  await initTestI18n();
  // Radix Select relies on these DOM APIs that jsdom does not implement.
  window.HTMLElement.prototype.hasPointerCapture = vi.fn();
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);

/** The input rendered in the same field group as a given label. */
function labeledInput(labelText: string): HTMLInputElement {
  const label = screen.getByText(labelText);
  return label.parentElement!.querySelector('input')!;
}

const junction = (over: Partial<OdrJunction>): OdrJunction => ({
  id: '900',
  name: 'j',
  type: 'default',
  connections: [],
  ...over,
});

describe('OdrJunctionPropertyEditor', () => {
  it('shows editable virtual-junction fields when type is virtual', () => {
    renderWithProviders(
      <OdrJunctionPropertyEditor
        junction={junction({ type: 'virtual', mainRoad: '1', sStart: 10, sEnd: 20, orientation: '+' })}
        onUpdate={() => {}}
      />,
    );
    expect(screen.getByText('Virtual Junction')).toBeInTheDocument();
    expect(labeledInput('Main Road').value).toBe('1');
    expect(labeledInput('Start S').value).toBe('10');
  });

  it('hides the virtual section for a default junction', () => {
    renderWithProviders(<OdrJunctionPropertyEditor junction={junction({})} onUpdate={() => {}} />);
    expect(screen.queryByText('Virtual Junction')).not.toBeInTheDocument();
  });

  it('shows a read-only roadSections summary for a crossing junction', () => {
    renderWithProviders(
      <OdrJunctionPropertyEditor
        junction={junction({ type: 'crossing', roadSections: [{ roadId: '2', sStart: 5, sEnd: 9 }] })}
        onUpdate={() => {}}
      />,
    );
    expect(screen.getByText('Road Sections')).toBeInTheDocument();
    expect(screen.getByText('s 5–9')).toBeInTheDocument();
  });

  it('shows a read-only crossPaths summary', () => {
    renderWithProviders(
      <OdrJunctionPropertyEditor
        junction={junction({
          crossPaths: [{ crossingRoad: '3', startLaneLink: {}, endLaneLink: {} }],
        })}
        onUpdate={() => {}}
      />,
    );
    expect(screen.getByText('Cross Paths')).toBeInTheDocument();
    expect(screen.getByText('Crossing Road')).toBeInTheDocument();
  });

  it('edits mainRoad through the real store command and undoes it', () => {
    const api = createOpenDriveStore();
    api.getState().addJunction({ id: '900', name: 'j', type: 'virtual' });
    const current = () => api.getState().getDocument().junctions[0];
    const original = current().mainRoad;

    renderWithProviders(
      <OdrJunctionPropertyEditor
        junction={current()}
        onUpdate={(id, updates) => api.getState().updateJunction(id, updates)}
      />,
    );

    fireEvent.change(labeledInput('Main Road'), { target: { value: '7' } });
    expect(current().mainRoad).toBe('7');

    api.getState().undo();
    expect(current().mainRoad).toBe(original);
  });

  it('clears virtual attrs (undoably) when the type is switched away from virtual', () => {
    const api = createOpenDriveStore();
    api.getState().addJunction({ id: '900', name: 'j', type: 'virtual' });
    api.getState().updateJunction('900', { mainRoad: '1', sStart: 10, sEnd: 20, orientation: '+' });
    const current = () => api.getState().getDocument().junctions[0];

    renderWithProviders(
      <OdrJunctionPropertyEditor
        junction={current()}
        onUpdate={(id, u) => api.getState().updateJunction(id, u)}
      />,
    );

    // Open the type dropdown (the first combobox) and pick 'default'.
    fireEvent.click(screen.getAllByRole('combobox')[0]);
    fireEvent.click(screen.getByRole('option', { name: 'default' }));

    expect(current().type).toBe('default');
    expect(current().mainRoad).toBeUndefined();
    expect(current().sStart).toBeUndefined();

    api.getState().undo();
    expect(current().type).toBe('virtual');
    expect(current().mainRoad).toBe('1');
  });
});
