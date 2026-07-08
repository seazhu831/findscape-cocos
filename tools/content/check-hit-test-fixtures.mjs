import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(scriptDir, "fixtures/hit-test-cases.json");
const fixtures = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const failures = [];

for (const fixture of fixtures) {
  for (const testCase of fixture.cases) {
    const actual = isPointInTargetHitArea(
      fixture.targetPoint,
      testCase.point,
      fixture.spriteBounds,
    );

    if (actual !== testCase.expected) {
      failures.push(
        `${fixture.name} expected ${testCase.expected} for (${testCase.point.x}, ${testCase.point.y}) but got ${actual}`,
      );
    }
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Validated ${fixtures.length} hit-test fixture groups`);

function isPointInTargetHitArea(targetPoint, worldPoint, spriteBounds) {
  const localPoint = {
    x: worldPoint.x - targetPoint.position.x,
    y: worldPoint.y - targetPoint.position.y,
  };
  const hitShape = targetPoint.hitShape;

  if (hitShape.type === "circle") {
    return squaredDistance(localPoint) <= hitShape.radius * hitShape.radius;
  }

  if (hitShape.type === "rectangle") {
    return (
      Math.abs(localPoint.x) <= hitShape.width / 2 &&
      Math.abs(localPoint.y) <= hitShape.height / 2
    );
  }

  if (hitShape.type === "polygon") {
    return isPointInPolygon(localPoint, hitShape.points);
  }

  if (hitShape.type === "spriteBounds") {
    if (!spriteBounds) {
      return false;
    }

    return (
      Math.abs(localPoint.x) <= spriteBounds.width / 2 + hitShape.padding &&
      Math.abs(localPoint.y) <= spriteBounds.height / 2 + hitShape.padding
    );
  }

  return false;
}

function isPointInPolygon(point, polygonPoints) {
  let inside = false;

  for (
    let currentIndex = 0, previousIndex = polygonPoints.length - 1;
    currentIndex < polygonPoints.length;
    previousIndex = currentIndex++
  ) {
    const current = polygonPoints[currentIndex];
    const previous = polygonPoints[previousIndex];
    const crossesY =
      current.y > point.y !== previous.y > point.y;

    if (!crossesY) {
      continue;
    }

    const intersectionX =
      ((previous.x - current.x) * (point.y - current.y)) /
        (previous.y - current.y) +
      current.x;

    if (point.x < intersectionX) {
      inside = !inside;
    }
  }

  return inside;
}

function squaredDistance(point) {
  return point.x * point.x + point.y * point.y;
}
