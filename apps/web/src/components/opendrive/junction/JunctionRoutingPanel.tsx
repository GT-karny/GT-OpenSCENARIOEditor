import { useCallback, useMemo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { TurnType, RoadEndpoint } from '@osce/opendrive-engine';
import { buildRoutingOverrides, classifyTurn } from '@osce/opendrive-engine';
import { useOdrSidebarStore } from '../../../hooks/use-opendrive-store';
import type { JunctionRoutingPreset } from '../../../hooks/use-opendrive-store';

const TURN_TYPES: TurnType[] = ['straight', 'left', 'right'];
const TURN_LABELS: Record<TurnType, string> = {
  straight: 'Str',
  left: 'Left',
  right: 'Right',
};

interface JunctionRoutingPanelProps {
  endpoints: RoadEndpoint[];
}

export function JunctionRoutingPanel({ endpoints }: JunctionRoutingPanelProps) {
  const routingPreset = useOdrSidebarStore((s) => s.junctionCreate.routingPreset);
  const laneOverrides = useOdrSidebarStore((s) => s.junctionCreate.laneOverrides);
  const setJunctionRoutingPreset = useOdrSidebarStore((s) => s.setJunctionRoutingPreset);
  const setLaneOverrides = useOdrSidebarStore((s) => s.setLaneOverrides);
  const setLaneTurnPermission = useOdrSidebarStore((s) => s.setLaneTurnPermission);

  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(() => new Set());

  // Compute available turn types per endpoint
  const endpointTurnTypes = useMemo(() => {
    const result = new Map<string, Set<TurnType>>();
    for (const incoming of endpoints) {
      const key = `${incoming.roadId}:${incoming.contactPoint}`;
      const turns = new Set<TurnType>();
      for (const outgoing of endpoints) {
        if (incoming.roadId === outgoing.roadId) continue;
        const outHdg = outgoing.hdg + Math.PI;
        turns.add(classifyTurn(incoming.hdg, outHdg));
      }
      result.set(key, turns);
    }
    return result;
  }, [endpoints]);

  const handlePresetChange = useCallback(
    (preset: JunctionRoutingPreset) => {
      setJunctionRoutingPreset(preset);
      if (preset === 'custom') return;
      const overrides = buildRoutingOverrides(
        preset,
        endpoints,
        (inHdg, outHdg) => classifyTurn(inHdg, outHdg),
      );
      setLaneOverrides(overrides);
    },
    [endpoints, setJunctionRoutingPreset, setLaneOverrides],
  );

  const toggleExpand = useCallback((key: string) => {
    setExpandedEndpoints((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleToggleTurn = useCallback(
    (roadId: string, contactPoint: 'start' | 'end', laneId: number, turnType: TurnType) => {
      const ep = laneOverrides.find(
        (o) => o.roadId === roadId && o.contactPoint === contactPoint,
      );
      const perm = ep?.lanePermissions.find((p) => p.laneId === laneId);
      const current = perm?.allowedTurns ?? TURN_TYPES;
      const next = current.includes(turnType)
        ? current.filter((t) => t !== turnType)
        : [...current, turnType];
      setLaneTurnPermission(roadId, contactPoint, laneId, next);
    },
    [laneOverrides, setLaneTurnPermission],
  );

  const getPermission = useCallback(
    (roadId: string, contactPoint: 'start' | 'end', laneId: number): TurnType[] => {
      const ep = laneOverrides.find(
        (o) => o.roadId === roadId && o.contactPoint === contactPoint,
      );
      const perm = ep?.lanePermissions.find((p) => p.laneId === laneId);
      return perm?.allowedTurns ?? TURN_TYPES;
    },
    [laneOverrides],
  );

  const presets: JunctionRoutingPreset[] = ['all', 'dedicated', 'custom'];

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="flex items-center h-8 px-3 text-xs font-medium text-[var(--color-text-secondary)] border-b border-[var(--color-glass-edge)]">
        Routing
      </div>

      {/* Preset buttons */}
      <div className="flex items-center gap-1 px-3 py-2">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            className={`h-6 px-2 text-[10px] transition-colors
              ${
                routingPreset === p
                  ? 'glass-item selected text-[var(--color-text-primary)] bg-[var(--color-glass-active)]'
                  : 'text-[var(--color-text-muted)] bg-[var(--color-glass-1)] border border-[var(--color-glass-edge)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-glass-2)]'
              }`}
            onClick={() => handlePresetChange(p)}
          >
            {p === 'all' ? 'All Lanes' : p === 'dedicated' ? 'Dedicated' : 'Custom'}
          </button>
        ))}
      </div>

      <div className="divider-glow" />

      {/* Per-endpoint lane permissions */}
      <div className="flex-1 overflow-auto px-1 py-1">
        {endpoints.map((ep) => {
          const key = `${ep.roadId}:${ep.contactPoint}`;
          const isExpanded = expandedEndpoints.has(key);
          const availTurns = endpointTurnTypes.get(key) ?? new Set<TurnType>();
          const activeTurns = TURN_TYPES.filter((t) => availTurns.has(t));

          return (
            <div key={key} className="mb-0.5">
              {/* Endpoint header */}
              <button
                type="button"
                className="flex items-center gap-1 w-full h-6 px-2 text-[10px] text-[var(--color-text-secondary)] hover:bg-[var(--color-glass-hover)] transition-colors"
                onClick={() => toggleExpand(key)}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 shrink-0" />
                ) : (
                  <ChevronRight className="w-3 h-3 shrink-0" />
                )}
                <span className="truncate">
                  Road {ep.roadId} ({ep.contactPoint}) — {ep.drivingLanes.length} lane
                  {ep.drivingLanes.length !== 1 ? 's' : ''}
                </span>
              </button>

              {/* Lane permission grid */}
              {isExpanded && (
                <div className="pl-5 pr-2 pb-1">
                  {/* Column headers */}
                  <div className="flex items-center gap-0 mb-0.5">
                    <div className="w-14 text-[9px] text-[var(--color-text-muted)]">Lane</div>
                    {activeTurns.map((t) => (
                      <div
                        key={t}
                        className="flex-1 text-center text-[9px] text-[var(--color-text-muted)]"
                      >
                        {TURN_LABELS[t]}
                      </div>
                    ))}
                  </div>

                  {/* Lane rows (sorted inner-to-outer) */}
                  {[...ep.drivingLanes]
                    .sort((a, b) => Math.abs(a.id) - Math.abs(b.id))
                    .map((lane) => {
                      const perms = getPermission(ep.roadId, ep.contactPoint, lane.id);
                      return (
                        <div key={lane.id} className="flex items-center gap-0 h-5">
                          <div className="w-14 text-[10px] text-[var(--color-text-secondary)] tabular-nums">
                            Lane {lane.id}
                          </div>
                          {activeTurns.map((t) => {
                            const checked = perms.includes(t);
                            return (
                              <div key={t} className="flex-1 flex justify-center">
                                <button
                                  type="button"
                                  className={`w-3.5 h-3.5 border flex items-center justify-center transition-colors
                                    ${
                                      checked
                                        ? 'border-[var(--color-accent-vivid)] bg-[var(--color-accent-vivid)]'
                                        : 'border-[var(--color-glass-edge-mid)] hover:border-[var(--color-text-muted)] bg-transparent'
                                    }`}
                                  onClick={() =>
                                    handleToggleTurn(ep.roadId, ep.contactPoint, lane.id, t)
                                  }
                                >
                                  {checked && (
                                    <svg
                                      viewBox="0 0 12 12"
                                      className="w-2.5 h-2.5 text-white"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth={2}
                                    >
                                      <path d="M2 6l3 3 5-5" />
                                    </svg>
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
