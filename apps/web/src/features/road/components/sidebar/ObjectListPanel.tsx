import { useMemo } from 'react';
import { Box, Mountain, Landmark } from 'lucide-react';
import { useTranslation } from '@osce/i18n';
import { Badge } from '../../../../components/ui/badge';
import { ScrollArea } from '../../../../components/ui/scroll-area';
import {
  useOdrRoadObjects,
  useOdrRoadStructures,
  useOdrSidebarStore,
  type OdrRoadObjectWithRoad,
  type OdrRoadStructureEntry,
} from '../../../../hooks/use-opendrive-store';
import { cn } from '@/lib/utils';

interface ObjectListPanelProps {
  searchQuery: string;
}

interface RoadGroup {
  roadId: string;
  roadName: string;
  objects: OdrRoadObjectWithRoad[];
  structures: OdrRoadStructureEntry[];
}

/**
 * Lists document-authored `<object>` entries (P3: read-only), grouped by road,
 * plus `<tunnel>`/`<bridge>` entries as display-only rows (no 3D representation
 * yet — see 1.9-P3 design notes D4). Modeled on RoadListPanel.
 */
export function ObjectListPanel({ searchQuery }: ObjectListPanelProps) {
  const { t } = useTranslation('common');
  const objects = useOdrRoadObjects();
  const structures = useOdrRoadStructures();
  const selection = useOdrSidebarStore((s) => s.selection);
  const setSelection = useOdrSidebarStore((s) => s.setSelection);

  const query = searchQuery.trim().toLowerCase();

  const filteredObjects = useMemo(() => {
    if (!query) return objects;
    return objects.filter(
      (obj) =>
        (obj.name ?? '').toLowerCase().includes(query) ||
        (obj.type ?? '').toLowerCase().includes(query) ||
        obj.id.toLowerCase().includes(query),
    );
  }, [objects, query]);

  const filteredStructures = useMemo(() => {
    if (!query) return structures;
    return structures.filter(
      (entry) =>
        (entry.name ?? '').toLowerCase().includes(query) ||
        entry.type.toLowerCase().includes(query) ||
        entry.id.toLowerCase().includes(query),
    );
  }, [structures, query]);

  const groups = useMemo(() => {
    const map = new Map<string, RoadGroup>();
    const getGroup = (roadId: string, roadName: string): RoadGroup => {
      let group = map.get(roadId);
      if (!group) {
        group = { roadId, roadName, objects: [], structures: [] };
        map.set(roadId, group);
      }
      return group;
    };
    for (const obj of filteredObjects) {
      getGroup(obj.roadId, obj.roadName).objects.push(obj);
    }
    for (const entry of filteredStructures) {
      getGroup(entry.roadId, entry.roadName).structures.push(entry);
    }
    return Array.from(map.values());
  }, [filteredObjects, filteredStructures]);

  const handleSelect = (obj: OdrRoadObjectWithRoad) => {
    setSelection({ type: 'object', id: obj.id, roadId: obj.roadId });
  };

  const totalCount = filteredObjects.length;

  return (
    <div className="flex flex-col h-full">
      {/* Header: count + document-object provenance (vs. sim-generated runtime objects) */}
      <div className="px-3 py-2 border-b border-[var(--color-glass-edge)]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-[var(--color-text-muted)]">
            {totalCount} object{totalCount !== 1 ? 's' : ''}
          </span>
        </div>
        <p
          className="text-[10px] text-[var(--color-text-tertiary)] mt-1"
          title={t('odrProperty.object.documentObjectsHint')}
        >
          {t('odrProperty.object.documentObjectsHeader')}
        </p>
      </div>

      {/* Object/structure list grouped by road */}
      <ScrollArea className="flex-1">
        <div className="py-1">
          {groups.length > 0 ? (
            groups.map((group) => (
              <div key={group.roadId}>
                {/* Road group header */}
                <div className="px-4 pt-3 pb-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    {group.roadName}
                  </p>
                </div>

                {group.objects.map((obj) => (
                  <ObjectListItem
                    key={`${group.roadId}-obj-${obj.id}`}
                    object={obj}
                    selected={
                      selection.type === 'object' &&
                      selection.id === obj.id &&
                      selection.roadId === group.roadId
                    }
                    onSelect={() => handleSelect(obj)}
                  />
                ))}

                {group.structures.map((entry) => (
                  <StructureListItem
                    key={`${group.roadId}-${entry.kind}-${entry.id}`}
                    entry={entry}
                  />
                ))}
              </div>
            ))
          ) : (
            <p className="p-4 text-center text-xs text-[var(--color-text-muted)]">
              {searchQuery ? 'No objects match filter.' : 'No objects defined.'}
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ---- Object list item ----

interface ObjectListItemProps {
  object: OdrRoadObjectWithRoad;
  selected: boolean;
  onSelect: () => void;
}

function ObjectListItem({ object, selected, onSelect }: ObjectListItemProps) {
  const displayName = object.name || object.type || `Object ${object.id}`;

  return (
    <div
      className={cn(
        'glass-item flex items-center gap-3 mx-3 my-1 px-3 py-2.5 cursor-pointer group relative',
        selected && 'selected',
      )}
      onClick={onSelect}
    >
      {/* Selected indicator */}
      {selected && (
        <div
          className="absolute left-0 top-[15%] bottom-[15%] w-[2px]"
          style={{
            background: 'linear-gradient(180deg, var(--color-accent-vivid), var(--color-accent-2))',
            boxShadow: '0 0 5px rgba(155, 132, 232, 0.12), 0 0 10px rgba(123, 136, 232, 0.05)',
          }}
        />
      )}

      <Box className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />

      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium truncate">{displayName}</p>
        <div className="text-[10px] text-[var(--color-text-tertiary)] mt-px flex items-center gap-1.5">
          <Badge variant="outline" className="text-[9px] py-0 px-1 leading-tight">
            {object.type ?? 'unknown'}
          </Badge>
          <span>s={object.s.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}

// ---- Structure (tunnel/bridge) list item — display-only, no 3D, no selection ----

function StructureListItem({ entry }: { entry: OdrRoadStructureEntry }) {
  const { t } = useTranslation('common');
  const kindLabel =
    entry.kind === 'tunnel'
      ? t('odrSidebar.objectList.tunnelBadge')
      : t('odrSidebar.objectList.bridgeBadge');
  const displayName = entry.name || `${kindLabel} ${entry.id}`;
  const Icon = entry.kind === 'tunnel' ? Mountain : Landmark;

  return (
    <div className="flex items-center gap-3 mx-3 my-1 px-3 py-2.5 cursor-default opacity-80">
      <Icon className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium truncate">{displayName}</p>
        <div className="text-[10px] text-[var(--color-text-tertiary)] mt-px flex items-center gap-1.5">
          <Badge variant="secondary" className="text-[9px] py-0 px-1 leading-tight">
            {kindLabel}
          </Badge>
          <span>{entry.type}</span>
          <span>&middot; s={entry.s.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}
