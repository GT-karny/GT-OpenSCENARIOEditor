import { useState, useEffect, useCallback } from 'react';
import type { ProjectSummary } from '@osce/shared';
import { useTranslation } from '@osce/i18n';
import { Navigation, Plus, Upload, FolderOpen, Loader2, AlertTriangle } from 'lucide-react';
import { isElectron } from '../../lib/platform';
import { WindowControls } from '../layout/WindowControls';
import { Button } from '../ui/button';
import { useProjectStore } from '../../stores/project-store';
import { fetchProjects, importProject, exportProjectUrl } from '../../lib/project-api';
import { ProjectCard } from './ProjectCard';
import { NewProjectDialog } from './NewProjectDialog';
import { toast } from 'sonner';

export function HomeScreen() {
  const { t } = useTranslation('common');
  const openProject = useProjectStore((s) => s.openProject);
  const createProject = useProjectStore((s) => s.createProject);
  const deleteProjectAction = useProjectStore((s) => s.deleteProject);
  const recentProjectIds = useProjectStore((s) => s.recentProjectIds);

  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newProjectOpen, setNewProjectOpen] = useState(false);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProjects();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleOpen = useCallback(
    async (id: string) => {
      try {
        await openProject(id);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to open project');
      }
    },
    [openProject],
  );

  const handleExport = useCallback((id: string) => {
    const url = exportProjectUrl(id);
    window.open(url, '_blank');
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteProjectAction(id);
        setProjects((prev) => prev.filter((p) => p.id !== id));
        toast.success('Project deleted');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to delete project');
      }
    },
    [deleteProjectAction],
  );

  const handleCreateProject = useCallback(
    async (data: { name: string; description: string; template: 'empty' | 'basic' }) => {
      await createProject(data);
    },
    [createProject],
  );

  const handleImportZip = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const project = await importProject(file);
        await openProject(project.meta.id);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to import project');
      }
    };
    input.click();
  }, [openProject]);

  // Sort: recent projects first, then by updatedAt
  const recentSet = new Set(recentProjectIds);
  const sortedProjects = [...projects].sort((a, b) => {
    const aRecent = recentSet.has(a.id);
    const bRecent = recentSet.has(b.id);
    if (aRecent && !bRecent) return -1;
    if (!aRecent && bRecent) return 1;
    if (aRecent && bRecent) {
      return recentProjectIds.indexOf(a.id) - recentProjectIds.indexOf(b.id);
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <div className="flex flex-col h-screen bg-[var(--color-bg-primary)] overflow-auto">
      {/* Electron titlebar drag region */}
      {isElectron() && (
        <div
          className="flex items-center justify-end h-[32px] shrink-0"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          <WindowControls />
        </div>
      )}
      {/* Header area */}
      <div className={`flex flex-col items-center ${isElectron() ? 'pt-8' : 'pt-16'} pb-10 px-6`}>
        {/* Logo */}
        <div className="flex items-center gap-3 mb-2">
          <Navigation
            size={32}
            strokeWidth={2}
            className="shrink-0"
            style={{
              stroke: 'url(#home-logo-gradient)',
              filter: 'drop-shadow(0 0 8px var(--color-accent-glow))',
            }}
          />
          <svg width="0" height="0" className="absolute">
            <defs>
              <linearGradient id="home-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--color-accent-vivid)" />
                <stop offset="100%" stopColor="var(--color-accent-2)" />
              </linearGradient>
            </defs>
          </svg>
          <h1
            className="font-display text-2xl font-bold tracking-[0.12em]"
            style={{
              background:
                'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent-bright) 60%, var(--color-accent-2) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {t('home.title')}
          </h1>
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-3 mt-6">
          <Button
            size="sm"
            onClick={() => setNewProjectOpen(true)}
            className="bg-[var(--color-accent-1)] text-white hover:bg-[var(--color-accent-1)]/90"
          >
            <Plus size={14} />
            {t('home.newProject')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleImportZip}
            className="border-[var(--color-glass-edge-mid)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            <Upload size={14} />
            {t('home.importZip')}
          </Button>
        </div>
      </div>

      {/* Project grid */}
      <div className="flex-1 px-8 pb-8 max-w-5xl mx-auto w-full">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-[var(--color-text-muted)]" />
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <AlertTriangle size={32} className="text-[var(--color-text-muted)]" />
            <p className="text-sm text-[var(--color-text-muted)]">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadProjects}
              className="text-[var(--color-accent-1)]"
            >
              Retry
            </Button>
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <FolderOpen size={48} className="text-[var(--color-text-muted)]" />
            <p className="text-sm text-[var(--color-text-muted)]">{t('home.noProjects')}</p>
            <Button
              size="sm"
              onClick={() => setNewProjectOpen(true)}
              className="bg-[var(--color-accent-1)] text-white hover:bg-[var(--color-accent-1)]/90"
            >
              <Plus size={14} />
              {t('home.createFirst')}
            </Button>
          </div>
        )}

        {!loading && !error && projects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isRecent={recentSet.has(project.id)}
                onOpen={handleOpen}
                onExport={handleExport}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* New Project Dialog */}
      <NewProjectDialog
        open={newProjectOpen}
        onOpenChange={setNewProjectOpen}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
}
