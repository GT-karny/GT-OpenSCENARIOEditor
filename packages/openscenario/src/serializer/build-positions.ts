import type { Position, Orientation, RoutePosition } from '@osce/shared';
import { buildAttrs } from '../utils/xml-helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildPosition(pos: Position): Record<string, any> {
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
        }),
      };
    case 'lanePosition': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lp: any = buildAttrs({
        roadId: pos.roadId,
        laneId: pos.laneId,
        s: pos.s,
        offset: pos.offset,
      });
      if (pos.orientation) lp.Orientation = buildOrientation(pos.orientation);
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
      });
      if (pos.orientation) rlp.Orientation = buildOrientation(pos.orientation);
      return { RelativeLanePosition: rlp };
    }
    case 'roadPosition': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rp: any = buildAttrs({
        roadId: pos.roadId,
        s: pos.s,
        t: pos.t,
      });
      if (pos.orientation) rp.Orientation = buildOrientation(pos.orientation);
      return { RoadPosition: rp };
    }
    case 'relativeRoadPosition': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rrp: any = buildAttrs({
        entityRef: pos.entityRef,
        ds: pos.ds,
        dt: pos.dt,
      });
      if (pos.orientation) rrp.Orientation = buildOrientation(pos.orientation);
      return { RelativeRoadPosition: rrp };
    }
    case 'relativeObjectPosition': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rop: any = buildAttrs({
        entityRef: pos.entityRef,
        dx: pos.dx,
        dy: pos.dy,
        dz: pos.dz,
      });
      if (pos.orientation) rop.Orientation = buildOrientation(pos.orientation);
      return { RelativeObjectPosition: rop };
    }
    case 'relativeWorldPosition': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rwp: any = buildAttrs({
        entityRef: pos.entityRef,
        dx: pos.dx,
        dy: pos.dy,
        dz: pos.dz,
      });
      if (pos.orientation) rwp.Orientation = buildOrientation(pos.orientation);
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
      });
      if (pos.orientation) gp.Orientation = buildOrientation(pos.orientation);
      return { GeoPosition: gp };
    }
  }
}

export function buildPositionWrapped(pos: Position): Record<string, unknown> {
  return { Position: buildPosition(pos) };
}

export function buildOrientation(o: Orientation): Record<string, string> {
  return buildAttrs({ type: o.type, h: o.h, p: o.p, r: o.r });
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
