/**
 * Root scenario document model.
 * This is the internal representation of an OpenSCENARIO file.
 * All elements have a UUID `id` for stable internal references.
 */

import type { ParameterDeclaration, VariableDeclaration } from './parameters.js';
import type { ScenarioEntity } from './entities.js';
import type { Storyboard } from './storyboard.js';

export interface ScenarioDocument {
  /** Internal UUID */
  id: string;

  /** File metadata */
  fileHeader: FileHeader;

  /** Top-level parameter declarations */
  parameterDeclarations: ParameterDeclaration[];

  /** Variable declarations (v1.2) */
  variableDeclarations: VariableDeclaration[];

  /** Catalog locations */
  catalogLocations: CatalogLocations;

  /** Road network reference */
  roadNetwork: RoadNetwork;

  /** Scenario entities */
  entities: ScenarioEntity[];

  /** The storyboard (scenario logic) */
  storyboard: Storyboard;

  /** Editor metadata (not serialized to .xosc) */
  _editor: EditorMetadata;
}

export interface FileHeader {
  revMajor: number;
  revMinor: number;
  date: string;
  description: string;
  author: string;
}

export interface CatalogLocations {
  vehicleCatalog?: CatalogLocation;
  controllerCatalog?: CatalogLocation;
  pedestrianCatalog?: CatalogLocation;
  miscObjectCatalog?: CatalogLocation;
  environmentCatalog?: CatalogLocation;
  maneuverCatalog?: CatalogLocation;
  trajectoryCatalog?: CatalogLocation;
  routeCatalog?: CatalogLocation;
}

export interface CatalogLocation {
  directory: string;
}

export interface RoadNetwork {
  logicFile?: FileReference;
  sceneGraphFile?: FileReference;
  trafficSignals?: TrafficSignalController[];
}

export interface FileReference {
  filepath: string;
}

export interface TrafficSignalController {
  id: string;
  name: string;
  delay?: number;
  reference?: string;
  phases: TrafficSignalPhase[];
}

export interface TrafficSignalPhase {
  name: string;
  duration: number;
  trafficSignalStates: TrafficSignalState[];
}

export interface TrafficSignalState {
  trafficSignalId: string;
  state: string;
}

export interface EditorMetadata {
  /** Version of this document format */
  formatVersion: string;
  /** Timestamp of last modification */
  lastModified: string;
  /** Applied use-case template info for traceability */
  appliedTemplates: AppliedTemplate[];
  /** Node editor layout positions */
  nodePositions: Record<string, { x: number; y: number }>;
  /** Collapsed/expanded state of nodes */
  nodeCollapsed: Record<string, boolean>;
}

export interface AppliedTemplate {
  templateId: string;
  appliedAt: string;
  parameters: Record<string, unknown>;
}

export interface Property {
  name: string;
  value: string;
}

export interface CatalogReference {
  kind: 'catalogReference';
  catalogName: string;
  entryName: string;
  parameterAssignments: ParameterAssignment[];
}

export interface ParameterAssignment {
  parameterRef: string;
  value: string;
}
