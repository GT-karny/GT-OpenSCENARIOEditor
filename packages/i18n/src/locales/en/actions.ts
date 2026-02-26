export const actions = {
  speedAction: {
    name: 'Speed Action',
    description: 'Change entity speed to a target value',
    params: {
      targetSpeed: { name: 'Target Speed', description: 'Desired speed' },
      dynamicsShape: { name: 'Dynamics Shape', description: 'Shape of the speed transition curve' },
      dynamicsDimension: { name: 'Dynamics Dimension', description: 'How transition value is interpreted' },
      dynamicsValue: { name: 'Dynamics Value', description: 'Transition parameter value' },
    },
  },
  laneChangeAction: {
    name: 'Lane Change Action',
    description: 'Change to an adjacent lane',
    params: {
      targetLane: { name: 'Target Lane', description: 'Target lane (relative or absolute)' },
      isRelative: { name: 'Relative', description: 'Whether lane target is relative to current lane' },
      referenceEntity: { name: 'Reference Entity', description: 'Entity for relative lane reference' },
      dynamicsShape: { name: 'Dynamics Shape', description: 'Shape of the lane change curve' },
      dynamicsDimension: { name: 'Dynamics Dimension', description: 'How transition value is interpreted' },
      dynamicsValue: { name: 'Dynamics Value', description: 'Transition parameter value' },
      targetLaneOffset: { name: 'Lane Offset', description: 'Lateral offset within target lane' },
    },
  },
  teleportAction: {
    name: 'Teleport Action',
    description: 'Instantly move entity to a position',
    params: {
      positionType: { name: 'Position Type', description: 'Type of position specification' },
      roadId: { name: 'Road ID', description: 'Road identifier' },
      laneId: { name: 'Lane ID', description: 'Lane identifier' },
      s: { name: 'S Coordinate', description: 'Position along the road' },
      offset: { name: 'Offset', description: 'Lateral offset within the lane' },
      worldX: { name: 'World X', description: 'X coordinate in world space' },
      worldY: { name: 'World Y', description: 'Y coordinate in world space' },
      worldH: { name: 'Heading', description: 'Heading angle in radians' },
    },
  },
  longitudinalDistanceAction: {
    name: 'Longitudinal Distance Action',
    description: 'Maintain longitudinal distance to a reference entity',
    params: {
      entityRef: { name: 'Reference Entity', description: 'Entity to maintain distance from' },
      distance: { name: 'Distance', description: 'Target longitudinal distance' },
      timeGap: { name: 'Time Gap', description: 'Target time gap' },
      useTimeGap: { name: 'Use Time Gap', description: 'Use time gap instead of distance' },
      freespace: { name: 'Freespace', description: 'Whether distance is measured edge-to-edge' },
      continuous: { name: 'Continuous', description: 'Whether action runs continuously' },
    },
  },
  lateralDistanceAction: {
    name: 'Lateral Distance Action',
    description: 'Maintain lateral distance to a reference entity',
    params: {
      entityRef: { name: 'Reference Entity', description: 'Entity to maintain distance from' },
      distance: { name: 'Distance', description: 'Target lateral distance' },
      freespace: { name: 'Freespace', description: 'Whether distance is measured edge-to-edge' },
      continuous: { name: 'Continuous', description: 'Whether action runs continuously' },
    },
  },
  followTrajectoryAction: {
    name: 'Follow Trajectory Action',
    description: 'Follow a predefined trajectory path',
    params: {
      trajectoryName: { name: 'Trajectory Name', description: 'Name of the trajectory' },
      closed: { name: 'Closed', description: 'Whether trajectory forms a closed loop' },
      followingMode: { name: 'Following Mode', description: 'How the entity follows the trajectory' },
      useTimingReference: { name: 'Use Timing', description: 'Whether to use timing reference' },
    },
  },
} as const;
