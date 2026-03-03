import { useState } from 'react';
import { useTranslation } from '@osce/i18n';
import { Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProject: (data: { name: string; description: string; template: 'empty' | 'basic' }) => Promise<void>;
}

export function NewProjectDialog({ open, onOpenChange, onCreateProject }: NewProjectDialogProps) {
  const { t } = useTranslation('common');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState<'empty' | 'basic'>('empty');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = name.trim().length > 0;

  const handleCreate = async () => {
    if (!isValid || isCreating) return;
    setIsCreating(true);
    setError(null);
    try {
      await onCreateProject({ name: name.trim(), description: description.trim(), template });
      setName('');
      setDescription('');
      setTemplate('empty');
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!isCreating) {
      onOpenChange(open);
      if (!open) {
        setName('');
        setDescription('');
        setTemplate('empty');
        setError(null);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-[var(--color-bg-primary)] border-[var(--color-glass-edge-mid)]">
        <DialogHeader>
          <DialogTitle className="font-display text-[var(--color-text-primary)]">
            {t('home.newProject')}
          </DialogTitle>
          <DialogDescription className="text-[var(--color-text-secondary)]">
            Create a new OpenSCENARIO project
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-2">
            <Label className="text-[var(--color-text-secondary)]" htmlFor="project-name">
              {t('project.name')} *
            </Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Scenario Project"
              className="bg-[var(--color-glass-1)] border-[var(--color-glass-edge-mid)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
              disabled={isCreating}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
              }}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-[var(--color-text-secondary)]" htmlFor="project-desc">
              {t('project.description')}
            </Label>
            <textarea
              id="project-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={3}
              className="flex w-full rounded-none border border-[var(--color-glass-edge-mid)] bg-[var(--color-glass-1)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              disabled={isCreating}
            />
          </div>

          {/* Template */}
          <div className="space-y-2">
            <Label className="text-[var(--color-text-secondary)]">
              {t('project.template')}
            </Label>
            <div className="flex gap-3">
              {(['empty', 'basic'] as const).map((t) => (
                <label
                  key={t}
                  className={`flex-1 flex items-center gap-2 p-3 cursor-pointer border transition-colors ${
                    template === t
                      ? 'border-[var(--color-accent-1)] bg-[var(--color-accent-1)]/10'
                      : 'border-[var(--color-glass-edge-mid)] bg-[var(--color-glass-1)] hover:border-[var(--color-glass-edge-bright)]'
                  }`}
                >
                  <input
                    type="radio"
                    name="template"
                    value={t}
                    checked={template === t}
                    onChange={() => setTemplate(t)}
                    className="accent-[var(--color-accent-1)]"
                    disabled={isCreating}
                  />
                  <span className="text-xs text-[var(--color-text-primary)] capitalize">{t}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenChange(false)}
            disabled={isCreating}
          >
            {t('buttons.cancel')}
          </Button>
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={!isValid || isCreating}
            className="bg-[var(--color-accent-1)] text-white hover:bg-[var(--color-accent-1)]/90"
          >
            {isCreating && <Loader2 size={14} className="animate-spin mr-1" />}
            {t('project.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
