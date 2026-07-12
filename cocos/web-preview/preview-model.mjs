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
    viewport: createPreviewViewport(mapConfig, mapConfig.worldSize),
    selectedTargets,
    foundTargetIds: new Set(),
    score: 0,
  };
}

export function setPreviewViewSize(model, viewSize) {
  const viewport = createPreviewViewport(model.mapConfig, viewSize);
  const zoom = clamp(
    model.viewport?.zoom ?? viewport.zoom,
    viewport.minZoom,
    viewport.maxZoom,
  );
  const nextViewport = {
    ...viewport,
    zoom,
  };

  return {
    ...model,
    viewport: {
      ...nextViewport,
      center: clampViewportCenter(
        nextViewport,
        model.viewport?.center ?? viewport.center,
      ),
    },
  };
}

export function applyPreviewTap(model, point) {
  return applyPreviewTapUpdate(model, point).model;
}

export function applyPreviewTapUpdate(model, point) {
  if (isPreviewComplete(model)) {
    return {
      model,
      events: [],
      feedbackPlans: [],
    };
  }

  const hitTarget = model.selectedTargets.find((target) =>
    !model.foundTargetIds.has(target.targetId) &&
      isPointInTargetHitArea(target, point),
  );

  if (!hitTarget) {
    const nextModel = {
      ...model,
      score: Math.max(0, model.score - getScoringRule(model).wrongTapPenalty),
    };
    const events = [
      {
        type: "wrongTap",
      },
    ];

    return {
      model: nextModel,
      events,
      feedbackPlans: createPreviewFeedbackPlans(nextModel, events),
    };
  }

  const foundTargetIds = new Set([...model.foundTargetIds, hitTarget.targetId]);
  const scoreAdded = hitTarget.reward.score || getScoringRule(model).correctHitScore;
  const nextModel = {
    ...model,
    foundTargetIds,
    score: model.score + scoreAdded,
  };
  const events = [
    {
      type: "correctHit",
      target: hitTarget,
      scoreAdded,
      isRoundComplete: isPreviewComplete(nextModel),
    },
  ];

  if (isPreviewComplete(nextModel)) {
    events.push({
      type: "roundCompleted",
      finalScore: nextModel.score,
    });
  }

  return {
    model: nextModel,
    events,
    feedbackPlans: createPreviewFeedbackPlans(nextModel, events),
  };
}

export function createPreviewFeedbackPlans(model, events) {
  return events.flatMap((event, index) =>
    createPreviewFeedbackPlan(model, event, index),
  );
}

export function resetPreviewViewport(model, viewSize = model.viewport.viewSize) {
  return {
    ...model,
    viewport: createPreviewViewport(model.mapConfig, viewSize),
  };
}

export function panPreviewViewport(model, screenDelta) {
  const viewport = model.viewport;
  const nextCenter = {
    x: viewport.center.x - screenDelta.x / viewport.zoom,
    y: viewport.center.y - screenDelta.y / viewport.zoom,
  };

  return {
    ...model,
    viewport: {
      ...viewport,
      center: clampViewportCenter(viewport, nextCenter),
    },
  };
}

export function zoomPreviewViewport(model, nextZoom, anchorScreenPoint) {
  const viewport = model.viewport;
  const zoom = clamp(nextZoom, viewport.minZoom, viewport.maxZoom);
  const anchorMapPoint = screenToMapPoint(model, anchorScreenPoint);
  const nextCenter = {
    x:
      anchorMapPoint.x -
      (anchorScreenPoint.x - viewport.viewSize.width / 2) / zoom,
    y:
      anchorMapPoint.y -
      (anchorScreenPoint.y - viewport.viewSize.height / 2) / zoom,
  };
  const nextViewport = {
    ...viewport,
    zoom,
  };

  return {
    ...model,
    viewport: {
      ...nextViewport,
      center: clampViewportCenter(nextViewport, nextCenter),
    },
  };
}

export function screenToMapPoint(model, screenPoint) {
  const viewport = model.viewport;
  return {
    x:
      viewport.center.x +
      (screenPoint.x - viewport.viewSize.width / 2) / viewport.zoom,
    y:
      viewport.center.y +
      (screenPoint.y - viewport.viewSize.height / 2) / viewport.zoom,
  };
}

export function mapToScreenPoint(model, mapPoint) {
  const viewport = model.viewport;
  return {
    x:
      viewport.viewSize.width / 2 +
      (mapPoint.x - viewport.center.x) * viewport.zoom,
    y:
      viewport.viewSize.height / 2 +
      (mapPoint.y - viewport.center.y) * viewport.zoom,
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

function createPreviewFeedbackPlan(model, event, index) {
  if (event.type === "correctHit") {
    return [
      createPresetPlan({
        planId: createPlanId(index, event.type),
        sourceEventType: event.type,
        preset: getFeedbackPreset(
          model,
          getEffectiveTargetFeedbackPresetId(model, event.target),
        ),
        targetId: event.target.targetId,
        scoreAdded: event.scoreAdded,
      }),
    ];
  }

  if (event.type === "wrongTap") {
    return [
      createPresetPlan({
        planId: createPlanId(index, event.type),
        sourceEventType: event.type,
        preset: getFeedbackPreset(model, "wrong_tap"),
      }),
    ];
  }

  if (event.type === "roundCompleted") {
    return [
      {
        planId: createPlanId(index, event.type),
        kind: "settlement",
        sourceEventType: event.type,
        visuals: [],
        durationMs: 0,
        finalScore: event.finalScore,
      },
    ];
  }

  return [];
}

function createPresetPlan(input) {
  return {
    planId: input.planId,
    kind: "preset",
    sourceEventType: input.sourceEventType,
    feedbackPresetId: input.preset.feedbackPresetId,
    visuals: input.preset.visuals,
    soundAsset: input.preset.soundAsset,
    durationMs: input.preset.durationMs,
    targetId: input.targetId,
    scoreAdded: input.scoreAdded,
  };
}

function getEffectiveTargetFeedbackPresetId(model, target) {
  return (
    model.mode.feedbackOverrides[target.typeId]?.feedbackPresetId ??
    target.feedbackPresetId
  );
}

function getFeedbackPreset(model, presetId) {
  return findRequired(model.config.feedbackPresets, "feedbackPresetId", presetId);
}

function createPlanId(index, eventType) {
  return `preview_feedback_${String(index + 1).padStart(2, "0")}_${eventType}`;
}

function createPreviewViewport(mapConfig, viewSize) {
  const fitZoom = Math.min(
    viewSize.width / mapConfig.worldSize.width,
    viewSize.height / mapConfig.worldSize.height,
  );
  const zoom = fitZoom || mapConfig.defaultCamera.zoom;
  const viewport = {
    viewSize,
    mapSize: mapConfig.worldSize,
    center: mapConfig.defaultCamera.center,
    zoom,
    minZoom: zoom,
    maxZoom: mapConfig.maxZoom,
  };

  return {
    ...viewport,
    center: clampViewportCenter(viewport, viewport.center),
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

function findRequired(items, fieldName, value) {
  const item = items.find((candidate) => candidate[fieldName] === value);
  if (!item) {
    throw new Error(`Missing ${fieldName}: ${value}`);
  }
  return item;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
