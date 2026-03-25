import { useState } from 'react';
import { useTranslation } from '@osce/i18n';
import type { EntityRefUsage } from '@osce/scenario-engine';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';

export type DeleteAction = 'replace' | 'remove';

export interface EntityCleanupOption {
  action: DeleteAction;
  replacementName?: string;
}

interface DeleteEntityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityName: string;
  usages: EntityRefUsage[];
  availableEntities: string[];
  onConfirm: (option: EntityCleanupOption) => void;
}

export function DeleteEntityDialog({
  open,
  onOpenChange,
  entityName,
  usages,
  availableEntities,
  onConfirm,
}: DeleteEntityDialogProps) {
  const { t } = useTranslation('common');
  const [action, setAction] = useState<DeleteAction>('remove');
  const [replacementName, setReplacementName] = useState(availableEntities[0] ?? '');

  const handleConfirm = () => {
    onConfirm({
      action,
      replacementName: action === 'replace' ? replacementName : undefined,
    });
    onOpenChange(false);
  };

  const isConfirmDisabled = action === 'replace' && !replacementName;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Entity: {entityName}</DialogTitle>
          <DialogDescription>
            This entity is referenced in {usages.length} location(s). Choose how to handle
            existing references.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Usage list */}
          <div className="grid gap-2">
            <Label>Referenced in:</Label>
            <ScrollArea className="max-h-32">
              <ul className="space-y-1 text-xs text-[var(--color-text-muted)]">
                {usages.map((usage, i) => (
                  <li key={i} className="px-2 py-1 bg-[var(--color-glass-1)]">
                    {usage.path}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </div>

          {/* Action choice */}
          <div className="grid gap-2">
            <Label>Action:</Label>
            <div className="flex rounded-none border border-[var(--color-glass-edge-mid)] overflow-hidden">
              <button
                type="button"
                onClick={() => setAction('remove')}
                className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
                  action === 'remove'
                    ? 'bg-[var(--color-accent-1)]/15 text-[var(--color-accent-1)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-glass-1)]'
                }`}
              >
                Remove references
              </button>
              <button
                type="button"
                onClick={() => setAction('replace')}
                disabled={availableEntities.length === 0}
                className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors border-l border-[var(--color-glass-edge-mid)] ${
                  action === 'replace'
                    ? 'bg-[var(--color-accent-1)]/15 text-[var(--color-accent-1)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-glass-1)]'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                Replace with another
              </button>
            </div>
          </div>

          {/* Replacement entity selector */}
          {action === 'replace' && availableEntities.length > 0 && (
            <div className="grid gap-2">
              <Label>Replace with:</Label>
              <Select value={replacementName} onValueChange={setReplacementName}>
                <SelectTrigger>
                  <SelectValue placeholder="Select entity..." />
                </SelectTrigger>
                <SelectContent>
                  {availableEntities.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('buttons.cancel')}
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isConfirmDisabled}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
