import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppView, ProjectDetail, ProjectCreateRequest } from '@osce/shared';
import * as api from '../lib/project-api';

export interface ProjectState {
  // View state
  currentView: AppView;
  setView: (view: AppView) => void;

  // Project state
  currentProject: ProjectDetail | null;
  currentFilePath: string | null;
  currentXodrPath: string | null;

  // Recent projects (persisted)
  recentProjectIds: string[];

  // Actions
  openProject: (id: string) => Promise<void>;
  closeProject: () => void;
  createProject: (req: ProjectCreateRequest) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  refreshProject: () => Promise<void>;
  openScenarioFile: (relativePath: string) => Promise<string | null>;
  saveCurrentFile: (xmlContent: string) => Promise<void>;
  createNewFile: (relativePath: string) => Promise<void>;
}

function addToRecent(ids: string[], id: string): string[] {
  const filtered = ids.filter((i) => i !== id);
  return [id, ...filtered].slice(0, 10);
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      currentView: 'home' as AppView,
      currentProject: null,
      currentFilePath: null,
      currentXodrPath: null,
      recentProjectIds: [],

      setView: (view) => set({ currentView: view }),

      openProject: async (id) => {
        const project = await api.fetchProject(id);
        set((state) => ({
          currentProject: project,
          currentView: 'editor' as AppView,
          currentFilePath: null,
          currentXodrPath: null,
          recentProjectIds: addToRecent(state.recentProjectIds, id),
        }));
      },

      closeProject: () =>
        set({
          currentProject: null,
          currentFilePath: null,
          currentXodrPath: null,
          currentView: 'home' as AppView,
        }),

      createProject: async (req) => {
        const project = await api.createProject(req);
        set((state) => ({
          currentProject: project,
          currentView: 'editor' as AppView,
          currentFilePath: null,
          currentXodrPath: null,
          recentProjectIds: addToRecent(state.recentProjectIds, project.meta.id),
        }));
      },

      deleteProject: async (id) => {
        await api.deleteProject(id);
        set((state) => ({
          recentProjectIds: state.recentProjectIds.filter((i) => i !== id),
        }));
      },

      refreshProject: async () => {
        const { currentProject } = get();
        if (!currentProject) return;
        const project = await api.fetchProject(currentProject.meta.id);
        set({ currentProject: project });
      },

      openScenarioFile: async (relativePath) => {
        const { currentProject } = get();
        if (!currentProject) return null;
        const content = await api.readProjectFile(currentProject.meta.id, relativePath);
        set({ currentFilePath: relativePath });
        return content;
      },

      saveCurrentFile: async (xmlContent) => {
        const { currentProject, currentFilePath } = get();
        if (!currentProject || !currentFilePath) return;
        await api.writeProjectFile(currentProject.meta.id, currentFilePath, xmlContent);
      },

      createNewFile: async (relativePath) => {
        const { currentProject, refreshProject } = get();
        if (!currentProject) return;
        const emptyXosc = `<?xml version="1.0" encoding="UTF-8"?>
<OpenSCENARIO>
  <FileHeader revMajor="1" revMinor="2" date="" description="" author=""/>
  <ParameterDeclarations/>
  <CatalogLocations/>
  <RoadNetwork><LogicFile filepath=""/></RoadNetwork>
  <Entities/>
  <Storyboard>
    <Init><Actions/></Init>
    <StopTrigger><ConditionGroup><Condition name="stop" delay="0" conditionEdge="none">
      <ByValueCondition><SimulationTimeCondition value="60" rule="greaterThan"/></ByValueCondition>
    </Condition></ConditionGroup></StopTrigger>
  </Storyboard>
</OpenSCENARIO>`;
        await api.writeProjectFile(currentProject.meta.id, relativePath, emptyXosc);
        await refreshProject();
      },
    }),
    {
      name: 'osce-project-state',
      partialize: (state) => ({
        recentProjectIds: state.recentProjectIds,
      }),
    },
  ),
);
