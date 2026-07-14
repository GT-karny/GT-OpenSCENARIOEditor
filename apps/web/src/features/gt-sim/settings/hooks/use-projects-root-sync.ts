/**
 * Design judgment D4 — projects_root sync: keep GT_Sim's
 * `PUT /api/config/projects-root` aligned with the editor's own projects
 * root, so the same on-disk projects directory is used by both the editor's
 * Fastify server and the GT_Sim FastAPI backend.
 *
 * Source-of-truth investigation (read-only, done for this cluster): the
 * editor's projects root IS available in the renderer — `useProjectStore`
 * (`apps/web/src/stores/project-store.ts`, a top-level app store, not owned
 * by any cluster) exposes `projectsRoot: string | null`, populated by
 * `loadProjectsRoot()` (called from `HomeScreen` on mount and persisted to
 * `localStorage` under `osce-project-state`) and updated by `setProjectsRoot()`
 * (called from `HomeScreen`'s "change root" action). No Electron IPC or
 * `apps/server` change was needed — the fallback UI mentioned in the task
 * brief ("show GT_Sim's root + manual entry only") was not required.
 *
 * This hook is the mount-time + change-time sync point: it watches
 * `useProjectStore`'s `projectsRoot` and pushes it to GT_Sim's
 * `setProjectsRoot` whenever it changes (and once on mount if already known),
 * as long as the GT_Sim backend is connected (`useGtSimApi() !== null`). It
 * does not read GT_Sim's `getProjectsRoot` — that is a separate, purely
 * display-oriented query owned by `ProjectsRootSection`.
 */
import { useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useGtSimApi } from '../../lib';
import { useProjectStore } from '@/stores/project-store';

export type ProjectsRootSyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

export interface ProjectsRootSyncState {
  status: ProjectsRootSyncStatus;
  /** The editor-side projects root this hook is trying to keep GT_Sim in sync with. */
  editorProjectsRoot: string | null;
  error: Error | null;
  /** Re-run the sync for the current `editorProjectsRoot` (manual retry). */
  resync: () => void;
}

export function useProjectsRootSync(): ProjectsRootSyncState {
  const api = useGtSimApi();
  const queryClient = useQueryClient();
  // Primitive selector (string | null) — reference-stable, no useShallow needed.
  const editorProjectsRoot = useProjectStore((s) => s.projectsRoot);

  // Tracks the last value successfully handed to the mutation, so effect
  // re-runs from unrelated re-renders don't re-sync an unchanged root.
  const lastRequestedRef = useRef<string | null>(null);

  const mutation = useMutation({
    mutationFn: (root: string) => {
      if (!api) throw new Error('GT_Sim API not connected');
      return api.setProjectsRoot(root);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['config', 'projects-root'] });
    },
  });

  useEffect(() => {
    if (!api || editorProjectsRoot === null) return;
    if (lastRequestedRef.current === editorProjectsRoot) return;
    lastRequestedRef.current = editorProjectsRoot;
    mutation.mutate(editorProjectsRoot);
    // `mutation` is intentionally omitted: `useMutation` returns a fresh
    // object each render, and including it would re-fire this effect on
    // every mutation state change instead of only on root/connection change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, editorProjectsRoot]);

  const resync = () => {
    if (!api || editorProjectsRoot === null) return;
    lastRequestedRef.current = editorProjectsRoot;
    mutation.mutate(editorProjectsRoot);
  };

  let status: ProjectsRootSyncStatus = 'idle';
  if (mutation.isPending) status = 'syncing';
  else if (mutation.isError) status = 'error';
  else if (mutation.isSuccess) status = 'synced';

  return {
    status,
    editorProjectsRoot,
    error: mutation.error,
    resync,
  };
}
