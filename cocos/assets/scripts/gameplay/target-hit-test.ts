import type {
  SizeConfig,
  TargetPointConfig,
  Vector2Config,
} from "../config/gameplay-schema";

export interface HitTestOptions {
  spriteBoundsByTargetId?: Record<string, SizeConfig>;
}

export function isPointInTargetHitArea(
  targetPoint: TargetPointConfig,
  worldPoint: Vector2Config,
  options: HitTestOptions = {},
): boolean {
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
    const spriteBounds = options.spriteBoundsByTargetId?.[targetPoint.targetId];
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

export function isPointInPolygon(
  point: Vector2Config,
  polygonPoints: Vector2Config[],
): boolean {
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

function squaredDistance(point: Vector2Config): number {
  return point.x * point.x + point.y * point.y;
}
