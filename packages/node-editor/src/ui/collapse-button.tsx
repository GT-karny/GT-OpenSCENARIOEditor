/**
 * Expand/collapse toggle button for nodes.
 */


export interface CollapseButtonProps {
  collapsed: boolean;
  onClick: () => void;
}

export function CollapseButton({ collapsed, onClick }: CollapseButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="p-0.5 rounded hover:bg-black/10 text-xs leading-none"
      title={collapsed ? 'Expand' : 'Collapse'}
    >
      {collapsed ? '▶' : '▼'}
    </button>
  );
}
