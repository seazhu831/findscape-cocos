import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const configPath = path.join(
  repoRoot,
  "cocos/assets/resources/config/demo-gameplay.json",
);
const fixturePath = path.join(scriptDir, "fixtures/mode-capabilities-cases.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const fixtures = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const failures = [];

for (const fixture of fixtures) {
  const runtimeConfig = createModeRuntimeConfig(config, fixture.modeId);
  const summary = createModeVariantSummary(runtimeConfig);
  assertPartialObject(
    fixture.modeId,
    "summary",
    summary,
    fixture.expectedSummary,
  );
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Validated ${fixtures.length} mode capability fixture groups`);

function createModeRuntimeConfig(gameplayConfig, modeId) {
  const mode = findRequired(gameplayConfig.gameModes, "modeId", modeId);
  const mapConfig = findRequired(gameplayConfig.maps, "mapId", mode.mapId);
  const targetPointSet = findRequired(
    gameplayConfig.targetPointSets,
    "targetPointSetId",
    mapConfig.targetPointSetId,
  );
  const scoringRule = findRequired(
    gameplayConfig.scoringRules,
    "scoringRuleId",
    mode.scoringRuleId,
  );
  const toolsById = mapById(gameplayConfig.tools, "toolId");

  return {
    mode,
    map: mapConfig,
    targetPointSet,
    scoringRule,
    tools: mode.toolIds.map((toolId) => toolsById.get(toolId)).filter(Boolean),
    selectedTargets: selectTargetsForMode(mode, targetPointSet.targetPoints),
  };
}

function createModeVariantSummary(runtimeConfig) {
  const triggerBehaviors = uniqueSortedByFirstSeen(
    runtimeConfig.selectedTargets.map((target) =>
      resolveTriggerBehavior(runtimeConfig.mode, target),
    ),
  );
  const feedbackPresetIds = uniqueSortedByFirstSeen(
    runtimeConfig.selectedTargets.map((target) =>
      resolveFeedbackPresetId(runtimeConfig.mode, target),
    ),
  );

  return {
    modeId: runtimeConfig.mode.modeId,
    name: runtimeConfig.mode.name,
    targetSelectionLabel: createTargetSelectionLabel(
      runtimeConfig.mode.targetSelectionRule,
    ),
    selectedTargetCount: runtimeConfig.selectedTargets.length,
    targetTypeIds: uniqueSortedByFirstSeen(
      runtimeConfig.selectedTargets.map((target) => target.typeId),
    ),
    triggerBehaviors,
    feedbackPresetIds,
    toolIds: runtimeConfig.tools.map((tool) => tool.toolId),
    capabilities: createCapabilityList(
      runtimeConfig.mode,
      runtimeConfig.tools.map((tool) => tool.toolId),
      triggerBehaviors,
    ),
    sharedRuntime: [
      "targetSelection",
      "hitTest",
      "roundState",
      "scoring",
      "timer",
      "tools",
      "viewModel",
      "storage",
    ],
  };
}

function resolveTriggerBehavior(mode, target) {
  return mode.feedbackOverrides[target.typeId]?.triggerBehavior
    ?? target.triggerBehavior;
}

function resolveFeedbackPresetId(mode, target) {
  return mode.feedbackOverrides[target.typeId]?.feedbackPresetId
    ?? target.feedbackPresetId;
}

function createCapabilityList(mode, toolIds, triggerBehaviors) {
  const capabilityOrder = [
    "targetList",
    "timer",
    "score",
    "settlement",
    "hint",
    "magnifier",
    "tapFind",
    "tapPop",
    "tapCatch",
    "dragCatch",
    "feedbackOverrides",
  ];
  const capabilities = new Set(["targetList", "timer", "score", "settlement"]);

  for (const toolId of toolIds) {
    if (toolId === "hint" || toolId === "magnifier") {
      capabilities.add(toolId);
    }
  }

  for (const triggerBehavior of triggerBehaviors) {
    capabilities.add(toTriggerCapability(triggerBehavior));
  }

  if (Object.keys(mode.feedbackOverrides).length > 0) {
    capabilities.add("feedbackOverrides");
  }

  return capabilityOrder.filter((capability) => capabilities.has(capability));
}

function toTriggerCapability(triggerBehavior) {
  if (triggerBehavior === "tapToPop") {
    return "tapPop";
  }
  if (triggerBehavior === "tapToCatch") {
    return "tapCatch";
  }
  if (triggerBehavior === "dragToCatch") {
    return "dragCatch";
  }
  return "tapFind";
}

function createTargetSelectionLabel(rule) {
  if (rule.type === "byCategoryCounts") {
    return Object.entries(rule.countsByType)
      .map(([typeId, count]) => `${count} ${typeId}`)
      .join(", ");
  }

  if (rule.type === "byTag") {
    return `${rule.count} targets tagged ${rule.tag}`;
  }

  return `all ${rule.typeId}`;
}

function selectTargetsForMode(mode, targetPoints) {
  const rule = mode.targetSelectionRule;

  if (rule.type === "byCategoryCounts") {
    const selected = [];
    for (const [typeId, count] of Object.entries(rule.countsByType)) {
      selected.push(
        ...targetPoints
          .filter((targetPoint) => targetPoint.typeId === typeId)
          .slice(0, count),
      );
    }
    return selected;
  }

  if (rule.type === "byTag") {
    return targetPoints
      .filter((targetPoint) => targetPoint.tags.includes(rule.tag))
      .slice(0, rule.count);
  }

  if (rule.type === "allOfType") {
    return targetPoints.filter(
      (targetPoint) => targetPoint.typeId === rule.typeId,
    );
  }

  return [];
}

function findRequired(items, fieldName, value) {
  const item = items.find((candidate) => candidate[fieldName] === value);
  if (!item) {
    throw new Error(`Missing ${fieldName}: ${value}`);
  }
  return item;
}

function mapById(items, fieldName) {
  return new Map(items.map((item) => [item[fieldName], item]));
}

function uniqueSortedByFirstSeen(items) {
  return Array.from(new Set(items));
}

function assertPartialObject(name, label, actual, expected) {
  for (const [key, expectedValue] of Object.entries(expected)) {
    const actualValue = actual[key];
    if (JSON.stringify(actualValue) !== JSON.stringify(expectedValue)) {
      failures.push(
        `${name} ${label}.${key}: expected ${JSON.stringify(
          expectedValue,
        )}, got ${JSON.stringify(actualValue)}`,
      );
    }
  }
}
