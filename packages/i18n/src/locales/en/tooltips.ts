export const tooltips = {
  panels: {
    templates: 'Drag and drop scenario templates to quickly build scenarios',
    nodeEditor: 'Visual representation of the scenario structure',
    properties: 'Edit properties of the selected element',
    entityList: 'Manage scenario entities (vehicles, pedestrians, objects)',
    timeline: 'View and edit the temporal sequence of events',
    validation: 'View validation results and fix issues',
    simulation: 'Configure and run scenario simulations',
    '3dViewer': 'Preview the scenario in 3D view',
  },
  parameters: {
    speedGauge: 'Adjust the speed using the gauge',
    distanceLine: 'Set the distance by dragging the line',
    laneSelector: 'Click a lane to select it',
    positionPicker: 'Click on the map to set the position',
    angleArc: 'Adjust the angle by dragging the arc',
    timeDuration: 'Set the time duration',
    slider: 'Drag the slider to adjust the value',
    entitySelector: 'Select an entity from the list',
  },
  actions: {
    decompose: 'Convert this template into OpenSCENARIO elements',
    addTemplate: 'Add a new scenario template',
    removeTemplate: 'Remove this template from the scenario',
    editParameters: 'Edit template parameters',
  },
} as const;
