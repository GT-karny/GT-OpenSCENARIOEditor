import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { createOpenDriveStore } from '@osce/opendrive-engine';
import type { OdrLane } from '@osce/shared';
import { initTestI18n, renderWithProviders } from '../../../../helpers/render-with-providers';
import { OdrLanePropertyEditor } from '../../../../../features/road/components/property/OdrLanePropertyEditor';

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

const baseLane = (over: Partial<OdrLane>): OdrLane => ({
  id: 1,
  type: 'driving',
  width: [{ sOffset: 0, a: 3.5, b: 0, c: 0, d: 0 }],
  roadMarks: [],
  ...over,
});

describe('OdrLanePropertyEditor lane attribute editing', () => {
  it('edits direction and advisory through the real store and undoes them', () => {
    const api = createOpenDriveStore();
    api.getState().addRoad({ id: '1' });
    const current = () => api.getState().getDocument().roads[0].lanes[0].leftLanes[0];

    renderWithProviders(
      <OdrLanePropertyEditor
        lane={current()}
        roadId="1"
        sectionIdx={0}
        onUpdate={(rid, sid, lid, u) => api.getState().updateLane(rid, sid, 'left', lid, u)}
      />,
    );

    fireEvent.click(comboboxAfterLabel('Direction'));
    fireEvent.click(screen.getByRole('option', { name: 'standard' }));
    expect(current().direction).toBe('standard');
    api.getState().undo();
    expect(current().direction).toBeUndefined();

    fireEvent.click(comboboxAfterLabel('Advisory'));
    fireEvent.click(screen.getByRole('option', { name: 'inner' }));
    expect(current().advisory).toBe('inner');
    api.getState().undo();
    expect(current().advisory).toBeUndefined();
  });

  it('sets roadWorks to undefined (not false) when unchecked', () => {
    const api = createOpenDriveStore();
    api.getState().addRoad({ id: '1' });
    const current = () => api.getState().getDocument().roads[0].lanes[0].leftLanes[0];
    const onUpdate = (
      rid: string,
      sid: number,
      lid: number,
      u: Partial<OdrLane>,
    ): void => {
      api.getState().updateLane(rid, sid, 'left', lid, u);
    };

    const { rerender } = renderWithProviders(
      <OdrLanePropertyEditor lane={current()} roadId="1" sectionIdx={0} onUpdate={onUpdate} />,
    );

    fireEvent.click(screen.getByLabelText('Road Works (lane under construction)'));
    expect(current().roadWorks).toBe(true);
    rerender(<OdrLanePropertyEditor lane={current()} roadId="1" sectionIdx={0} onUpdate={onUpdate} />);

    fireEvent.click(screen.getByLabelText('Road Works (lane under construction)'));
    expect(current().roadWorks).toBeUndefined();
  });

  it('adds an access entry, adds a restriction chip, then removes it', () => {
    const api = createOpenDriveStore();
    api.getState().addRoad({ id: '1' });
    const current = () => api.getState().getDocument().roads[0].lanes[0].leftLanes[0];

    const { rerender } = renderWithProviders(
      <OdrLanePropertyEditor
        lane={current()}
        roadId="1"
        sectionIdx={0}
        onUpdate={(rid, sid, lid, u) => api.getState().updateLane(rid, sid, 'left', lid, u)}
      />,
    );

    const rerenderWithCurrent = () =>
      rerender(
        <OdrLanePropertyEditor
          lane={current()}
          roadId="1"
          sectionIdx={0}
          onUpdate={(rid, sid, lid, u) => api.getState().updateLane(rid, sid, 'left', lid, u)}
        />,
      );

    fireEvent.click(screen.getByText('Add access entry'));
    expect(current().access).toHaveLength(1);
    rerenderWithCurrent();

    fireEvent.click(comboboxAfterLabel('Restrictions'));
    fireEvent.click(screen.getByRole('option', { name: 'bus' }));
    expect(current().access![0].restrictions).toEqual([{ type: 'bus' }]);
    rerenderWithCurrent();

    expect(screen.getByText('bus')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Remove restriction bus'));
    expect(current().access![0].restrictions).toEqual([]);
  });

  it('hides width/speed/access/flags sections for the center lane', () => {
    renderWithProviders(
      <OdrLanePropertyEditor
        lane={baseLane({ id: 0, type: 'none' })}
        roadId="1"
        sectionIdx={0}
        onUpdate={() => {}}
      />,
    );

    expect(screen.getByText('Lane Properties')).toBeInTheDocument();
    expect(screen.getByText('Road Marks')).toBeInTheDocument();
    expect(screen.queryByText('Lane Flags')).not.toBeInTheDocument();
    expect(screen.queryByText('Width')).not.toBeInTheDocument();
    expect(screen.queryByText('Speed Limits')).not.toBeInTheDocument();
    expect(screen.queryByText('Access Restrictions')).not.toBeInTheDocument();
  });

  it('renders a deprecated badge for sidewalk naming its replacement', () => {
    renderWithProviders(
      <OdrLanePropertyEditor
        lane={baseLane({ type: 'sidewalk' })}
        roadId="1"
        sectionIdx={0}
        onUpdate={() => {}}
      />,
    );

    const badge = screen.getByText('Deprecated');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('title', "Deprecated — use walking instead");
  });

  it('does not render a deprecated badge for a non-deprecated type', () => {
    renderWithProviders(
      <OdrLanePropertyEditor
        lane={baseLane({ type: 'driving' })}
        roadId="1"
        sectionIdx={0}
        onUpdate={() => {}}
      />,
    );
    expect(screen.queryByText('Deprecated')).not.toBeInTheDocument();
  });
});
