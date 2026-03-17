import { useEffect, useRef } from 'react';
import { Scissors } from 'lucide-react';

interface RoadSectionContextMenuProps {
  position: { x: number; y: number };
  roadId: string;
  s: number;
  onSplitSection: () => void;
  onClose: () => void;
}

export function RoadSectionContextMenu({
  position,
  onSplitSection,
  onClose,
}: RoadSectionContextMenuProps) {
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
      <button
        type="button"
        className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-left transition-colors text-[var(--color-text-secondary)] hover:bg-[var(--color-glass-hover)] hover:text-[var(--color-text-primary)]"
        onClick={onSplitSection}
      >
        <Scissors className="h-3.5 w-3.5" />
        Split Section Here
      </button>
    </div>
  );
}
