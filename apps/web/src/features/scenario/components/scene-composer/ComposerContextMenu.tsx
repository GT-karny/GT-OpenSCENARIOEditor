/**
 * Shared right-click context menu for scene-composer elements.
 * Provides Duplicate / Copy / Paste / Delete actions.
 */

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Copy, ClipboardPaste, CopyPlus, Trash2 } from 'lucide-react';
import { useTranslation } from '@osce/i18n';

export interface ComposerMenuPosition {
  x: number;
  y: number;
}

interface ComposerContextMenuProps {
  position: ComposerMenuPosition;
  onDuplicate?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  canPaste?: boolean;
  onDelete?: () => void;
  onClose: () => void;
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  destructive,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}) {
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

export function ComposerContextMenu({
  position,
  onDuplicate,
  onCopy,
  onPaste,
  canPaste,
  onDelete,
  onClose,
}: ComposerContextMenuProps) {
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

  const hasClipboard = onCopy || onDuplicate;
  const hasPaste = onPaste;

  // Use portal to avoid position:fixed being broken by ancestor backdrop-filter
  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[160px] bg-[var(--color-popover)] backdrop-blur-[28px] border border-[var(--color-glass-edge)] rounded-none shadow-lg py-1"
      style={{ left: position.x, top: position.y }}
    >
      {onDuplicate && (
        <MenuItem
          icon={CopyPlus}
          label={t('contextMenu.duplicate', 'Duplicate')}
          onClick={() => { onDuplicate(); onClose(); }}
        />
      )}
      {onCopy && (
        <MenuItem
          icon={Copy}
          label={t('contextMenu.copy', 'Copy')}
          onClick={() => { onCopy(); onClose(); }}
        />
      )}
      {hasPaste && (
        <MenuItem
          icon={ClipboardPaste}
          label={t('contextMenu.paste', 'Paste')}
          onClick={() => { onPaste!(); onClose(); }}
          disabled={!canPaste}
        />
      )}
      {(hasClipboard || hasPaste) && onDelete && <MenuSeparator />}
      {onDelete && (
        <MenuItem
          icon={Trash2}
          label={t('contextMenu.delete', 'Delete')}
          onClick={() => { onDelete(); onClose(); }}
          destructive
        />
      )}
    </div>,
    document.body,
  );
}
