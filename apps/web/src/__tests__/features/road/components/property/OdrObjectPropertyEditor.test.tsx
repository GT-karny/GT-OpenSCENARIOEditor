import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import type { OdrRoadObject } from '@osce/shared';
import { initTestI18n, renderWithProviders } from '../../../../helpers/render-with-providers';
import { OdrObjectPropertyEditor } from '../../../../../features/road/components/property/OdrObjectPropertyEditor';

beforeAll(async () => {
  await initTestI18n();
});
afterEach(cleanup);

/** The input rendered in the same field group as a given label. */
function labeledInput(labelText: string): HTMLInputElement {
  const label = screen.getByText(labelText);
  return label.parentElement!.querySelector('input')!;
}

const object = (over: Partial<OdrRoadObject>): OdrRoadObject => ({
  id: '10',
  s: 25.5,
  t: -1.2,
  ...over,
});

describe('OdrObjectPropertyEditor', () => {
  it('renders identity fields as read-only, with name/type/subtype/dynamic', () => {
    renderWithProviders(
      <OdrObjectPropertyEditor
        object={object({ name: 'Oak Tree', type: 'tree', subtype: 'oak', dynamic: 'no' })}
      />,
    );
    expect(screen.getByText('Read Only')).toBeInTheDocument();
    expect(labeledInput('ID').value).toBe('10');
    expect(labeledInput('ID').readOnly).toBe(true);
    expect(labeledInput('Name').value).toBe('Oak Tree');
    expect(labeledInput('Type').value).toBe('tree');
    expect(labeledInput('Subtype').value).toBe('oak');
    expect(labeledInput('Dynamic').value).toBe('no');
  });

  it('renders s/t/zOffset and orientation as read-only', () => {
    renderWithProviders(
      <OdrObjectPropertyEditor object={object({ zOffset: 0.5, orientation: '+' })} />,
    );
    expect(labeledInput('S').value).toBe('25.5');
    expect(labeledInput('T').value).toBe('-1.2');
    expect(labeledInput('Z Offset (m)').value).toBe('0.5');
    expect(labeledInput('Orientation').value).toBe('+');
  });

  it('renders box dimensions when length/width/height are present', () => {
    renderWithProviders(
      <OdrObjectPropertyEditor object={object({ length: 2, width: 1, height: 1.5 })} />,
    );
    expect(labeledInput('Length (m)').value).toBe('2');
    expect(labeledInput('Width (m)').value).toBe('1');
    expect(labeledInput('Height (m)').value).toBe('1.5');
    expect(screen.queryByText('Radius (m)')).not.toBeInTheDocument();
  });

  it('falls back to a radius (cylinder) field when only radius is given', () => {
    renderWithProviders(<OdrObjectPropertyEditor object={object({ radius: 0.3 })} />);
    expect(labeledInput('Radius (m)').value).toBe('0.3');
    expect(screen.queryByText('Length (m)')).not.toBeInTheDocument();
  });

  it('shows "no dimensions" when neither box nor radius is given', () => {
    renderWithProviders(<OdrObjectPropertyEditor object={object({})} />);
    expect(screen.getByText('No dimensions defined')).toBeInTheDocument();
  });

  it('shows a repeat-count badge only when repeat entries exist', () => {
    const { rerender } = renderWithProviders(<OdrObjectPropertyEditor object={object({})} />);
    expect(screen.queryByText(/repeat entries/)).not.toBeInTheDocument();

    rerender(
      <OdrObjectPropertyEditor
        object={object({
          repeat: [
            {
              s: 0,
              length: 10,
              distance: 2,
              tStart: 0,
              tEnd: 0,
              heightStart: 0,
              heightEnd: 0,
              zOffsetStart: 0,
              zOffsetEnd: 0,
            },
          ],
        })}
      />,
    );
    expect(screen.getByText('1 repeat entries')).toBeInTheDocument();
  });

  it('lists validity fromLane/toLane/layer when present, else a fallback message', () => {
    renderWithProviders(<OdrObjectPropertyEditor object={object({})} />);
    expect(screen.getByText('No validity restrictions defined')).toBeInTheDocument();

    cleanup();
    renderWithProviders(
      <OdrObjectPropertyEditor
        object={object({ validity: [{ fromLane: -2, toLane: -1, layer: 'permanent' }] })}
      />,
    );
    expect(screen.getByText('From Lane=-2 · To Lane=-1 (permanent)')).toBeInTheDocument();
  });

  it('shows outline/marking/border counts only when present', () => {
    renderWithProviders(<OdrObjectPropertyEditor object={object({})} />);
    expect(screen.queryByText('Content')).not.toBeInTheDocument();

    cleanup();
    renderWithProviders(
      <OdrObjectPropertyEditor
        object={object({
          outlines: [{}, {}],
          markings: [
            {
              side: 'left',
              color: 'white',
              spaceLength: 1,
              lineLength: 1,
              startOffset: 0,
              stopOffset: 0,
              cornerReferences: [],
            },
          ],
        })}
      />,
    );
    expect(screen.getByText('2 outlines')).toBeInTheDocument();
    expect(screen.getByText('1 markings')).toBeInTheDocument();
    expect(screen.queryByText(/borders/)).not.toBeInTheDocument();
  });
});
