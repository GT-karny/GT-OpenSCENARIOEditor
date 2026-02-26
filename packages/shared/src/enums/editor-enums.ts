/**
 * Editor state enums.
 */

export type EditorMode = 'select' | 'pan' | 'addEntity' | 'addAction';

export type PanelId =
  | 'nodeEditor'
  | '3dViewer'
  | 'timeline'
  | 'properties'
  | 'entityList'
  | 'validation'
  | 'templates'
  | 'simulation';

export type FileFormat = 'xosc' | 'json';
