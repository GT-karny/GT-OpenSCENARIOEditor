import { useEffect, useRef } from 'react';
import { Plus, Minus, AlertTriangle } from 'lucide-react';

interface LaneContextMenuProps {
  position: { x: number; y: number };
  roadId: string;
  sectionIdx: number;
  laneId: number;
  side: 'left' | 'right';
  isLastLane: boolean;
  onAddLaneLeft: () => void;
  onAddLaneRight: () => void;
  onDeleteLane: () => void;
  onClose: () => void;
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  destructive,
  warning,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  destructive?: boolean;
  warning?: string;
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
      title={warning}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="flex-1">{label}</span>
      {warning && <AlertTriangle className="h-3 w-3 text-yellow-400" />}
    </button>
  );
}

export function LaneContextMenu({
  position,
  isLastLane,
  onAddLaneLeft,
  onAddLaneRight,
  onDeleteLane,
  onClose,
}: LaneContextMenuProps) {
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
      <MenuItem icon={Plus} label="Add Lane Left" onClick={onAddLaneLeft} />
      <MenuItem icon={Plus} label="Add Lane Right" onClick={onAddLaneRight} />
      <div className="h-px mx-2 my-1 bg-[var(--color-glass-edge)]" />
      <MenuItem
        icon={Minus}
        label="Delete Lane"
        onClick={onDeleteLane}
        destructive
        warning={isLastLane ? 'This is the last lane on this side' : undefined}
      />
    </div>
  );
}
