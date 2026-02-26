export const errors = {
  validation: {
    entityNameDuplicate: 'Entity name "{{name}}" is already in use',
    missingRoadNetwork: 'No road network file specified',
    invalidParameter: 'Parameter "{{param}}" has an invalid value: {{value}}',
    emptyStoryboard: 'Storyboard has no stories defined',
    missingTrigger: 'Event "{{event}}" has no start trigger',
    circularEntityRef: 'Circular entity reference detected: {{ref}}',
    missingEntityRef: 'Referenced entity "{{ref}}" does not exist',
    invalidPosition: 'Invalid position specification',
    speedOutOfRange: 'Speed {{value}} is out of valid range ({{min}} - {{max}})',
    missingActor: 'Maneuver group "{{group}}" has no actors assigned',
  },
  parse: {
    invalidXml: 'Invalid XML format',
    unsupportedVersion: 'OpenSCENARIO version {{version}} is not supported',
    missingRequired: 'Required element "{{element}}" is missing',
    invalidAttribute: 'Invalid attribute "{{attr}}" on element "{{element}}"',
    malformedDocument: 'Malformed OpenSCENARIO document',
  },
  runtime: {
    simulationFailed: 'Simulation failed: {{reason}}',
    fileNotFound: 'File not found: {{path}}',
    connectionLost: 'Connection to simulation lost',
    exportFailed: 'Export failed: {{reason}}',
    importFailed: 'Import failed: {{reason}}',
  },
} as const;
