import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const configPath = path.join(
  repoRoot,
  "cocos/assets/resources/config/demo-gameplay.json",
);
const fixturePath = path.join(scriptDir, "fixtures/feedback-runtime-cases.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const fixtures = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const failures = [];

for (const fixture of fixtures) {
  const runtimeConfig = createModeRuntimeConfig(config, fixture.modeId);
  const roundEvents = (fixture.roundEvents ?? []).map((event) =>
    hydrateRoundEvent(runtimeConfig, event),
  );
  const toolEvents = (fixture.toolEvents ?? []).map((event) =>
    hydrateToolEvent(runtimeConfig, event),
  );
  const actualPlans = createFeedbackPlans({
    gameplayConfig: config,
    modeRuntimeConfig: runtimeConfig,
    roundEvents,
    toolEvents,
  });

  assertArrayLength(
    fixture.name,
    actualPlans,
    fixture.expectedPlans.length,
  );

  for (const [index, expectedPlan] of fixture.expectedPlans.entries()) {
    assertPartialObject(
      fixture.name,
      `plan ${index}`,
      actualPlans[index],
      expectedPlan,
    );
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Validated ${fixtures.length} feedback runtime fixture groups`);

function createFeedbackPlans(input) {
  const presetsById = new Map(
    input.gameplayConfig.feedbackPresets.map((preset) => [
      preset.feedbackPresetId,
      preset,
    ]),
  );
  const plans = [];

  for (const event of input.roundEvents) {
    plans.push(
      ...createRoundFeedbackPlans(
        input.modeRuntimeConfig,
        presetsById,
        event,
        plans.length,
      ),
    );
  }

  for (const event of input.toolEvents) {
    plans.push(...createToolFeedbackPlans(presetsById, event, plans.length));
  }

  return plans;
}

function createRoundFeedbackPlans(runtimeConfig, presetsById, event, offset) {
  if (event.type === "correctHit") {
    return [
      createPresetPlan({
        planId: createPlanId(offset, event.type),
        sourceEventType: event.type,
        preset: requirePreset(
          presetsById,
          getEffectiveTargetFeedbackPresetId(runtimeConfig, event.target),
        ),
        targetId: event.target.targetId,
        scoreAdded: event.scoreAdded,
      }),
    ];
  }

  if (event.type === "wrongTap" || event.type === "duplicateHit") {
    return [
      createPresetPlan({
        planId: createPlanId(offset, event.type),
        sourceEventType: event.type,
        preset: requirePreset(presetsById, "wrong_tap"),
        targetId: event.type === "duplicateHit" ? event.target.targetId : undefined,
      }),
    ];
  }

  if (event.type === "roundCompleted" || event.type === "roundExpired") {
    return [
      {
        planId: createPlanId(offset, event.type),
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

function createToolFeedbackPlans(presetsById, event, offset) {
  if (event.type === "hintReveal") {
    return [
      createPresetPlan({
        planId: createPlanId(offset, event.type),
        sourceEventType: event.type,
        preset: requirePreset(presetsById, "hint_reveal"),
        targetId: event.target.targetId,
        toolId: event.toolId,
        durationMs: event.durationSeconds * 1000,
      }),
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
    durationMs: input.durationMs ?? input.preset.durationMs,
    targetId: input.targetId,
    toolId: input.toolId,
    scoreAdded: input.scoreAdded,
  };
}

function hydrateRoundEvent(runtimeConfig, event) {
  if (event.type === "correctHit") {
    return {
      type: event.type,
      target: findTarget(runtimeConfig, event.targetId),
      scoreAdded: event.scoreAdded,
      isRoundComplete: event.isRoundComplete,
    };
  }

  if (event.type === "duplicateHit") {
    return {
      type: event.type,
      target: findTarget(runtimeConfig, event.targetId),
    };
  }

  return event;
}

function hydrateToolEvent(runtimeConfig, event) {
  if (event.type === "hintReveal") {
    return {
      type: event.type,
      toolId: event.toolId,
      target: findTarget(runtimeConfig, event.targetId),
      durationSeconds: event.durationSeconds,
    };
  }

  return event;
}

function getEffectiveTargetFeedbackPresetId(runtimeConfig, target) {
  return (
    runtimeConfig.mode.feedbackOverrides[target.typeId]?.feedbackPresetId ??
    target.feedbackPresetId
  );
}

function createModeRuntimeConfig(gameplayConfig, modeId) {
  const mode = findRequired(gameplayConfig.gameModes, "modeId", modeId);
  const mapConfig = findRequired(gameplayConfig.maps, "mapId", mode.mapId);
  const targetPointSet = findRequired(
    gameplayConfig.targetPointSets,
    "targetPointSetId",
    mapConfig.targetPointSetId,
  );
  return {
    mode,
    map: mapConfig,
    targetPointSet,
    selectedTargets: selectTargetsForMode(mode, targetPointSet.targetPoints),
  };
}

function selectTargetsForMode(mode, targetPoints) {
  const rule = mode.targetSelectionRule;

  if (rule.type === "byCategoryCounts") {
    return Object.entries(rule.countsByType ?? {}).flatMap(([typeId, count]) =>
      targetPoints
        .filter((targetPoint) => targetPoint.typeId === typeId)
        .slice(0, count),
    );
  }

  if (rule.type === "byTag") {
    return targetPoints
      .filter((targetPoint) => targetPoint.tags?.includes(rule.tag))
      .slice(0, rule.count);
  }

  if (rule.type === "allOfType") {
    return targetPoints.filter(
      (targetPoint) => targetPoint.typeId === rule.typeId,
    );
  }

  return [];
}

function findTarget(runtimeConfig, targetId) {
  return findRequired(
    runtimeConfig.targetPointSet.targetPoints,
    "targetId",
    targetId,
  );
}

function requirePreset(presetsById, presetId) {
  const preset = presetsById.get(presetId);
  if (!preset) {
    throw new Error(`Unknown feedback preset: ${presetId}`);
  }
  return preset;
}

function createPlanId(offset, eventType) {
  return `feedback_${String(offset + 1).padStart(2, "0")}_${eventType}`;
}

function findRequired(items, idField, id) {
  const item = items.find((candidate) => candidate[idField] === id);
  if (!item) {
    throw new Error(`Missing ${idField}: ${id}`);
  }
  return item;
}

function assertArrayLength(label, actual, expectedLength) {
  if (actual.length !== expectedLength) {
    failures.push(
      `${label} expected ${expectedLength} plans, got ${actual.length}`,
    );
  }
}

function assertPartialObject(label, pathLabel, actual, expected) {
  if (!actual) {
    failures.push(`${label} missing ${pathLabel}`);
    return;
  }

  for (const [key, expectedValue] of Object.entries(expected)) {
    const actualValue = actual[key];
    if (JSON.stringify(actualValue) !== JSON.stringify(expectedValue)) {
      failures.push(
        `${label} ${pathLabel}.${key} expected ${JSON.stringify(expectedValue)}, got ${JSON.stringify(actualValue)}`,
      );
    }
  }
}
