import { useEffect, useRef } from 'react';
import { Trash2, RefreshCw, Plus } from 'lucide-react';

interface JunctionContextMenuProps {
  position: { x: number; y: number };
  junctionId: string;
  onDelete: (junctionId: string) => void;
  onRegenerateConnections: (junctionId: string) => void;
  onAddConnection: (junctionId: string) => void;
  onClose: () => void;
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  destructive,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
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

export function JunctionContextMenu({
  position,
  junctionId,
  onDelete,
  onRegenerateConnections,
  onAddConnection,
  onClose,
}: JunctionContextMenuProps) {
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
      className="fixed z-50 min-w-[180px] bg-[var(--color-popover)] backdrop-blur-[28px] border border-[var(--color-glass-edge)] rounded-none shadow-lg py-1"
      style={{ left: position.x, top: position.y }}
    >
      <MenuItem
        icon={Plus}
        label="Add Connection"
        onClick={() => onAddConnection(junctionId)}
      />
      <MenuItem
        icon={RefreshCw}
        label="Regenerate Connections"
        onClick={() => onRegenerateConnections(junctionId)}
      />
      <div className="h-px mx-2 my-1 bg-[var(--color-glass-edge)]" />
      <MenuItem
        icon={Trash2}
        label="Delete Junction"
        onClick={() => onDelete(junctionId)}
        destructive
      />
    </div>
  );
}
