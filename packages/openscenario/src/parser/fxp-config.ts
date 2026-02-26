import { XMLParser } from 'fast-xml-parser';

const ARRAY_ELEMENTS = new Set([
  'ScenarioObject',
  'ParameterDeclaration',
  'VariableDeclaration',
  'ParameterAssignment',
  'Property',
  'Story',
  'Act',
  'ManeuverGroup',
  'Maneuver',
  'Event',
  'Action',
  'Private',
  'ConditionGroup',
  'Condition',
  'EntityRef',
  'Vertex',
  'SpeedProfileEntry',
  'Knot',
  'ControlPoint',
  'TrafficSignalController',
  'TrafficSignalPhase',
  'TrafficSignalState',
  'AdditionalAxle',
  'Waypoint',
  'LaneRange',
]);

export function createXoscXmlParser(): XMLParser {
  return new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (name: string, _jpath: string, _isLeafNode: boolean, isAttribute: boolean) => {
      if (isAttribute) return false;
      return ARRAY_ELEMENTS.has(name);
    },
    parseTagValue: false,
    parseAttributeValue: false,
    preserveOrder: false,
    allowBooleanAttributes: true,
    trimValues: true,
  });
}
