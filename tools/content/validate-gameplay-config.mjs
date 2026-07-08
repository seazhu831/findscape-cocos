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
uniqueIds(gameModes, "modeId", "gameModes");

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

function requirePosition(position, label) {
  if (
    !position ||
    typeof position.x !== "number" ||
    typeof position.y !== "number"
  ) {
    errors.push(`${label} must include numeric x and y`);
  }
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
    return;
  }

  errors.push(`${label}.targetSelectionRule.type is unsupported: ${rule.type}`);
}
