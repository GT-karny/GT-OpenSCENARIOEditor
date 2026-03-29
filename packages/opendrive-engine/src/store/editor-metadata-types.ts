/**
 * Editor metadata types for junction editing.
 *
 * These types are internal to the editor and NOT part of the OpenDRIVE standard.
 * They enable features like "virtual roads" (editing roads as continuous entities
 * that are split only on export) and junction auto-detection.
 */

import type { TurnType } from '../builders/connecting-road-builder.js';

/** Per-lane turn permission for junction routing overrides. */
export interface LaneTurnPermission {
  laneId: number;
  allowedTurns: TurnType[];
}

/** Per-endpoint routing override specifying which lanes may turn in which directions. */
export interface EndpointLaneRouting {
  roadId: string;
  contactPoint: 'start' | 'end';
  lanePermissions: LaneTurnPermission[];
}

/**
 * A virtual road represents a continuous road in the editor that may be
 * split into multiple OdrRoad segments at junction intersection points.
 *
 * In the editor, users interact with virtual roads as single entities.
 * On export to .xodr, virtual roads are materialized as their segment roads.
 */
export interface VirtualRoad {
  /** Unique identifier for the virtual road. */
  virtualRoadId: string;
  /** Ordered list of OdrRoad IDs that compose this virtual road. */
  segmentRoadIds: string[];
}

/**
 * Metadata attached to a junction, tracking editor-specific information
 * beyond the standard OpenDRIVE junction data.
 */
export interface JunctionMetadata {
  /** ID of the OdrJunction this metadata belongs to. */
  junctionId: string;
  /** Virtual road IDs that intersect at this junction. */
  intersectingVirtualRoadIds: string[];
  /** IDs of auto-generated connecting roads (deleted when junction is removed). */
  connectingRoadIds: string[];
  /** Whether this junction was created by auto-detection (true) or manually (false). */
  autoCreated: boolean;
}

/**
 * Lane routing configuration for automatic connecting road generation.
 * Controls which lanes are allowed to turn in which directions.
 */
export interface LaneRoutingConfig {
  /** Which lanes can make right turns. */
  rightTurnLanes: 'outermost' | 'any';
  /** Which lanes can make left turns. */
  leftTurnLanes: 'innermost' | 'any';
  /** Whether to generate U-turn connecting roads. */
  generateUturn: boolean;
  /** Maximum number of lanes for right turns (default: 1). */
  maxRightTurnLanes?: number;
  /** Maximum number of lanes for left turns (default: 1). */
  maxLeftTurnLanes?: number;
}

/**
 * Global junction settings stored per-project.
 */
export interface JunctionSettings {
  /** Lane routing rules for auto-generated connecting roads. */
  laneRouting: LaneRoutingConfig;
  /** Default junction type for new junctions. */
  defaultJunctionType: 'default' | 'virtual';
  /** Whether auto-detection is enabled globally. */
  autoDetectEnabled: boolean;
}

/**
 * Metadata for a signal assembly — groups multiple signal heads on one pole.
 * This is editor-internal and NOT part of the OpenDRIVE standard.
 */
export interface SignalAssemblyMetadata {
  assemblyId: string;
  roadId: string;
  signalIds: string[];
  poleType: 'straight' | 'arm';
  armLength?: number;
  armAngle?: number;
  /** OpenDRIVE object ID for the vertical pole (type="pole"). */
  poleObjectId?: string;
  /** OpenDRIVE object ID for the horizontal arm (type="pole"). */
  armObjectId?: string;
  headPositions: {
    signalId: string;
    presetId?: string;
    position: string;
    offsetY?: number;
    /** Horizontal offset from pole tip in meters (configurator X). */
    x?: number;
    /** Vertical offset from pole tip in meters (configurator Y). */
    y?: number;
  }[];
}

/**
 * Top-level editor metadata, persisted in .osce.json.
 * Designed to be extensible — new fields can be added in future versions.
 */
export interface EditorMetadata {
  /** Schema version for forward-compatibility. */
  version: string;
  /** Virtual road definitions. */
  virtualRoads: VirtualRoad[];
  /** Per-junction editor metadata. */
  junctionMetadata: JunctionMetadata[];
  /** Junction settings. */
  settings: JunctionSettings;
  /** Signal assembly metadata (editor-internal). */
  signalAssemblies?: SignalAssemblyMetadata[];
}

/** Current schema version for editor metadata. */
export const EDITOR_METADATA_VERSION = '1.0.0';

/** Default lane routing configuration. */
export function createDefaultLaneRoutingConfig(): LaneRoutingConfig {
  return {
    rightTurnLanes: 'any',
    leftTurnLanes: 'any',
    generateUturn: false,
  };
}

/** Default junction settings. */
export function createDefaultJunctionSettings(): JunctionSettings {
  return {
    laneRouting: createDefaultLaneRoutingConfig(),
    defaultJunctionType: 'default',
    autoDetectEnabled: true,
  };
}

/** Create empty editor metadata with defaults. */
export function createDefaultEditorMetadata(): EditorMetadata {
  return {
    version: EDITOR_METADATA_VERSION,
    virtualRoads: [],
    junctionMetadata: [],
    settings: createDefaultJunctionSettings(),
  };
}
