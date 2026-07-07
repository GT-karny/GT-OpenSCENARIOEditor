import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import type { OpenDriveDocument, OdrRoad } from '@osce/shared';
import { initTestI18n, renderWithProviders } from '../../../../helpers/render-with-providers';
import { ObjectListPanel } from '../../../../../features/road/components/sidebar/ObjectListPanel';
import { useEditorStore } from '../../../../../stores/editor-store';
import { useOdrSidebarStore } from '../../../../../hooks/use-opendrive-store';

beforeAll(async () => {
  await initTestI18n();
});

afterEach(() => {
  cleanup();
  useEditorStore.getState().setRoadNetwork(null);
  useOdrSidebarStore.getState().clearSelection();
});

function makeRoad(overrides: Partial<OdrRoad> & { id: string }): OdrRoad {
  return {
    name: `Road ${overrides.id}`,
    length: 100,
    junction: '-1',
    planView: [{ s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'line' }],
    elevationProfile: [],
    lateralProfile: [],
    laneOffset: [],
    lanes: [],
    objects: [],
    signals: [],
    ...overrides,
  };
}

function makeDocument(roads: OdrRoad[]): OpenDriveDocument {
  return {
    header: { revMajor: 1, revMinor: 9, name: '', date: '' },
    roads,
    controllers: [],
    junctions: [],
  };
}

describe('ObjectListPanel', () => {
  it('shows an empty state when there are no objects or structures', () => {
    useEditorStore.getState().setRoadNetwork(makeDocument([makeRoad({ id: '1' })]));
    renderWithProviders(<ObjectListPanel searchQuery="" />);
    expect(screen.getByText('No objects defined.')).toBeInTheDocument();
  });

  it('groups objects by road, with a name/type-fallback and s value', () => {
    const road1 = makeRoad({
      id: '1',
      name: 'Main St',
      objects: [
        { id: 'o1', name: 'Tree', type: 'tree', s: 12.5, t: 2 },
        { id: 'o2', type: 'pole', s: 30, t: -1 },
      ],
    });
    const road2 = makeRoad({
      id: '2',
      name: 'Side St',
      objects: [{ id: 'o3', name: 'Bench', type: 'bench', s: 5, t: 0 }],
    });
    useEditorStore.getState().setRoadNetwork(makeDocument([road1, road2]));

    renderWithProviders(<ObjectListPanel searchQuery="" />);

    expect(screen.getByText('3 objects')).toBeInTheDocument();
    expect(screen.getByText('Main St')).toBeInTheDocument();
    expect(screen.getByText('Side St')).toBeInTheDocument();
    expect(screen.getByText('Tree')).toBeInTheDocument();
    // o2 has no name -> falls back to type as the primary label, so "pole"
    // appears twice for that row: once as the label, once as the type badge.
    expect(screen.getAllByText('pole')).toHaveLength(2);
    expect(screen.getByText('s=12.5')).toBeInTheDocument();
  });

  it('lists tunnels/bridges as display-only rows with a kind badge', () => {
    const road = makeRoad({
      id: '1',
      name: 'Main St',
      tunnels: [{ id: 'tun1', name: 'Hill Tunnel', s: 10, length: 50, type: 'standard' }],
      bridges: [{ id: 'br1', s: 60, length: 20, type: 'concrete' }],
    });
    useEditorStore.getState().setRoadNetwork(makeDocument([road]));

    renderWithProviders(<ObjectListPanel searchQuery="" />);

    expect(screen.getByText('Hill Tunnel')).toBeInTheDocument();
    expect(screen.getByText('Tunnel')).toBeInTheDocument();
    // br1 has no name -> falls back to "<kind label> <id>".
    expect(screen.getByText('Bridge br1')).toBeInTheDocument();
    expect(screen.getByText('Bridge')).toBeInTheDocument();
  });

  it('filters by search query across name/type/id', () => {
    const road = makeRoad({
      id: '1',
      objects: [
        { id: 'o1', name: 'Tree', type: 'tree', s: 1, t: 0 },
        { id: 'o2', name: 'Pole', type: 'pole', s: 2, t: 0 },
      ],
    });
    useEditorStore.getState().setRoadNetwork(makeDocument([road]));

    renderWithProviders(<ObjectListPanel searchQuery="pole" />);

    expect(screen.queryByText('Tree')).not.toBeInTheDocument();
    expect(screen.getByText('Pole')).toBeInTheDocument();
  });

  it('dispatches an object selection to the sidebar store on click', () => {
    const road = makeRoad({
      id: '1',
      objects: [{ id: 'o1', name: 'Tree', type: 'tree', s: 1, t: 0 }],
    });
    useEditorStore.getState().setRoadNetwork(makeDocument([road]));

    renderWithProviders(<ObjectListPanel searchQuery="" />);
    fireEvent.click(screen.getByText('Tree'));

    expect(useOdrSidebarStore.getState().selection).toEqual({
      type: 'object',
      id: 'o1',
      roadId: '1',
    });
  });
});
