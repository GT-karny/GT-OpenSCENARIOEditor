/** GT_Sim互換のファイル分類 */
export type ProjectFileType = 'xosc' | 'xodr' | 'model' | 'config' | 'doc' | 'other';

/** プロジェクト内のファイルエントリ */
export interface ProjectFileEntry {
  name: string;
  relativePath: string;
  type: ProjectFileType;
  size: number;
  modifiedAt: string;
}

/** プロジェクトメタデータ（project.json に保存） */
export interface ProjectMeta {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  defaultScenario?: string;
}

/** プロジェクト一覧用の軽量サマリー */
export interface ProjectSummary {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  scenarioCount: number;
}

/** プロジェクト詳細（メタ + ファイル一覧） */
export interface ProjectDetail {
  meta: ProjectMeta;
  files: ProjectFileEntry[];
}

/** プロジェクト作成リクエスト */
export interface ProjectCreateRequest {
  name: string;
  description?: string;
  template?: 'empty' | 'basic';
}

/** プロジェクト更新リクエスト */
export interface ProjectUpdateRequest {
  name?: string;
  description?: string;
  defaultScenario?: string;
}

/** アプリケーション画面状態 */
export type AppView = 'home' | 'editor';
