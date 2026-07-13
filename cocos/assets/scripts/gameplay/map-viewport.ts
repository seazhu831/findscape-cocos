import type { SizeConfig, Vector2Config } from "../config/gameplay-schema";

export interface ViewportState {
  viewSize: SizeConfig;
  mapSize: SizeConfig;
  center: Vector2Config;
  zoom: number;
  minZoom: number;
  maxZoom: number;
}

export function screenToMapPoint(
  viewport: ViewportState,
  screenPoint: Vector2Config,
): Vector2Config {
  return {
    x:
      viewport.center.x +
      (screenPoint.x - viewport.viewSize.width / 2) / viewport.zoom,
    y:
      viewport.center.y +
      (screenPoint.y - viewport.viewSize.height / 2) / viewport.zoom,
  };
}

export function mapToScreenPoint(
  viewport: ViewportState,
  mapPoint: Vector2Config,
): Vector2Config {
  return {
    x:
      viewport.viewSize.width / 2 +
      (mapPoint.x - viewport.center.x) * viewport.zoom,
    y:
      viewport.viewSize.height / 2 +
      (mapPoint.y - viewport.center.y) * viewport.zoom,
  };
}

export function clampZoom(
  zoom: number,
  minZoom: number,
  maxZoom: number,
): number {
  return Math.min(Math.max(zoom, minZoom), maxZoom);
}

export function clampViewportCenter(
  viewport: Pick<ViewportState, "viewSize" | "mapSize" | "zoom">,
  center: Vector2Config,
): Vector2Config {
  return {
    x: clampViewportAxis(
      center.x,
      viewport.viewSize.width,
      viewport.mapSize.width,
      viewport.zoom,
    ),
    y: clampViewportAxis(
      center.y,
      viewport.viewSize.height,
      viewport.mapSize.height,
      viewport.zoom,
    ),
  };
}

export function panViewport(
  viewport: ViewportState,
  screenDelta: Vector2Config,
): ViewportState {
  const nextCenter = {
    x: viewport.center.x - screenDelta.x / viewport.zoom,
    y: viewport.center.y - screenDelta.y / viewport.zoom,
  };

  return {
    ...viewport,
    center: clampViewportCenter(viewport, nextCenter),
  };
}

export function zoomViewportAtScreenPoint(
  viewport: ViewportState,
  nextZoom: number,
  anchorScreenPoint: Vector2Config,
): ViewportState {
  const clampedZoom = clampZoom(
    nextZoom,
    viewport.minZoom,
    viewport.maxZoom,
  );
  const anchorMapPoint = screenToMapPoint(viewport, anchorScreenPoint);
  const nextCenter = {
    x:
      anchorMapPoint.x -
      (anchorScreenPoint.x - viewport.viewSize.width / 2) / clampedZoom,
    y:
      anchorMapPoint.y -
      (anchorScreenPoint.y - viewport.viewSize.height / 2) / clampedZoom,
  };

  const unclampedViewport = {
    ...viewport,
    zoom: clampedZoom,
  };

  return {
    ...unclampedViewport,
    center: clampViewportCenter(unclampedViewport, nextCenter),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function clampViewportAxis(
  center: number,
  viewSize: number,
  mapSize: number,
  zoom: number,
): number {
  const halfVisibleSize = viewSize / zoom / 2;
  if (halfVisibleSize * 2 >= mapSize) {
    return mapSize / 2;
  }

  return clamp(center, halfVisibleSize, mapSize - halfVisibleSize);
}
