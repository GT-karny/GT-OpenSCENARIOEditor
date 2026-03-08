import { useEffect, useRef } from 'react';
import { MousePointer2, Trash2 } from 'lucide-react';
import { useTranslation } from '@osce/i18n';

export interface WaypointContextMenuPosition {
  x: number;
  y: number;
  waypointIndex: number;
}

interface WaypointContextMenuProps {
  position: WaypointContextMenuPosition;
  onSelect: () => void;
  onDelete: () => void;
  onClose: () => void;
}

interface MenuItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}

function MenuItem({ icon: Icon, label, onClick, destructive }: MenuItemProps) {
  return (
    <button
      type="button"
      className={`flex items-center gap-2 w-full px-3 py-1.5 text-xs text-left transition-colors
        ${destructive
          ? 'text-red-400 hover:bg-red-500/10'
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-glass-hover)] hover:text-[var(--color-text-primary)]'
        }`}
      onClick={onClick}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

export function WaypointContextMenu({
  position,
  onSelect,
  onDelete,
  onClose,
}: WaypointContextMenuProps) {
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

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[160px] bg-[var(--color-popover)] backdrop-blur-[28px] border border-[var(--color-glass-edge)] rounded-md shadow-lg py-1"
      style={{ left: position.x, top: position.y }}
    >
      <MenuItem
        icon={MousePointer2}
        label={t('route.selectWaypoint', 'Select Waypoint')}
        onClick={() => {
          onSelect();
          onClose();
        }}
      />
      <div className="h-px mx-2 my-1 bg-[var(--color-glass-edge)]" />
      <MenuItem
        icon={Trash2}
        label={t('route.deleteWaypoint', 'Delete Waypoint')}
        onClick={() => {
          onDelete();
          onClose();
        }}
        destructive
      />
    </div>
  );
}
