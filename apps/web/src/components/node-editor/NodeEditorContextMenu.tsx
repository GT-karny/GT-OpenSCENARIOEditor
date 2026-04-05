import { useEffect, useRef } from 'react';
import { Trash2, Plus, FoldVertical, Copy, ClipboardPaste, CopyPlus } from 'lucide-react';
import { useTranslation } from '@osce/i18n';
import type { OsceNodeType } from '@osce/node-editor';
import { getAddChildOptions, paneAddOptions, NON_DELETABLE_TYPES } from '../../lib/node-hierarchy';

export interface ContextMenuPosition {
  x: number;
  y: number;
  nodeId: string | null;
  nodeType: OsceNodeType | null;
}

/** Node types that support copy/duplicate. */
const COPYABLE_TYPES: ReadonlySet<OsceNodeType> = new Set([
  'maneuverGroup',
  'maneuver',
  'event',
  'action',
]);

/** Node types that can receive a paste (they are parents of copyable types). */
const PASTE_TARGET_TYPES: ReadonlySet<OsceNodeType> = new Set([
  'act',
  'maneuverGroup',
  'maneuver',
  'event',
]);

interface NodeEditorContextMenuProps {
  position: ContextMenuPosition;
  onAddChild: (childType: OsceNodeType) => void;
  onDeleteNode: (nodeId: string) => void;
  onToggleCollapse?: (nodeId: string) => void;
  onCopyNode?: (nodeId: string) => void;
  onPasteNode?: (nodeId: string) => void;
  onDuplicateNode?: (nodeId: string) => void;
  canPaste?: boolean;
  onClose: () => void;
}

interface MenuItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

function MenuItem({ icon: Icon, label, onClick, destructive, disabled }: MenuItemProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`flex items-center gap-2 w-full px-3 py-1.5 text-xs text-left transition-colors
        ${disabled
          ? 'text-[var(--color-text-muted)] opacity-40 cursor-default'
          : destructive
            ? 'text-red-400 hover:bg-red-500/10'
            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-glass-hover)] hover:text-[var(--color-text-primary)]'
        }`}
      onClick={disabled ? undefined : onClick}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function MenuSeparator() {
  return <div className="h-px mx-2 my-1 bg-[var(--color-glass-edge)]" />;
}

export function NodeEditorContextMenu({
  position,
  onAddChild,
  onDeleteNode,
  onToggleCollapse,
  onCopyNode,
  onPasteNode,
  onDuplicateNode,
  canPaste,
  onClose,
}: NodeEditorContextMenuProps) {
  const { t } = useTranslation('common');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as HTMLElement)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    // Use setTimeout so the opening click doesn't immediately close
    const timer = setTimeout(() => {
      window.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleEscape);
    }, 0);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const addOptions = position.nodeType
    ? getAddChildOptions(position.nodeType)
    : paneAddOptions;

  const showDelete = position.nodeId !== null
    && position.nodeType !== null
    && !NON_DELETABLE_TYPES.has(position.nodeType);

  const showCopy = position.nodeId !== null
    && position.nodeType !== null
    && COPYABLE_TYPES.has(position.nodeType);

  const showPaste = position.nodeId !== null
    && position.nodeType !== null
    && PASTE_TARGET_TYPES.has(position.nodeType)
    && !!onPasteNode;

  const hasCollapse = position.nodeId !== null && onToggleCollapse !== undefined;
  const hasItems = addOptions.length > 0 || showDelete || hasCollapse || showCopy || showPaste;

  // Close empty menus (e.g. init, trigger nodes) via effect to avoid
  // state updates during render.
  useEffect(() => {
    if (!hasItems) onClose();
  }, [hasItems, onClose]);

  if (!hasItems) return null;

  const style: React.CSSProperties = {
    left: position.x,
    top: position.y,
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[180px] bg-[var(--color-popover)] backdrop-blur-[28px] border border-[var(--color-glass-edge)] rounded-none shadow-lg py-1"
      style={style}
    >
      {position.nodeId && onToggleCollapse && (
        <>
          <MenuItem
            icon={FoldVertical}
            label={t('contextMenu.toggleCollapse', 'Toggle Collapse')}
            onClick={() => {
              onToggleCollapse(position.nodeId!);
              onClose();
            }}
          />
          <MenuSeparator />
        </>
      )}

      {/* Copy / Duplicate / Paste */}
      {showCopy && (
        <>
          {onDuplicateNode && (
            <MenuItem
              icon={CopyPlus}
              label={t('contextMenu.duplicate', 'Duplicate')}
              onClick={() => {
                onDuplicateNode(position.nodeId!);
                onClose();
              }}
            />
          )}
          {onCopyNode && (
            <MenuItem
              icon={Copy}
              label={t('contextMenu.copy', 'Copy')}
              onClick={() => {
                onCopyNode(position.nodeId!);
                onClose();
              }}
            />
          )}
        </>
      )}
      {showPaste && (
        <MenuItem
          icon={ClipboardPaste}
          label={t('contextMenu.paste', 'Paste')}
          onClick={() => {
            onPasteNode!(position.nodeId!);
            onClose();
          }}
          disabled={!canPaste}
        />
      )}
      {(showCopy || showPaste) && (addOptions.length > 0 || showDelete) && <MenuSeparator />}

      {addOptions.map((option) => (
        <MenuItem
          key={option.childType}
          icon={Plus}
          label={t(option.i18nKey, option.i18nFallback)}
          onClick={() => {
            onAddChild(option.childType);
            onClose();
          }}
        />
      ))}

      {showDelete && (
        <>
          {addOptions.length > 0 && <MenuSeparator />}
          <MenuItem
            icon={Trash2}
            label={t('contextMenu.delete', 'Delete')}
            onClick={() => {
              onDeleteNode(position.nodeId!);
              onClose();
            }}
            destructive
          />
        </>
      )}
    </div>
  );
}
