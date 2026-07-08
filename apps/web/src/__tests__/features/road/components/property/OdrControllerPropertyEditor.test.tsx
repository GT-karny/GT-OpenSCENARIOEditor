import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { createOpenDriveStore } from '@osce/opendrive-engine';
import { initTestI18n, renderWithProviders } from '../../../../helpers/render-with-providers';
import { OdrControllerPropertyEditor } from '../../../../../features/road/components/property/OdrControllerPropertyEditor';

beforeAll(async () => {
  await initTestI18n();
});
afterEach(cleanup);

/** The input rendered in the same field group as a given label. */
function labeledInput(labelText: string): HTMLInputElement {
  const label = screen.getByText(labelText);
  return label.parentElement!.querySelector('input')!;
}

describe('OdrControllerPropertyEditor', () => {
  it('renders identity fields and the empty controls state', () => {
    const api = createOpenDriveStore();
    const ctrl = api.getState().addController({ name: 'Ctrl1' });
    renderWithProviders(
      <OdrControllerPropertyEditor
        controller={api.getState().getDocument().controllers[0]}
        onUpdate={(id, u) => api.getState().updateController(id, u)}
      />,
    );
    expect(screen.getByText('Controller Properties')).toBeInTheDocument();
    expect(labeledInput('Name').value).toBe('Ctrl1');
    expect(labeledInput('ID').value).toBe(ctrl.id);
    expect(screen.getByText('No controls defined')).toBeInTheDocument();
  });

  it('edits name and sequence through the real store command (undoable)', () => {
    const api = createOpenDriveStore();
    api.getState().addController({ name: 'Ctrl1' });
    const current = () => api.getState().getDocument().controllers[0];

    renderWithProviders(
      <OdrControllerPropertyEditor
        controller={current()}
        onUpdate={(id, u) => api.getState().updateController(id, u)}
      />,
    );

    fireEvent.change(labeledInput('Name'), { target: { value: 'Renamed' } });
    expect(current().name).toBe('Renamed');

    fireEvent.change(labeledInput('Sequence'), { target: { value: '3' } });
    expect(current().sequence).toBe(3);

    api.getState().undo();
    expect(current().sequence).toBeUndefined();
  });

  it('adds a control entry (undoable)', () => {
    const api = createOpenDriveStore();
    api.getState().addController({ name: 'Ctrl1' });
    const current = () => api.getState().getDocument().controllers[0];

    renderWithProviders(
      <OdrControllerPropertyEditor
        controller={current()}
        onUpdate={(id, u) => api.getState().updateController(id, u)}
      />,
    );

    fireEvent.click(screen.getByText('Add control'));
    expect(current().controls).toHaveLength(1);
    expect(current().controls[0].signalId).toBe('');

    api.getState().undo();
    expect(current().controls).toHaveLength(0);
  });

  it('edits and removes a control entry', () => {
    const api = createOpenDriveStore();
    api.getState().addController({ name: 'Ctrl1', controls: [{ signalId: '10', type: 'x' }] });
    const current = () => api.getState().getDocument().controllers[0];

    renderWithProviders(
      <OdrControllerPropertyEditor
        controller={current()}
        onUpdate={(id, u) => api.getState().updateController(id, u)}
      />,
    );

    fireEvent.change(labeledInput('Signal ID'), { target: { value: '42' } });
    expect(current().controls[0].signalId).toBe('42');

    fireEvent.click(screen.getByLabelText('Remove control'));
    expect(current().controls).toHaveLength(0);
  });
});
