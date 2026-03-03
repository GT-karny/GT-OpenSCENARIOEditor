import { useState } from 'react';
import type { ProjectSummary } from '@osce/shared';
import { useTranslation } from '@osce/i18n';
import { MoreVertical, FolderOpen, Download, Trash2, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';

interface ProjectCardProps {
  project: ProjectSummary;
  isRecent?: boolean;
  onOpen: (id: string) => void;
  onExport: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ProjectCard({ project, isRecent, onOpen, onExport, onDelete }: ProjectCardProps) {
  const { t } = useTranslation('common');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const updatedDate = new Date(project.updatedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpen(project.id)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(project.id); } }}
        className="group relative text-left w-full p-5 bg-[var(--color-glass-2)] backdrop-blur-[28px] saturate-[1.3] border border-[var(--color-glass-edge-mid)] hover:border-[var(--color-accent-1)] transition-all duration-200 hover:shadow-[0_0_20px_rgba(var(--color-accent-glow-rgb),0.15)] cursor-pointer"
      >
        {/* Recent badge */}
        {isRecent && (
          <Badge className="absolute top-3 right-12 bg-[var(--color-accent-1)]/20 text-[var(--color-accent-1)] border-[var(--color-accent-1)]/30 text-[10px] px-1.5 py-0">
            <Clock size={10} className="mr-1" />
            Recent
          </Badge>
        )}

        {/* Dropdown menu */}
        <div
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreVertical size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onOpen(project.id)}>
                <FolderOpen size={14} />
                Open
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport(project.id)}>
                <Download size={14} />
                {t('buttons.export')} ZIP
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteDialogOpen(true)}
                className="text-red-400 focus:text-red-400"
              >
                <Trash2 size={14} />
                {t('buttons.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content */}
        <h3 className="font-display text-sm font-bold text-[var(--color-text-primary)] truncate pr-8">
          {project.name}
        </h3>
        {project.description && (
          <p className="mt-1.5 text-xs text-[var(--color-text-secondary)] line-clamp-2">
            {project.description}
          </p>
        )}
        <div className="mt-3 flex items-center gap-3 text-[10px] text-[var(--color-text-muted)]">
          <span>
            {project.scenarioCount} {t('project.scenarios')}
          </span>
          <span>{updatedDate}</span>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-[var(--color-bg-primary)] border-[var(--color-glass-edge-mid)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--color-text-primary)]">
              {t('project.delete')}?
            </DialogTitle>
            <DialogDescription className="text-[var(--color-text-secondary)]">
              Are you sure you want to delete &quot;{project.name}&quot;? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteDialogOpen(false)}
            >
              {t('buttons.cancel')}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                onDelete(project.id);
                setDeleteDialogOpen(false);
              }}
            >
              {t('buttons.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
