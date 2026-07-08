import { describe, it, expect, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { useState } from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import type { OdrElevation } from '@osce/shared';
import { ElevationGraphEditor } from '../../../../../features/road/components/elevation/ElevationGraphEditor';

// jsdom returns an all-zero rect by default; give the SVG a real box so the
// drag's clientY → svg-space math produces a non-degenerate elevation.
let rectSpy: ReturnType<typeof vi.spyOn>;
beforeAll(() => {
  rectSpy = vi
    .spyOn(SVGSVGElement.prototype, 'getBoundingClientRect')
    .mockReturnValue({
      top: 0,
      left: 0,
      width: 800,
      height: 200,
      right: 800,
      bottom: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);
});
afterAll(() => rectSpy.mockRestore());
afterEach(cleanup);

const elevations: OdrElevation[] = [
  { s: 0, a: 1, b: 0, c: 0, d: 0 },
  { s: 50, a: 2, b: 0, c: 0, d: 0 },
];

/** The draggable control-point circles (excludes the s-position indicator dot). */
function controlPoints(container: HTMLElement): SVGCircleElement[] {
  return [...container.querySelectorAll('circle.cursor-grab')] as SVGCircleElement[];
}

function drag(container: HTMLElement, pointIndex: number, toClientY: number) {
  const svg = container.querySelector('svg')!;
  const point = controlPoints(container)[pointIndex];
  fireEvent.mouseDown(point, { clientY: 120 });
  fireEvent.mouseMove(svg, { clientY: toClientY });
  fireEvent.mouseUp(svg);
}

describe('ElevationGraphEditor drag → commit', () => {
  it('commits once on mouse-up with the final dragged value', () => {
    const changeCalls: Array<[number, number]> = [];
    const commitCalls: Array<[number, number]> = [];
    const { container } = render(
      <ElevationGraphEditor
        elevations={elevations}
        roadLength={100}
        sPosition={0}
        onControlPointChange={(i, a) => changeCalls.push([i, a])}
        onControlPointCommit={(i, a) => commitCalls.push([i, a])}
      />,
    );

    drag(container, 0, 40);

    // Live preview fired during the move; commit fired exactly once on mouse-up.
    expect(changeCalls.length).toBeGreaterThan(0);
    expect(commitCalls).toHaveLength(1);
    // Commit carries the same index + final value as the last live change.
    const lastChange = changeCalls[changeCalls.length - 1];
    expect(commitCalls[0][0]).toBe(0);
    expect(commitCalls[0][1]).toBe(lastChange[1]);
  });

  it('issues exactly one updateRoad through a layout-style commit wiring', () => {
    const updateRoad = vi.fn();

    function Harness() {
      const [preview, setPreview] = useState<OdrElevation[] | null>(null);
      return (
        <ElevationGraphEditor
          elevations={preview ?? elevations}
          roadLength={100}
          sPosition={0}
          onControlPointChange={(index, newA) =>
            setPreview((prev) =>
              (prev ?? elevations).map((e, i) => (i === index ? { ...e, a: newA } : e)),
            )
          }
          onControlPointCommit={(index, newA) => {
            const updated = elevations.map((e, i) => (i === index ? { ...e, a: newA } : e));
            updateRoad('1', { elevationProfile: updated });
            setPreview(null);
          }}
        />
      );
    }

    const { container } = render(<Harness />);
    drag(container, 1, 30);

    expect(updateRoad).toHaveBeenCalledTimes(1);
    const [, updates] = updateRoad.mock.calls[0];
    // Only the dragged entry's `a` changed; the untouched one is preserved.
    expect(updates.elevationProfile).toHaveLength(2);
    expect(updates.elevationProfile[0].a).toBe(1);
    expect(updates.elevationProfile[1].a).not.toBe(2);
  });

  it('does not commit when the point is clicked without moving', () => {
    const commit = vi.fn();
    const { container } = render(
      <ElevationGraphEditor
        elevations={elevations}
        roadLength={100}
        sPosition={0}
        onControlPointCommit={commit}
      />,
    );
    const svg = container.querySelector('svg')!;
    fireEvent.mouseDown(controlPoints(container)[0], { clientY: 120 });
    fireEvent.mouseUp(svg);
    expect(commit).not.toHaveBeenCalled();
  });
});
