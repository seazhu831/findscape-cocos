import type {
  SceneEntityConfig,
  SceneRegionConfig,
} from "../config/gameplay-schema";
import type { ViewportState } from "./map-viewport";

export interface MapRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function viewportToMapRectangle(
  viewport: Pick<ViewportState, "center" | "viewSize" | "zoom">,
): MapRectangle {
  const width = viewport.viewSize.width / viewport.zoom;
  const height = viewport.viewSize.height / viewport.zoom;
  return {
    x: viewport.center.x - width / 2,
    y: viewport.center.y - height / 2,
    width,
    height,
  };
}

export function resolveActiveSceneRegionIds(
  regions: SceneRegionConfig[],
  viewport: MapRectangle,
): Set<string> {
  return new Set(
    regions
      .filter((region) =>
        rectanglesIntersect(
          expandRectangle(region.bounds, region.activationMargin),
          viewport,
        ),
      )
      .map((region) => region.regionId),
  );
}

export function resolveVisibleSceneEntityIds(
  entities: SceneEntityConfig[],
  viewport: MapRectangle,
  margin = 0,
): Set<string> {
  const expandedViewport = expandRectangle(viewport, Math.max(0, margin));
  return new Set(
    entities
      .filter((entity) => pointInside(entity.transform.position, expandedViewport))
      .map((entity) => entity.entityId),
  );
}

function expandRectangle(
  rectangle: MapRectangle,
  margin: number,
): MapRectangle {
  return {
    x: rectangle.x - margin,
    y: rectangle.y - margin,
    width: rectangle.width + margin * 2,
    height: rectangle.height + margin * 2,
  };
}

function rectanglesIntersect(left: MapRectangle, right: MapRectangle): boolean {
  return (
    left.x <= right.x + right.width &&
    left.x + left.width >= right.x &&
    left.y <= right.y + right.height &&
    left.y + left.height >= right.y
  );
}

function pointInside(
  point: { x: number; y: number },
  rectangle: MapRectangle,
): boolean {
  return (
    point.x >= rectangle.x &&
    point.x <= rectangle.x + rectangle.width &&
    point.y >= rectangle.y &&
    point.y <= rectangle.y + rectangle.height
  );
}
