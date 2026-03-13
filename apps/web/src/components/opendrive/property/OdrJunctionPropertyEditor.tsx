import type { OdrJunction } from '@osce/shared';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Badge } from '../../ui/badge';
import { EnumSelect } from '../../property/EnumSelect';

const JUNCTION_TYPES: readonly string[] = ['default', 'virtual'];

interface OdrJunctionPropertyEditorProps {
  junction: OdrJunction;
  onUpdate: (junctionId: string, updates: Partial<OdrJunction>) => void;
}

export function OdrJunctionPropertyEditor({
  junction,
  onUpdate,
}: OdrJunctionPropertyEditorProps) {
  return (
    <div className="space-y-4">
      {/* Section: Identity */}
      <div className="pb-3 border-b border-[var(--color-glass-edge)]">
        <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
          Junction Properties
        </h3>
        <div className="space-y-2">
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">ID</Label>
            <Input
              value={junction.id}
              readOnly
              className="h-7 text-xs bg-[var(--color-glass-1)] opacity-60"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">Name</Label>
            <Input
              value={junction.name}
              onChange={(e) => onUpdate(junction.id, { name: e.target.value })}
              className="h-7 text-xs"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">Type</Label>
            <EnumSelect
              value={junction.type ?? 'default'}
              options={JUNCTION_TYPES}
              onValueChange={(v) => onUpdate(junction.id, { type: v })}
              className="h-7 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Section: Connections */}
      <div className="pb-3 border-b border-[var(--color-glass-edge)]">
        <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
          Connections
          <Badge variant="secondary" className="ml-2 text-[10px] py-0">
            {junction.connections.length}
          </Badge>
        </h3>
        {junction.connections.length === 0 ? (
          <p className="text-xs text-[var(--color-text-secondary)] italic">
            No connections defined
          </p>
        ) : (
          <div className="space-y-2">
            {junction.connections.map((conn) => (
              <div key={conn.id} className="p-2 bg-[var(--color-glass-1)] space-y-2">
                {/* Connection header */}
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] py-0">
                    #{conn.id}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] py-0">
                    {conn.contactPoint}
                  </Badge>
                </div>

                {/* Connection details table */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div className="text-[var(--color-text-secondary)]">Incoming Road</div>
                  <div>{conn.incomingRoad}</div>
                  <div className="text-[var(--color-text-secondary)]">Connecting Road</div>
                  <div>{conn.connectingRoad}</div>
                  <div className="text-[var(--color-text-secondary)]">Contact Point</div>
                  <div>{conn.contactPoint}</div>
                </div>

                {/* Lane links */}
                {conn.laneLinks.length > 0 && (
                  <div className="mt-1">
                    <p className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
                      Lane Links
                    </p>
                    <div className="space-y-0.5">
                      {conn.laneLinks.map((ll, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-[11px] pl-2"
                        >
                          <span className="text-[var(--color-text-secondary)]">
                            Lane {ll.from}
                          </span>
                          <span className="text-[var(--color-text-secondary)]">
                            &rarr;
                          </span>
                          <span>Lane {ll.to}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
