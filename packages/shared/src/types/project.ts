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

/**
 * Current project.json schema version. Bump when the persisted `ProjectMeta`
 * shape changes and add the corresponding step to the server's
 * `migrateProjectMeta`.
 */
export const PROJECT_META_SCHEMA_VERSION = 2;

/** Project metadata (persisted to project.json) */
export interface ProjectMeta {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  defaultScenario?: string;
  /**
   * project.json schema version. Absent in records written before 2026-07 (read
   * as v1); the server migrates on read and stamps the current version on write.
   */
  schemaVersion?: number;
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
