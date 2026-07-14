/**
 * GT_Sim UI primitives — barrel export.
 *
 * Shared foundation for all `features/gt-sim/<cluster>/` panels (Phase 2
 * migration). See `README.md` in this directory for the fork-compat notes
 * per component. This directory is owned by the trunk lane (L3) and frozen
 * for other lanes once created — import-only from here.
 */
export { Button, type ButtonProps } from './Button';
export {
  TextInput,
  type TextInputProps,
  NumberInput,
  type NumberInputProps,
  SelectInput,
  type SelectInputProps,
  Checkbox,
  type CheckboxProps,
  ToggleSwitch,
  type ToggleSwitchProps,
  IconToggle,
  type IconToggleProps,
} from './Input';
export { StatusBadge, type StatusBadgeProps, type GtSimJobStatus } from './Badge';
export { TableShell, type TableShellProps, TableSkeleton, type TableColumn } from './Table';
export { Card, type CardProps } from './Card';
export { ConfirmDialog, type ConfirmDialogProps } from './ConfirmDialog';
export { SlidePanel, type SlidePanelProps } from './SlidePanel';
export { ContextMenu, type ContextMenuProps, type ContextMenuItem } from './ContextMenu';
export { EmptyState, type EmptyStateProps } from './EmptyState';
export { ErrorPanel, type ErrorPanelProps } from './ErrorPanel';
export { MarkdownRenderer, type MarkdownRendererProps } from './MarkdownRenderer';
