/**
 * GT_Sim UI primitive — ContextMenu (coordinate-driven right-click menu).
 *
 * Ported near-verbatim from the GT_Sim fork's `components/ui/ContextMenu.tsx`.
 * The editor's Radix `ContextMenu` (`apps/web/src/components/ui/context-menu.tsx`)
 * is trigger-based (wraps a subtree and reads the native `contextmenu` event
 * itself), which does not fit the fork's `{ x, y } + items` prop-driven API
 * used throughout its callers. Per the migration plan, fork-API compatibility
 * is prioritized over a full Radix rewrite here — this keeps the fork's own
 * manual positioning/outside-click/escape/scroll-close logic, restyled with
 * APEX tokens (`--color-popover` for the surface, per `docs/STYLE_GUIDE.md`
 * §3 "Popover / Context menu").
 */
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export interface ContextMenuItem {
  label: string;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
}

export interface ContextMenuProps {
  items: ContextMenuItem[];
  position: { x: number; y: number };
  onClose: () => void;
}

export function ContextMenu({ items, position, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Clamp to viewport on mount.
  useEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      el.style.left = `${window.innerWidth - rect.width - 8}px`;
    }
    if (rect.bottom > window.innerHeight) {
      el.style.top = `${window.innerHeight - rect.height - 8}px`;
    }
  }, []);

  useEffect(() => {
    const handleClose = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleScroll = () => onClose();

    document.addEventListener('mousedown', handleClose);
    document.addEventListener('keydown', handleKey);
    document.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClose);
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      className="fixed z-[100] min-w-[160px] border border-[var(--color-glass-edge-mid)] bg-[var(--color-popover)] py-1 shadow-lg backdrop-blur-[28px]"
      style={{ left: position.x, top: position.y }}
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          role="menuitem"
          disabled={item.disabled}
          onClick={() => {
            if (!item.disabled) {
              item.onClick();
            }
          }}
          className={cn(
            'w-full px-4 py-2 text-left text-sm transition-colors',
            item.disabled
              ? 'cursor-not-allowed text-[var(--color-text-tertiary)]'
              : item.danger
                ? 'text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10'
                : 'text-[var(--color-foreground)] hover:bg-[var(--color-glass-hover)]',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>,
    document.body,
  );
}
