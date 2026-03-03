import type { Position, Orientation, RoutePosition } from '@osce/shared';
import { buildAttrs, getSubBindings } from '../utils/xml-helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildPosition(pos: Position, bindings: Record<string, string> = {}): Record<string, any> {
  const orientationBindings = getSubBindings(bindings, 'orientation');
  switch (pos.type) {
    case 'worldPosition':
      return {
        WorldPosition: buildAttrs({
          x: pos.x,
          y: pos.y,
          z: pos.z,
          h: pos.h,
          p: pos.p,
          r: pos.r,
        }, bindings),
      };
    case 'lanePosition': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lp: any = buildAttrs({
        roadId: pos.roadId,
        laneId: pos.laneId,
        s: pos.s,
        offset: pos.offset,
      }, bindings);
      if (pos.orientation) lp.Orientation = buildOrientation(pos.orientation, orientationBindings);
      return { LanePosition: lp };
    }
    case 'relativeLanePosition': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rlp: any = buildAttrs({
        entityRef: pos.entityRef,
        dLane: pos.dLane,
        ds: pos.ds,
        dsLane: pos.dsLane,
        offset: pos.offset,
      }, bindings);
      if (pos.orientation) rlp.Orientation = buildOrientation(pos.orientation, orientationBindings);
      return { RelativeLanePosition: rlp };
    }
    case 'roadPosition': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rp: any = buildAttrs({
        roadId: pos.roadId,
        s: pos.s,
        t: pos.t,
      }, bindings);
      if (pos.orientation) rp.Orientation = buildOrientation(pos.orientation, orientationBindings);
      return { RoadPosition: rp };
    }
    case 'relativeRoadPosition': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rrp: any = buildAttrs({
        entityRef: pos.entityRef,
        ds: pos.ds,
        dt: pos.dt,
      }, bindings);
      if (pos.orientation) rrp.Orientation = buildOrientation(pos.orientation, orientationBindings);
      return { RelativeRoadPosition: rrp };
    }
    case 'relativeObjectPosition': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rop: any = buildAttrs({
        entityRef: pos.entityRef,
        dx: pos.dx,
        dy: pos.dy,
        dz: pos.dz,
      }, bindings);
      if (pos.orientation) rop.Orientation = buildOrientation(pos.orientation, orientationBindings);
      return { RelativeObjectPosition: rop };
    }
    case 'relativeWorldPosition': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rwp: any = buildAttrs({
        entityRef: pos.entityRef,
        dx: pos.dx,
        dy: pos.dy,
        dz: pos.dz,
      }, bindings);
      if (pos.orientation) rwp.Orientation = buildOrientation(pos.orientation, orientationBindings);
      return { RelativeWorldPosition: rwp };
    }
    case 'routePosition':
      return { RoutePosition: buildRoutePosition(pos) };
    case 'geoPosition': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gp: any = buildAttrs({
        latitude: pos.latitude,
        longitude: pos.longitude,
        altitude: pos.altitude,
      }, bindings);
      if (pos.orientation) gp.Orientation = buildOrientation(pos.orientation, orientationBindings);
      return { GeoPosition: gp };
    }
  }
}

export function buildPositionWrapped(pos: Position, bindings: Record<string, string> = {}): Record<string, unknown> {
  return { Position: buildPosition(pos, bindings) };
}

export function buildOrientation(o: Orientation, bindings: Record<string, string> = {}): Record<string, string> {
  return buildAttrs({ type: o.type, h: o.h, p: o.p, r: o.r }, bindings);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildRoutePosition(pos: RoutePosition): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = {};
  if (pos.routeRef.route) {
    result.RouteRef = {
      Route: {
        ...buildAttrs({ name: pos.routeRef.route.name, closed: pos.routeRef.route.closed }),
        Waypoint: pos.routeRef.route.waypoints.map((wp) => ({
          ...buildAttrs({ routeStrategy: wp.routeStrategy }),
          Position: buildPosition(wp.position),
        })),
      },
    };
  } else if (pos.routeRef.catalogReference) {
    result.RouteRef = {
      CatalogReference: buildAttrs({
        catalogName: pos.routeRef.catalogReference.catalogName,
        entryName: pos.routeRef.catalogReference.entryName,
      }),
    };
  }
  if (pos.inRoutePosition) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const irp: any = {};
    if (pos.inRoutePosition.fromCurrentEntity) {
      irp.FromCurrentEntity = buildAttrs({ entityRef: pos.inRoutePosition.fromCurrentEntity.entityRef });
    }
    if (pos.inRoutePosition.positionOfCurrentEntity) {
      irp.PositionOfCurrentEntity = buildAttrs({ entityRef: pos.inRoutePosition.positionOfCurrentEntity.entityRef });
    }
    if (pos.inRoutePosition.positionInRoadCoordinates) {
      irp.PositionInRoadCoordinates = buildAttrs({
        pathS: pos.inRoutePosition.positionInRoadCoordinates.pathS,
        t: pos.inRoutePosition.positionInRoadCoordinates.t,
      });
    }
    if (pos.inRoutePosition.positionInLaneCoordinates) {
      irp.PositionInLaneCoordinates = buildAttrs({
        pathS: pos.inRoutePosition.positionInLaneCoordinates.pathS,
        laneId: pos.inRoutePosition.positionInLaneCoordinates.laneId,
        laneOffset: pos.inRoutePosition.positionInLaneCoordinates.laneOffset,
      });
    }
    result.InRoutePosition = irp;
  }
  if (pos.orientation) {
    result.Orientation = buildOrientation(pos.orientation);
  }
  return result;
}
