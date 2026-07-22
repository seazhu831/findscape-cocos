import fs from "node:fs";
import path from "node:path";

const [, , configPathArg] = process.argv;

if (!configPathArg) {
  fail("Usage: node tools/content/validate-gameplay-config.mjs <config-file>");
}

const configPath = path.resolve(process.cwd(), configPathArg);
const config = readJson(configPath);
const errors = [];

requireVersion(config.version, 1, "version");

const maps = requireArray(config, "maps");
const targetTypes = requireArray(config, "targetTypes");
const targetPointSets = requireArray(config, "targetPointSets");
const feedbackPresets = requireArray(config, "feedbackPresets");
const scoringRules = requireArray(config, "scoringRules");
const tools = requireArray(config, "tools");
const gameModes = requireArray(config, "gameModes");
const sceneEntitySets = optionalArray(config, "sceneEntitySets");
const motionProfiles = optionalArray(config, "motionProfiles");

const mapIds = uniqueIds(maps, "mapId", "maps");
const targetTypeIds = uniqueIds(targetTypes, "typeId", "targetTypes");
const feedbackPresetIds = uniqueIds(
  feedbackPresets,
  "feedbackPresetId",
  "feedbackPresets",
);
const scoringRuleIds = uniqueIds(scoringRules, "scoringRuleId", "scoringRules");
const toolIds = uniqueIds(tools, "toolId", "tools");
const targetPointSetIds = uniqueIds(
  targetPointSets,
  "targetPointSetId",
  "targetPointSets",
);
const sceneEntitySetIds = uniqueIds(
  sceneEntitySets,
  "sceneEntitySetId",
  "sceneEntitySets",
);
const motionProfileIds = uniqueIds(
  motionProfiles,
  "motionProfileId",
  "motionProfiles",
);
uniqueIds(gameModes, "modeId", "gameModes");

const mapsById = new Map(maps.map((mapConfig) => [mapConfig.mapId, mapConfig]));
const sceneEntitySetsById = new Map(
  sceneEntitySets.map((entitySet) => [entitySet.sceneEntitySetId, entitySet]),
);
const entitiesById = new Map();
const entitySetIdsByEntityId = new Map();

for (const entitySet of sceneEntitySets) {
  for (const entity of requireArray(entitySet, "entities")) {
    if (typeof entity?.entityId !== "string" || entity.entityId.length === 0) {
      errors.push(`sceneEntitySet ${entitySet.sceneEntitySetId} entity is missing entityId`);
      continue;
    }
    if (entitiesById.has(entity.entityId)) {
      errors.push(`Duplicate entityId in sceneEntitySets: ${entity.entityId}`);
      continue;
    }
    entitiesById.set(entity.entityId, entity);
    entitySetIdsByEntityId.set(entity.entityId, entitySet.sceneEntitySetId);
  }
}

for (const mapConfig of maps) {
  requirePositiveNumber(mapConfig.worldSize?.width, `map ${mapConfig.mapId}.worldSize.width`);
  requirePositiveNumber(mapConfig.worldSize?.height, `map ${mapConfig.mapId}.worldSize.height`);
  requirePositiveNumber(mapConfig.minZoom, `map ${mapConfig.mapId}.minZoom`);
  requirePositiveNumber(mapConfig.maxZoom, `map ${mapConfig.mapId}.maxZoom`);
  requireRef(
    targetPointSetIds,
    mapConfig.targetPointSetId,
    `map ${mapConfig.mapId}.targetPointSetId`,
  );
  if (mapConfig.sceneEntitySetId !== undefined) {
    requireRef(
      sceneEntitySetIds,
      mapConfig.sceneEntitySetId,
      `map ${mapConfig.mapId}.sceneEntitySetId`,
    );
    const entitySet = sceneEntitySetsById.get(mapConfig.sceneEntitySetId);
    if (entitySet && entitySet.mapId !== mapConfig.mapId) {
      errors.push(
        `map ${mapConfig.mapId}.sceneEntitySetId must reference an entity set for the same map`,
      );
    }
  }
}

for (const motionProfile of motionProfiles) {
  validateMotionProfile(motionProfile);
}

for (const entitySet of sceneEntitySets) {
  requireRef(mapIds, entitySet.mapId, `sceneEntitySet ${entitySet.sceneEntitySetId}.mapId`);
  for (const entity of requireArray(entitySet, "entities")) {
    validateSceneEntity(entitySet, entity);
  }
}

for (const targetType of targetTypes) {
  requireRef(
    feedbackPresetIds,
    targetType.defaultFeedbackPresetId,
    `targetType ${targetType.typeId}.defaultFeedbackPresetId`,
  );
  requirePositiveNumber(targetType.defaultScore, `targetType ${targetType.typeId}.defaultScore`);
}

for (const targetPointSet of targetPointSets) {
  requireRef(mapIds, targetPointSet.mapId, `targetPointSet ${targetPointSet.targetPointSetId}.mapId`);
  const targetIds = new Set();
  for (const targetPoint of requireArray(targetPointSet, "targetPoints")) {
    if (targetIds.has(targetPoint.targetId)) {
      errors.push(`Duplicate targetId in ${targetPointSet.targetPointSetId}: ${targetPoint.targetId}`);
    }
    targetIds.add(targetPoint.targetId);
    requireRef(mapIds, targetPoint.mapId, `targetPoint ${targetPoint.targetId}.mapId`);
    requireRef(targetTypeIds, targetPoint.typeId, `targetPoint ${targetPoint.targetId}.typeId`);
    requireRef(
      feedbackPresetIds,
      targetPoint.feedbackPresetId,
      `targetPoint ${targetPoint.targetId}.feedbackPresetId`,
    );
    requirePosition(targetPoint.position, `targetPoint ${targetPoint.targetId}.position`);
    validateTargetEntity(targetPointSet, targetPoint);
    validateConcealment(targetPoint);
    validateHitShape(targetPoint.hitShape, `targetPoint ${targetPoint.targetId}.hitShape`);
    requirePositiveNumber(targetPoint.reward?.score, `targetPoint ${targetPoint.targetId}.reward.score`);
  }
}

for (const gameMode of gameModes) {
  requireRef(mapIds, gameMode.mapId, `gameMode ${gameMode.modeId}.mapId`);
  requireRef(
    scoringRuleIds,
    gameMode.scoringRuleId,
    `gameMode ${gameMode.modeId}.scoringRuleId`,
  );
  for (const toolId of gameMode.toolIds ?? []) {
    requireRef(toolIds, toolId, `gameMode ${gameMode.modeId}.toolIds`);
  }
  validateTargetSelectionRule(gameMode.targetSelectionRule, `gameMode ${gameMode.modeId}`);
  for (const [typeId, override] of Object.entries(gameMode.feedbackOverrides ?? {})) {
    requireRef(targetTypeIds, typeId, `gameMode ${gameMode.modeId}.feedbackOverrides`);
    if (override.feedbackPresetId) {
      requireRef(
        feedbackPresetIds,
        override.feedbackPresetId,
        `gameMode ${gameMode.modeId}.feedbackOverrides.${typeId}`,
      );
    }
  }
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Validated gameplay config: ${path.relative(process.cwd(), configPath)}`);

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`Failed to read JSON from ${filePath}: ${error.message}`);
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function requireVersion(value, expected, field) {
  if (value !== expected) {
    errors.push(`${field} must be ${expected}`);
  }
}

function requireArray(parent, field) {
  if (!Array.isArray(parent?.[field])) {
    errors.push(`${field} must be an array`);
    return [];
  }
  return parent[field];
}

function optionalArray(parent, field) {
  if (parent?.[field] === undefined) {
    return [];
  }
  return requireArray(parent, field);
}

function uniqueIds(items, field, label) {
  const ids = new Set();
  for (const item of items) {
    const id = item?.[field];
    if (typeof id !== "string" || id.length === 0) {
      errors.push(`${label} item is missing ${field}`);
      continue;
    }
    if (ids.has(id)) {
      errors.push(`Duplicate ${field} in ${label}: ${id}`);
    }
    ids.add(id);
  }
  return ids;
}

function requireRef(knownIds, id, label) {
  if (typeof id !== "string" || !knownIds.has(id)) {
    errors.push(`${label} references unknown id: ${id}`);
  }
}

function requirePositiveNumber(value, label) {
  if (typeof value !== "number" || value <= 0) {
    errors.push(`${label} must be a positive number`);
  }
}

function requireNonNegativeNumber(value, label) {
  if (typeof value !== "number" || value < 0) {
    errors.push(`${label} must be zero or greater`);
  }
}

function requireString(value, label) {
  if (typeof value !== "string" || value.length === 0) {
    errors.push(`${label} must be a non-empty string`);
  }
}

function requireBoolean(value, label) {
  if (typeof value !== "boolean") {
    errors.push(`${label} must be a boolean`);
  }
}

function requirePosition(position, label) {
  if (
    !position ||
    typeof position.x !== "number" ||
    typeof position.y !== "number"
  ) {
    errors.push(`${label} must include numeric x and y`);
  }
}

function validateMotionProfile(profile) {
  const label = `motionProfile ${profile.motionProfileId}`;
  const offscreenPolicies = new Set(["pause", "reducedRate", "continue"]);
  if (!offscreenPolicies.has(profile.offscreenPolicy)) {
    errors.push(`${label}.offscreenPolicy is unsupported: ${profile.offscreenPolicy}`);
  }
  if (profile.startDelayMinMs !== undefined) {
    requireNonNegativeNumber(profile.startDelayMinMs, `${label}.startDelayMinMs`);
  }
  if (profile.startDelayMaxMs !== undefined) {
    requireNonNegativeNumber(profile.startDelayMaxMs, `${label}.startDelayMaxMs`);
  }
  if (
    typeof profile.startDelayMinMs === "number" &&
    typeof profile.startDelayMaxMs === "number" &&
    profile.startDelayMaxMs < profile.startDelayMinMs
  ) {
    errors.push(`${label}.startDelayMaxMs must be greater than or equal to startDelayMinMs`);
  }

  const variants = requireArray(profile, "idleVariants");
  const variantIds = new Set();
  if (variants.length === 0) {
    errors.push(`${label}.idleVariants must not be empty`);
  }
  for (const variant of variants) {
    const variantLabel = `${label}.idleVariants ${variant?.variantId}`;
    requireString(variant?.variantId, `${variantLabel}.variantId`);
    if (variantIds.has(variant?.variantId)) {
      errors.push(`${label} has duplicate variantId: ${variant?.variantId}`);
    }
    variantIds.add(variant?.variantId);
    validateMotionVariant(variant, variantLabel);
  }
}

function validateMotionVariant(variant, label) {
  if (variant?.driver === "tween") {
    requirePositiveNumber(variant.durationMs, `${label}.durationMs`);
    requireBoolean(variant.yoyo, `${label}.yoyo`);
    requireBoolean(variant.loop, `${label}.loop`);
    const hasMotion =
      variant.offset !== undefined ||
      variant.rotationDegrees !== undefined ||
      variant.scaleMultiplier !== undefined;
    if (!hasMotion) {
      errors.push(`${label} must define offset, rotationDegrees, or scaleMultiplier`);
    }
    if (variant.offset !== undefined) {
      requirePosition(variant.offset, `${label}.offset`);
    }
    if (variant.rotationDegrees !== undefined && typeof variant.rotationDegrees !== "number") {
      errors.push(`${label}.rotationDegrees must be a number`);
    }
    if (variant.scaleMultiplier !== undefined) {
      requirePositiveVector(variant.scaleMultiplier, `${label}.scaleMultiplier`);
    }
    const easings = new Set(["linear", "sineInOut", "quadInOut", "backInOut"]);
    if (variant.easing !== undefined && !easings.has(variant.easing)) {
      errors.push(`${label}.easing is unsupported: ${variant.easing}`);
    }
    return;
  }

  if (variant?.driver === "spriteFrames") {
    const frameAssets = requireArray(variant, "frameAssets");
    if (frameAssets.length === 0) {
      errors.push(`${label}.frameAssets must not be empty`);
    }
    frameAssets.forEach((asset, index) =>
      requireString(asset, `${label}.frameAssets[${index}]`),
    );
    requirePositiveNumber(variant.framesPerSecond, `${label}.framesPerSecond`);
    requireBoolean(variant.loop, `${label}.loop`);
    return;
  }

  if (variant?.driver === "animationClip") {
    const hasClipAsset = variant.clipAsset !== undefined;
    const hasFrameAssets = variant.frameAssets !== undefined;
    if (hasClipAsset === hasFrameAssets) {
      errors.push(`${label} must define exactly one of clipAsset or frameAssets`);
    }
    if (hasClipAsset) {
      requireString(variant.clipAsset, `${label}.clipAsset`);
    }
    if (hasFrameAssets) {
      const frameAssets = requireArray(variant, "frameAssets");
      if (frameAssets.length === 0) {
        errors.push(`${label}.frameAssets must not be empty`);
      }
      frameAssets.forEach((asset, index) =>
        requireString(asset, `${label}.frameAssets[${index}]`),
      );
      requirePositiveNumber(variant.framesPerSecond, `${label}.framesPerSecond`);
    }
    requirePositiveNumber(variant.speed, `${label}.speed`);
    requireBoolean(variant.loop, `${label}.loop`);
    return;
  }

  errors.push(`${label}.driver is unsupported: ${variant?.driver}`);
}

function validateSceneEntity(entitySet, entity) {
  const label = `sceneEntity ${entity?.entityId}`;
  const kinds = new Set(["decoration", "actor", "interactive", "occluder"]);
  const layers = new Set([
    "background",
    "staticDecoration",
    "ambientActor",
    "interactive",
    "foregroundOccluder",
  ]);
  const activationPolicies = new Set(["always", "nearViewport", "modeSelected"]);

  requireRef(mapIds, entity?.mapId, `${label}.mapId`);
  if (entity?.mapId !== entitySet.mapId) {
    errors.push(`${label}.mapId must match sceneEntitySet ${entitySet.sceneEntitySetId}.mapId`);
  }
  if (!kinds.has(entity?.kind)) {
    errors.push(`${label}.kind is unsupported: ${entity?.kind}`);
  }
  requireString(entity?.asset, `${label}.asset`);
  requirePosition(entity?.transform?.position, `${label}.transform.position`);
  validateEntityBounds(entity);
  if (entity?.transform?.scale !== undefined) {
    requirePositiveVector(entity.transform.scale, `${label}.transform.scale`);
  }
  if (
    entity?.transform?.rotationDegrees !== undefined &&
    typeof entity.transform.rotationDegrees !== "number"
  ) {
    errors.push(`${label}.transform.rotationDegrees must be a number`);
  }
  if (entity?.transform?.anchor !== undefined) {
    validateAnchor(entity.transform.anchor, `${label}.transform.anchor`);
  }
  if (!layers.has(entity?.render?.layer)) {
    errors.push(`${label}.render.layer is unsupported: ${entity?.render?.layer}`);
  }
  if (!Number.isInteger(entity?.render?.order)) {
    errors.push(`${label}.render.order must be an integer`);
  }
  requireBoolean(entity?.render?.visibleByDefault, `${label}.render.visibleByDefault`);
  if (
    entity?.activationPolicy !== undefined &&
    !activationPolicies.has(entity.activationPolicy)
  ) {
    errors.push(`${label}.activationPolicy is unsupported: ${entity.activationPolicy}`);
  }
  if (entity?.activationTargetEntityIds !== undefined) {
    validateStringArray(
      entity.activationTargetEntityIds,
      `${label}.activationTargetEntityIds`,
    );
    if (entity.activationPolicy !== "modeSelected") {
      errors.push(
        `${label}.activationTargetEntityIds requires activationPolicy modeSelected`,
      );
    }
    for (const targetEntityId of entity.activationTargetEntityIds) {
      requireRef(
        new Set(entitiesById.keys()),
        targetEntityId,
        `${label}.activationTargetEntityIds`,
      );
    }
  }
  if (entity?.motionProfileId !== undefined) {
    requireRef(motionProfileIds, entity.motionProfileId, `${label}.motionProfileId`);
  }
  validateStringArray(entity?.tags, `${label}.tags`);
}

function validateEntityBounds(entity) {
  const position = entity?.transform?.position;
  const mapConfig = mapsById.get(entity?.mapId);
  if (!mapConfig || typeof position?.x !== "number" || typeof position?.y !== "number") {
    return;
  }
  if (
    position.x < 0 ||
    position.y < 0 ||
    position.x > mapConfig.worldSize.width ||
    position.y > mapConfig.worldSize.height
  ) {
    errors.push(`sceneEntity ${entity.entityId}.transform.position must be inside map bounds`);
  }
}

function validateTargetEntity(targetPointSet, targetPoint) {
  if (targetPoint.entityId === undefined) {
    return;
  }
  const label = `targetPoint ${targetPoint.targetId}.entityId`;
  const entity = entitiesById.get(targetPoint.entityId);
  requireRef(new Set(entitiesById.keys()), targetPoint.entityId, label);
  if (!entity) {
    return;
  }
  if (entity.mapId !== targetPoint.mapId || targetPointSet.mapId !== targetPoint.mapId) {
    errors.push(`${label} must reference an entity on the same map`);
  }
  const expectedSetId = mapsById.get(targetPoint.mapId)?.sceneEntitySetId;
  if (
    expectedSetId !== undefined &&
    entitySetIdsByEntityId.get(targetPoint.entityId) !== expectedSetId
  ) {
    errors.push(`${label} must reference the entity set selected by the map`);
  }
  if (entity.kind !== "interactive" && entity.kind !== "actor") {
    errors.push(`${label} must reference an interactive or actor entity`);
  }
  if (
    targetPoint.position?.x !== entity.transform?.position?.x ||
    targetPoint.position?.y !== entity.transform?.position?.y
  ) {
    errors.push(`${label} position must match the linked entity position during v1 migration`);
  }
}

function validateConcealment(targetPoint) {
  const concealment = targetPoint.concealment;
  if (concealment === undefined) {
    return;
  }
  const label = `targetPoint ${targetPoint.targetId}.concealment`;
  const occluderIds = requireArray(concealment, "occluderEntityIds");
  for (const occluderId of occluderIds) {
    const occluder = entitiesById.get(occluderId);
    requireRef(new Set(entitiesById.keys()), occluderId, `${label}.occluderEntityIds`);
    if (!occluder) {
      continue;
    }
    if (occluder.kind !== "occluder") {
      errors.push(`${label} must reference entities with kind occluder: ${occluderId}`);
    }
    if (occluder.mapId !== targetPoint.mapId) {
      errors.push(`${label} must reference occluders on the same map: ${occluderId}`);
    }
  }
  if (
    concealment.intendedVisibleRatio !== undefined &&
    (typeof concealment.intendedVisibleRatio !== "number" ||
      concealment.intendedVisibleRatio < 0 ||
      concealment.intendedVisibleRatio > 1)
  ) {
    errors.push(`${label}.intendedVisibleRatio must be between 0 and 1`);
  }
  if (concealment.visualSimilarityTags !== undefined) {
    validateStringArray(concealment.visualSimilarityTags, `${label}.visualSimilarityTags`);
  }
  const edgePlacements = new Set(["none", "soft", "strong"]);
  if (
    concealment.edgePlacement !== undefined &&
    !edgePlacements.has(concealment.edgePlacement)
  ) {
    errors.push(`${label}.edgePlacement is unsupported: ${concealment.edgePlacement}`);
  }
  const scaleClasses = new Set(["small", "medium", "large"]);
  if (concealment.scaleClass !== undefined && !scaleClasses.has(concealment.scaleClass)) {
    errors.push(`${label}.scaleClass is unsupported: ${concealment.scaleClass}`);
  }
}

function requirePositiveVector(value, label) {
  if (
    !value ||
    typeof value.x !== "number" ||
    value.x <= 0 ||
    typeof value.y !== "number" ||
    value.y <= 0
  ) {
    errors.push(`${label} must include positive numeric x and y`);
  }
}

function validateAnchor(anchor, label) {
  if (
    !anchor ||
    typeof anchor.x !== "number" ||
    typeof anchor.y !== "number" ||
    anchor.x < 0 ||
    anchor.x > 1 ||
    anchor.y < 0 ||
    anchor.y > 1
  ) {
    errors.push(`${label} must include x and y between 0 and 1`);
  }
}

function validateStringArray(value, label) {
  if (!Array.isArray(value)) {
    errors.push(`${label} must be an array`);
    return;
  }
  value.forEach((item, index) => requireString(item, `${label}[${index}]`));
}

function validateHitShape(hitShape, label) {
  if (!hitShape || typeof hitShape.type !== "string") {
    errors.push(`${label} must include a type`);
    return;
  }

  if (hitShape.type === "circle") {
    requirePositiveNumber(hitShape.radius, `${label}.radius`);
    return;
  }

  if (hitShape.type === "rectangle") {
    requirePositiveNumber(hitShape.width, `${label}.width`);
    requirePositiveNumber(hitShape.height, `${label}.height`);
    return;
  }

  if (hitShape.type === "polygon") {
    if (!Array.isArray(hitShape.points) || hitShape.points.length < 3) {
      errors.push(`${label}.points must include at least 3 points`);
    }
    return;
  }

  if (hitShape.type === "spriteBounds") {
    if (typeof hitShape.padding !== "number" || hitShape.padding < 0) {
      errors.push(`${label}.padding must be zero or greater`);
    }
    return;
  }

  errors.push(`${label}.type is unsupported: ${hitShape.type}`);
}

function validateTargetSelectionRule(rule, label) {
  if (!rule || typeof rule.type !== "string") {
    errors.push(`${label}.targetSelectionRule must include a type`);
    return;
  }

  if (rule.type === "byCategoryCounts") {
    for (const [typeId, count] of Object.entries(rule.countsByType ?? {})) {
      requireRef(targetTypeIds, typeId, `${label}.targetSelectionRule.countsByType`);
      requirePositiveNumber(count, `${label}.targetSelectionRule.countsByType.${typeId}`);
      requireAvailableTargets(rule, typeId, count, label);
    }
    return;
  }

  if (rule.type === "byTag") {
    if (typeof rule.tag !== "string" || rule.tag.length === 0) {
      errors.push(`${label}.targetSelectionRule.tag is required`);
    }
    requirePositiveNumber(rule.count, `${label}.targetSelectionRule.count`);
    return;
  }

  if (rule.type === "allOfType") {
    requireRef(targetTypeIds, rule.typeId, `${label}.targetSelectionRule.typeId`);
    requireAvailableTargets(rule, rule.typeId, 1, label);
    return;
  }

  errors.push(`${label}.targetSelectionRule.type is unsupported: ${rule.type}`);
}

function requireAvailableTargets(rule, typeId, count, label) {
  const modeId = label.replace("gameMode ", "");
  const gameMode = gameModes.find((mode) => mode.modeId === modeId);
  const mapConfig = maps.find((map) => map.mapId === gameMode?.mapId);
  const targetPointSet = targetPointSets.find(
    (pointSet) => pointSet.targetPointSetId === mapConfig?.targetPointSetId,
  );
  const availableCount =
    targetPointSet?.targetPoints?.filter((targetPoint) => targetPoint.typeId === typeId)
      .length ?? 0;

  if (availableCount < count) {
    errors.push(
      `${label}.targetSelectionRule requests ${count} ${typeId} targets, but only ${availableCount} are available`,
    );
  }
}
