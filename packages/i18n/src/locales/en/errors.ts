export const errors = {
  validation: {
    struct001: 'FileHeader is missing required information',
    struct002: 'Storyboard is required',
    struct003: 'Story "{{name}}" has no Acts',
    struct004: 'Act "{{name}}" has an empty StartTrigger',
    struct005: 'Event "{{name}}" has an empty StartTrigger',
    struct006: 'ManeuverGroup "{{name}}" has no actors',
    struct007: 'Entity "{{name}}" has no definition',
    ref001: 'Entity reference "{{ref}}" in {{location}} does not match any defined entity',
    ref003: 'Parameter reference "{{ref}}" does not match any declared parameter',
    val001: 'Vehicle "{{name}}" has a negative maxSpeed',
    val003: 'Entity "{{name}}" has non-positive bounding box dimensions',
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
