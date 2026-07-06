import { useMemo, useCallback, useState } from 'react';
import { GitFork } from 'lucide-react';
import type { OdrJunction, OdrJunctionConnection, OpenDriveDocument } from '@osce/shared';
import { LaneLinkCanvas } from './LaneLinkCanvas';

interface LaneLinkEditorProps {
  junction: OdrJunction;
  document: OpenDriveDocument;
  onUpdate: (junctionId: string, updates: Partial<OdrJunction>) => void;
}

/**
 * Visual editor for lane links within a junction.
 * Shows an SVG canvas with incoming and connecting road lanes,
 * allowing drag-to-connect and click-to-remove interactions.
 */
export function LaneLinkEditor({ junction, document, onUpdate }: LaneLinkEditorProps) {
  const [selectedConnIdx, setSelectedConnIdx] = useState(0);

  const connections = junction.connections;
  const activeConn: OdrJunctionConnection | undefined = connections[selectedConnIdx];

  const incomingRoad = useMemo(
    () => (activeConn ? document.roads.find((r) => r.id === activeConn.incomingRoad) : undefined),
    [document.roads, activeConn],
  );

  const connectingRoad = useMemo(
    () => (activeConn ? document.roads.find((r) => r.id === activeConn.connectingRoad) : undefined),
    [document.roads, activeConn],
  );

  const handleAddLink = useCallback(
    (from: number, to: number) => {
      if (!activeConn) return;
      const updatedConnections = connections.map((c, i) =>
        i === selectedConnIdx
          ? { ...c, laneLinks: [...c.laneLinks, { from, to }] }
          : c,
      );
      onUpdate(junction.id, { connections: updatedConnections });
    },
    [activeConn, connections, selectedConnIdx, junction.id, onUpdate],
  );

  const handleRemoveLink = useCallback(
    (linkIndex: number) => {
      if (!activeConn) return;
      const updatedConnections = connections.map((c, i) =>
        i === selectedConnIdx
          ? { ...c, laneLinks: c.laneLinks.filter((_, idx) => idx !== linkIndex) }
          : c,
      );
      onUpdate(junction.id, { connections: updatedConnections });
    },
    [activeConn, connections, selectedConnIdx, junction.id, onUpdate],
  );

  if (connections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-sm text-[var(--color-text-muted)] gap-2">
        <GitFork className="h-8 w-8 opacity-30" />
        <span>No connections in this junction</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Connection selector bar */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-[var(--color-glass-edge)] bg-[var(--color-glass-1)] shrink-0 overflow-x-auto">
        <span className="text-[10px] text-[var(--color-text-muted)] mr-1 shrink-0">Connection:</span>
        {connections.map((conn, idx) => (
          <button
            key={conn.id}
            onClick={() => setSelectedConnIdx(idx)}
            className={`px-2 py-0.5 text-[11px] shrink-0 transition-colors ${
              idx === selectedConnIdx
                ? 'bg-[var(--color-accent-muted)] text-[var(--color-text-primary)]'
                : 'bg-[var(--color-glass-2)] text-[var(--color-text-secondary)] hover:bg-[var(--color-glass-hover)]'
            }`}
          >
            #{conn.id}: {conn.incomingRoad} → {conn.connectingRoad}
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeConn && (
          <LaneLinkCanvas
            connection={activeConn}
            incomingRoad={incomingRoad}
            connectingRoad={connectingRoad}
            onAddLink={handleAddLink}
            onRemoveLink={handleRemoveLink}
          />
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1 border-t border-[var(--color-glass-edge)] bg-[var(--color-glass-1)] shrink-0">
        <span className="text-[10px] text-[var(--color-text-muted)]">
          {activeConn ? `${activeConn.laneLinks.length} lane link(s)` : ''}
        </span>
        <span className="text-[10px] text-[var(--color-text-muted)]">
          Drag between lanes to add links. Click a link to remove.
        </span>
      </div>
    </div>
  );
}
