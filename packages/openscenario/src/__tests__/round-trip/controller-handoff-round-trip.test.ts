import { describe, expect, it } from 'vitest';
import type { ActivateControllerAction, ScenarioEntity } from '@osce/shared';
import { parsePrivateAction } from '../../parser/parse-actions.js';
import { parseEntities } from '../../parser/parse-entities.js';
import { buildPrivateAction } from '../../serializer/build-actions.js';
import { buildEntities } from '../../serializer/build-entities.js';
import { createXoscXmlBuilder } from '../../serializer/fxp-builder-config.js';
import { createXoscXmlParser } from '../../parser/fxp-config.js';

const xmlBuilder = createXoscXmlBuilder(false);
const xmlParser = createXoscXmlParser();

describe('controller handoff round-trip', () => {
  const action: ActivateControllerAction = {
    type: 'activateControllerAction',
    objectControllerRef: 'VirtualDriverController',
    lateral: false,
    longitudinal: false,
  };

  it('preserves explicit false flags and writes the v1.3 objectControllerRef', () => {
    const xml = xmlBuilder.build({ PrivateAction: buildPrivateAction(action, {}, 3) });
    expect(xml).toContain('objectControllerRef="VirtualDriverController"');
    expect(xml).toContain('lateral="false"');
    expect(xml).toContain('longitudinal="false"');

    const reparsed = parsePrivateAction(xmlParser.parse(xml).PrivateAction);
    expect(reparsed).toEqual(action);
  });

  it('writes the legacy controllerRef for v1.2 while retaining the unified model', () => {
    const xml = xmlBuilder.build({ PrivateAction: buildPrivateAction(action, {}, 2) });
    expect(xml).toContain('controllerRef="VirtualDriverController"');
    expect(xml).not.toContain('objectControllerRef=');
    expect(parsePrivateAction(xmlParser.parse(xml).PrivateAction)).toMatchObject({
      controllerRef: 'VirtualDriverController',
      lateral: false,
      longitudinal: false,
    });
  });

  it('preserves multiple named object controllers on one entity', () => {
    const entities: ScenarioEntity[] = [
      {
        id: 'ego',
        name: 'Ego',
        type: 'vehicle',
        definition: {
          kind: 'catalogReference',
          catalogName: 'VehicleCatalog',
          entryName: 'EgoVehicle',
          parameterAssignments: [],
        },
        controllers: [
          {
            name: 'ManualDriveController',
            controller: {
              kind: 'controller',
              name: 'ManualDrive',
              properties: [{ name: 'esminiController', value: 'ExternalController' }],
            },
          },
          {
            name: 'VirtualDriverController',
            controller: {
              kind: 'controller',
              name: 'VirtualDriver',
              properties: [{ name: 'ConfigFile', value: 'vd.xml' }],
            },
          },
        ],
      },
    ];
    const xml = xmlBuilder.build({ Entities: buildEntities(entities) });
    const reparsed = parseEntities(xmlParser.parse(xml).Entities);

    expect(reparsed[0].controllers).toMatchObject(entities[0].controllers!);
  });
});
