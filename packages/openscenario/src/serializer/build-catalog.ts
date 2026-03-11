import type {
  CatalogDocument,
  ControllerDefinition,
  Environment,
  Maneuver,
  Trajectory,
  Route,
} from '@osce/shared';
import { createXoscXmlBuilder } from './fxp-builder-config.js';
import { buildFileHeader } from './build-file-header.js';
import { buildVehicle, buildPedestrian, buildMiscObject, buildControllerDefinition } from './build-entities.js';
import { buildEnvironment, buildTrajectory, buildRoute } from './build-actions.js';
import { buildManeuver } from './build-storyboard.js';
import { buildAttrs } from '../utils/xml-helpers.js';

export function serializeCatalog(doc: CatalogDocument, formatted = true): string {
  const builder = createXoscXmlBuilder(formatted);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const catalogContent: any = {
    ...buildAttrs({ name: doc.catalogName }),
  };

  // Group entries by type
  const vehicles = doc.entries.filter((e) => e.catalogType === 'vehicle');
  const pedestrians = doc.entries.filter((e) => e.catalogType === 'pedestrian');
  const miscObjects = doc.entries.filter((e) => e.catalogType === 'miscObject');
  const controllers = doc.entries.filter((e) => e.catalogType === 'controller');
  const environments = doc.entries.filter((e) => e.catalogType === 'environment');
  const maneuvers = doc.entries.filter((e) => e.catalogType === 'maneuver');
  const trajectories = doc.entries.filter((e) => e.catalogType === 'trajectory');
  const routes = doc.entries.filter((e) => e.catalogType === 'route');

  if (vehicles.length > 0) {
    const pb = doc._parameterBindings;
    catalogContent.Vehicle = vehicles.map((e) =>
      buildVehicle(e.definition, pb?.[e.definition.name]),
    );
  }
  if (pedestrians.length > 0) {
    catalogContent.Pedestrian = pedestrians.map((e) => buildPedestrian(e.definition));
  }
  if (miscObjects.length > 0) {
    catalogContent.MiscObject = miscObjects.map((e) => buildMiscObject(e.definition));
  }
  if (controllers.length > 0) {
    catalogContent.Controller = controllers.map((e) =>
      buildControllerDefinition(e.definition as ControllerDefinition),
    );
  }
  if (environments.length > 0) {
    catalogContent.Environment = environments.map((e) =>
      buildEnvironment(e.definition as Environment),
    );
  }
  if (maneuvers.length > 0) {
    catalogContent.Maneuver = maneuvers.map((e) =>
      buildManeuver(e.definition as Maneuver, {}),
    );
  }
  if (trajectories.length > 0) {
    catalogContent.Trajectory = trajectories.map((e) =>
      buildTrajectory(e.definition as Trajectory),
    );
  }
  if (routes.length > 0) {
    catalogContent.Route = routes.map((e) =>
      buildRoute(e.definition as Route),
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const xmlObj: any = {
    OpenSCENARIO: {
      FileHeader: buildFileHeader(doc.fileHeader),
      Catalog: catalogContent,
    },
  };

  const xmlDecl = '<?xml version="1.0" encoding="UTF-8"?>\n';
  return xmlDecl + builder.build(xmlObj);
}
