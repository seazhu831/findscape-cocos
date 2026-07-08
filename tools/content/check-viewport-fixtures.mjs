import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(scriptDir, "fixtures/viewport-cases.json");
const fixtures = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const failures = [];

for (const fixture of fixtures) {
  for (const check of fixture.screenToMap ?? []) {
    const actual = screenToMapPoint(fixture.viewport, check.screenPoint);
    assertPoint(fixture.name, "screenToMap", actual, check.expected);
  }

  for (const check of fixture.mapToScreen ?? []) {
    const actual = mapToScreenPoint(fixture.viewport, check.mapPoint);
    assertPoint(fixture.name, "mapToScreen", actual, check.expected);
  }

  if (fixture.pan) {
    const actual = panViewport(
      fixture.viewport,
      fixture.pan.screenDelta,
    ).center;
    assertPoint(fixture.name, "pan", actual, fixture.pan.expectedCenter);
  }

  if (fixture.clampCenter) {
    const actual = clampViewportCenter(
      fixture.viewport,
      fixture.clampCenter.center,
    );
    assertPoint(
      fixture.name,
      "clampCenter",
      actual,
      fixture.clampCenter.expectedCenter,
    );
  }

  if (fixture.zoomAt) {
    const actual = zoomViewportAtScreenPoint(
      fixture.viewport,
      fixture.zoomAt.nextZoom,
      fixture.zoomAt.anchorScreenPoint,
    ).center;
    assertPoint(fixture.name, "zoomAt", actual, fixture.zoomAt.expectedCenter);
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Validated ${fixtures.length} viewport fixture groups`);

function screenToMapPoint(viewport, screenPoint) {
  return {
    x:
      viewport.center.x +
      (screenPoint.x - viewport.viewSize.width / 2) / viewport.zoom,
    y:
      viewport.center.y +
      (screenPoint.y - viewport.viewSize.height / 2) / viewport.zoom,
  };
}

function mapToScreenPoint(viewport, mapPoint) {
  return {
    x:
      viewport.viewSize.width / 2 +
      (mapPoint.x - viewport.center.x) * viewport.zoom,
    y:
      viewport.viewSize.height / 2 +
      (mapPoint.y - viewport.center.y) * viewport.zoom,
  };
}

function clampViewportCenter(viewport, center) {
  const halfVisibleWidth = viewport.viewSize.width / viewport.zoom / 2;
  const halfVisibleHeight = viewport.viewSize.height / viewport.zoom / 2;

  return {
    x: clamp(
      center.x,
      halfVisibleWidth,
      Math.max(halfVisibleWidth, viewport.mapSize.width - halfVisibleWidth),
    ),
    y: clamp(
      center.y,
      halfVisibleHeight,
      Math.max(halfVisibleHeight, viewport.mapSize.height - halfVisibleHeight),
    ),
  };
}

function panViewport(viewport, screenDelta) {
  const nextCenter = {
    x: viewport.center.x - screenDelta.x / viewport.zoom,
    y: viewport.center.y - screenDelta.y / viewport.zoom,
  };

  return {
    ...viewport,
    center: clampViewportCenter(viewport, nextCenter),
  };
}

function zoomViewportAtScreenPoint(viewport, nextZoom, anchorScreenPoint) {
  const clampedZoom = clampZoom(nextZoom, viewport.minZoom, viewport.maxZoom);
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

function clampZoom(zoom, minZoom, maxZoom) {
  return Math.min(Math.max(zoom, minZoom), maxZoom);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function assertPoint(groupName, checkName, actual, expected) {
  if (!nearlyEqual(actual.x, expected.x) || !nearlyEqual(actual.y, expected.y)) {
    failures.push(
      `${groupName} ${checkName} expected (${expected.x}, ${expected.y}) but got (${actual.x}, ${actual.y})`,
    );
  }
}

function nearlyEqual(a, b) {
  return Math.abs(a - b) < 0.000001;
}
