import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import type { ParameterDeclaration, VariableDeclaration } from '@osce/shared';
import { EntityIcon } from '../../entity/EntityIcon';
import { cn } from '@/lib/utils';
import type { EntityGroup, ParamOrVar } from './types';

const ROW_BASE =
  'w-full px-2 py-1 text-left text-xs flex items-center gap-2 hover:bg-[var(--color-glass-1)]';
const SECTION_LABEL =
  'px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider';
const META = 'text-[var(--color-text-tertiary)] text-[10px]';

interface DeclRowProps {
  decl: ParamOrVar;
  active: boolean;
  selected: boolean;
  /** Whether to show the `param`/`var` kind label (parameter-mode rows only). */
  showKind?: boolean;
  onSelect: (ref: string) => void;
}

/** A single parameter/variable row, shared by parameter-mode and inline sections. */
function DeclRow({ decl, active, selected, showKind, onSelect }: DeclRowProps) {
  const isVar = 'variableType' in decl;
  const typeLabel = isVar ? decl.variableType : decl.parameterType;
  return (
    <button
      type="button"
      className={cn(ROW_BASE, active && 'bg-[var(--color-glass-1)]')}
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect(`$${decl.name}`);
      }}
    >
      <span className="font-medium text-[var(--color-accent-1)]">${decl.name}</span>
      {showKind && <span className={META}>{isVar ? 'var' : 'param'}</span>}
      <span className={META}>{typeLabel}</span>
      <span className={cn(META, 'ml-auto')}>= {decl.value}</span>
      {selected && <Check className="h-3 w-3 shrink-0" />}
    </button>
  );
}

interface EntityRefRowsProps {
  parameterMode: boolean;
  grouped: EntityGroup[];
  filteredParams: ParameterDeclaration[];
  filteredVars: VariableDeclaration[];
  selectedIndex: number;
  /** Index of the first navigable row (1 when an empty row precedes the groups). */
  startIndex?: number;
  /** Whether a given ref value (`name` or `$name`) is currently selected. */
  isSelected: (ref: string) => boolean;
  onSelectEntity: (name: string) => void;
  onSelectRef: (ref: string) => void;
  emptyMessage: ReactNode;
}

/**
 * Renders the entity groups plus inline parameter/variable sections shared by
 * the single and multi entity selectors. When `parameterMode` is on, only the
 * matching parameter/variable rows are shown.
 */
export function EntityRefRows({
  parameterMode,
  grouped,
  filteredParams,
  filteredVars,
  selectedIndex,
  startIndex = 0,
  isSelected,
  onSelectEntity,
  onSelectRef,
  emptyMessage,
}: EntityRefRowsProps) {
  let idx = startIndex;
  const nextIdx = () => idx++;

  if (parameterMode) {
    if (filteredParams.length === 0 && filteredVars.length === 0) {
      return (
        <p className="px-2 py-2 text-[11px] text-muted-foreground italic">
          No matching parameters or variables
        </p>
      );
    }
    return (
      <>
        {[...filteredParams, ...filteredVars].map((decl) => (
          <DeclRow
            key={`${'variableType' in decl ? 'var' : 'param'}-${decl.name}`}
            decl={decl}
            active={nextIdx() === selectedIndex}
            // Parameter-mode rows historically show no selection check.
            selected={false}
            showKind
            onSelect={onSelectRef}
          />
        ))}
      </>
    );
  }

  if (grouped.length === 0 && filteredParams.length === 0 && filteredVars.length === 0) {
    return <>{emptyMessage}</>;
  }

  return (
    <>
      {grouped.map((group) => (
        <div key={group.type}>
          <div className={SECTION_LABEL}>{group.label}</div>
          {group.items.map((entity) => {
            const active = nextIdx() === selectedIndex;
            return (
              <button
                key={entity.id}
                type="button"
                className={cn(ROW_BASE, active && 'bg-[var(--color-glass-1)]')}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelectEntity(entity.name);
                }}
              >
                <EntityIcon
                  type={entity.type}
                  className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                />
                <span>{entity.name}</span>
                {isSelected(entity.name) && <Check className="h-3 w-3 ml-auto" />}
              </button>
            );
          })}
        </div>
      ))}

      {filteredParams.length > 0 && (
        <div className={cn(grouped.length > 0 && 'border-t border-[var(--color-glass-edge)]')}>
          <div className={SECTION_LABEL}>Parameters</div>
          {filteredParams.map((param) => (
            <DeclRow
              key={param.id}
              decl={param}
              active={nextIdx() === selectedIndex}
              selected={isSelected(`$${param.name}`)}
              onSelect={onSelectRef}
            />
          ))}
        </div>
      )}

      {filteredVars.length > 0 && (
        <div
          className={cn(
            (grouped.length > 0 || filteredParams.length > 0) &&
              'border-t border-[var(--color-glass-edge)]',
          )}
        >
          <div className={SECTION_LABEL}>Variables</div>
          {filteredVars.map((v) => (
            <DeclRow
              key={v.id}
              decl={v}
              active={nextIdx() === selectedIndex}
              selected={isSelected(`$${v.name}`)}
              onSelect={onSelectRef}
            />
          ))}
        </div>
      )}
    </>
  );
}
