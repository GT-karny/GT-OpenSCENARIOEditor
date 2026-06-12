/** File classification compatible with GT_Sim */
export type ProjectFileType = 'xosc' | 'xodr' | 'model' | 'config' | 'doc' | 'other';

/** A file entry within a project */
export interface ProjectFileEntry {
  name: string;
  relativePath: string;
  type: ProjectFileType;
  size: number;
  modifiedAt: string;
}

/** Project metadata (persisted to project.json) */
export interface ProjectMeta {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  defaultScenario?: string;
}

/** Lightweight summary for the project list view */
export interface ProjectSummary {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  scenarioCount: number;
}

/** Full project detail (metadata + file list) */
export interface ProjectDetail {
  meta: ProjectMeta;
  files: ProjectFileEntry[];
}

/** Project creation request */
export interface ProjectCreateRequest {
  name: string;
  description?: string;
  template?: 'empty' | 'basic';
}

/** Project update request */
export interface ProjectUpdateRequest {
  name?: string;
  description?: string;
  defaultScenario?: string;
}

/** Top-level application view */
export type AppView = 'home' | 'editor';
