/**
 * Editor metadata types for junction editing.
 *
 * These types are internal to the editor and NOT part of the OpenDRIVE standard.
 * They enable features like "virtual roads" (editing roads as continuous entities
 * that are split only on export) and junction auto-detection.
 */

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
