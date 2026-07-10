export function createPreviewModel(config, manifest, modeId) {
  const mode = findRequired(config.gameModes, "modeId", modeId);
  const mapConfig = findRequired(config.maps, "mapId", mode.mapId);
  const pointSet = findRequired(
    config.targetPointSets,
    "targetPointSetId",
    mapConfig.targetPointSetId,
  );
  const selectedTargets = selectTargetsForMode(mode, pointSet.targetPoints);

  return {
    config,
    manifest,
    mode,
    mapConfig,
    selectedTargets,
    foundTargetIds: new Set(),
    score: 0,
  };
}

export function applyPreviewTap(model, point) {
  if (isPreviewComplete(model)) {
    return model;
  }

  const hitTarget = model.selectedTargets.find((target) =>
    !model.foundTargetIds.has(target.targetId) &&
      isPointInTargetHitArea(target, point),
  );

  if (!hitTarget) {
    return {
      ...model,
      score: Math.max(0, model.score - getScoringRule(model).wrongTapPenalty),
    };
  }

  return {
    ...model,
    foundTargetIds: new Set([...model.foundTargetIds, hitTarget.targetId]),
    score: model.score + (hitTarget.reward.score || getScoringRule(model).correctHitScore),
  };
}

export function selectTargetsForMode(mode, targetPoints) {
  const rule = mode.targetSelectionRule;
  if (rule.type === "byCategoryCounts") {
    return Object.entries(rule.countsByType).flatMap(([typeId, count]) =>
      targetPoints.filter((target) => target.typeId === typeId).slice(0, count),
    );
  }
  if (rule.type === "byTag") {
    return targetPoints
      .filter((target) => target.tags.includes(rule.tag))
      .slice(0, rule.count);
  }
  if (rule.type === "allOfType") {
    return targetPoints.filter((target) => target.typeId === rule.typeId);
  }
  return [];
}

export function isPreviewComplete(model) {
  return (
    model.selectedTargets.length > 0 &&
    model.foundTargetIds.size >= model.selectedTargets.length
  );
}

export function createTargetCounts(model) {
  const counts = new Map();
  for (const target of model.selectedTargets) {
    counts.set(target.typeId, (counts.get(target.typeId) ?? 0) + 1);
  }
  return counts;
}

export function createAssetStateCounts(manifest) {
  return manifest.assets.reduce((counts, asset) => {
    counts[asset.state] = (counts[asset.state] ?? 0) + 1;
    return counts;
  }, {});
}

export function getActiveModeAssets(model) {
  const toolAssetPaths = model.mode.toolIds
    .map((toolId) => model.config.tools.find((tool) => tool.toolId === toolId)?.iconAsset)
    .filter(Boolean);
  const targetAssetPaths = [...createTargetCounts(model).keys()].flatMap((typeId) => {
    const targetType = getTargetType(model, typeId);
    return [targetType?.iconAsset, targetType?.targetAsset].filter(Boolean);
  });
  const runtimePaths = [
    model.mapConfig.backgroundAsset,
    ...targetAssetPaths,
    ...toolAssetPaths,
  ];
  const runtimePathSet = new Set(runtimePaths);
  return model.manifest.assets.filter((asset) =>
    runtimePathSet.has(asset.runtimePath),
  );
}

export function isPointInTargetHitArea(target, point) {
  const localPoint = {
    x: point.x - target.position.x,
    y: point.y - target.position.y,
  };
  const shape = target.hitShape;
  if (shape.type === "circle") {
    return localPoint.x * localPoint.x + localPoint.y * localPoint.y <= shape.radius * shape.radius;
  }
  if (shape.type === "rectangle") {
    return (
      Math.abs(localPoint.x) <= shape.width / 2 &&
      Math.abs(localPoint.y) <= shape.height / 2
    );
  }
  if (shape.type === "polygon") {
    return isPointInPolygon(localPoint, shape.points);
  }
  return false;
}

export function isPointInPolygon(point, polygonPoints) {
  let inside = false;
  for (
    let currentIndex = 0, previousIndex = polygonPoints.length - 1;
    currentIndex < polygonPoints.length;
    previousIndex = currentIndex++
  ) {
    const current = polygonPoints[currentIndex];
    const previous = polygonPoints[previousIndex];
    const crossesY = current.y > point.y !== previous.y > point.y;
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

export function getScoringRule(model) {
  return findRequired(
    model.config.scoringRules,
    "scoringRuleId",
    model.mode.scoringRuleId,
  );
}

export function getTargetType(model, typeId) {
  return model.config.targetTypes.find((targetType) => targetType.typeId === typeId);
}

function findRequired(items, fieldName, value) {
  const item = items.find((candidate) => candidate[fieldName] === value);
  if (!item) {
    throw new Error(`Missing ${fieldName}: ${value}`);
  }
  return item;
}
