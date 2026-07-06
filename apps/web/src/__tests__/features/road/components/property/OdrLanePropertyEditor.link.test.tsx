import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import type { OdrLane } from '@osce/shared';
import { initTestI18n, renderWithProviders } from '../../../../helpers/render-with-providers';
import { OdrLanePropertyEditor } from '../../../../../features/road/components/property/OdrLanePropertyEditor';

beforeAll(async () => {
  await initTestI18n();
});
afterEach(cleanup);

const lane = (link: OdrLane['link']): OdrLane => ({
  id: -1,
  type: 'driving',
  width: [{ sOffset: 0, a: 3.5, b: 0, c: 0, d: 0 }],
  roadMarks: [],
  link,
});

describe('OdrLanePropertyEditor lane-link display', () => {
  it('renders every predecessor/successor ref with its layer badge', () => {
    renderWithProviders(
      <OdrLanePropertyEditor
        lane={lane({
          predecessors: [
            { id: -1, layer: 'permanent' },
            { id: -2, layer: 'temporary' },
          ],
          successors: [{ id: -3 }],
        })}
        roadId="1"
        sectionIdx={0}
        onUpdate={() => {}}
      />,
    );

    expect(screen.getByText('Lane Link')).toBeInTheDocument();
    expect(screen.getByText('Predecessors')).toBeInTheDocument();
    expect(screen.getByText('Successors')).toBeInTheDocument();
    // Both predecessor layers render (proving both refs, not just the first).
    expect(screen.getByText('permanent')).toBeInTheDocument();
    expect(screen.getByText('temporary')).toBeInTheDocument();
    // Successor ref (id only, no layer) renders.
    expect(screen.getByText('-3')).toBeInTheDocument();
  });

  it('omits the link section when there are no refs', () => {
    renderWithProviders(
      <OdrLanePropertyEditor
        lane={lane({ predecessors: [], successors: [] })}
        roadId="1"
        sectionIdx={0}
        onUpdate={() => {}}
      />,
    );
    expect(screen.queryByText('Lane Link')).not.toBeInTheDocument();
  });
});
