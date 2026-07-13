import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const configPath = path.join(
  repoRoot,
  "cocos/assets/resources/config/demo-gameplay.json",
);
const fixturePath = path.join(scriptDir, "fixtures/round-controller-cases.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const fixtures = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const failures = [];

for (const fixture of fixtures) {
  const context = createRoundControllerContext(config, fixture.modeId);
  let state = createRoundControllerState(context.modeRuntimeConfig);
  let viewModel = createRoundControllerViewModel(context, state);

  for (const step of fixture.steps) {
    let update;

    if (step.type === "tap") {
      update = applyControllerTap(context, state, step.point);
    } else if (step.type === "tick") {
      update = applyControllerTick(context, state, step.deltaSeconds);
    } else if (step.type === "hint") {
      update = applyControllerHint(context, state);
    } else if (step.type === "magnifier") {
      update = applyControllerMagnifier(context, state);
    } else {
      failures.push(`${fixture.name} has unsupported step type: ${step.type}`);
      continue;
    }

    state = update.state;
    viewModel = update.viewModel;

    if (step.expectedRoundEvents) {
      assertArray(
        fixture.name,
        `${step.type} roundEvents`,
        update.roundEvents.map((event) => event.type),
        step.expectedRoundEvents,
      );
    }

    if (step.expectedToolEvents) {
      assertArray(
        fixture.name,
        `${step.type} toolEvents`,
        update.toolEvents.map((event) => event.type),
        step.expectedToolEvents,
      );
    }

    if (step.expectedFeedbackPlans) {
      assertArrayLength(
        fixture.name,
        `${step.type} feedbackPlans`,
        update.feedbackPlans,
        step.expectedFeedbackPlans.length,
      );
      for (const [index, expectedPlan] of step.expectedFeedbackPlans.entries()) {
        assertPartialObject(
          fixture.name,
          `${step.type} feedbackPlans[${index}]`,
          update.feedbackPlans[index],
          expectedPlan,
        );
      }
    }

    if (step.expectedViewModel) {
      assertPartialObject(
        fixture.name,
        `${step.type} viewModel`,
        viewModel,
        step.expectedViewModel,
      );
    }

    if (step.expectedToolState) {
      assertPartialObject(
        fixture.name,
        `${step.type} toolState`,
        state.tools.toolsById,
        step.expectedToolState,
      );
    }
  }

  if (fixture.expectedViewModel) {
    assertPartialObject(
      fixture.name,
      "viewModel",
      viewModel,
      fixture.expectedViewModel,
    );
  }

  if (fixture.expectedToolState) {
    assertPartialObject(
      fixture.name,
      "toolState",
      state.tools.toolsById,
      fixture.expectedToolState,
    );
  }

  if (fixture.expectedResult) {
    const result = createControllerRoundResult(
      context,
      state,
      fixture.resultAtUnixMs,
    );
    assertPartialObject(fixture.name, "result", result, fixture.expectedResult);
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Validated ${fixtures.length} round controller fixture groups`);

function createRoundControllerContext(gameplayConfig, modeId) {
  return {
    gameplayConfig,
    modeRuntimeConfig: createModeRuntimeConfig(gameplayConfig, modeId),
    targetTypesById: mapById(gameplayConfig.targetTypes, "typeId"),
  };
}

function createRoundControllerState(runtimeConfig) {
  return {
    round: createRoundState(runtimeConfig),
    tools: createToolRuntimeState(runtimeConfig),
  };
}

function createRoundControllerViewModel(context, state) {
  return createRoundViewModel(context.modeRuntimeConfig, state.round, {
    targetTypesById: context.targetTypesById,
  });
}

function applyControllerTap(context, state, point) {
  const roundUpdate = applyRoundTap(context.modeRuntimeConfig, state.round, point);
  const nextState = {
    ...state,
    round: roundUpdate.state,
  };

  return createControllerUpdate(context, nextState, roundUpdate.events, []);
}

function applyControllerTick(context, state, deltaSeconds) {
  const roundUpdate = applyRoundTimeDelta(state.round, deltaSeconds);
  const nextState = {
    round: roundUpdate.state,
    tools: advanceToolCooldowns(state.tools, deltaSeconds),
  };

  return createControllerUpdate(context, nextState, roundUpdate.events, []);
}

function applyControllerHint(context, state) {
  const toolResult = useHintTool(
    context.modeRuntimeConfig,
    state.round,
    state.tools,
  );
  const nextState = {
    ...state,
    tools: toolResult.state,
  };

  return createControllerUpdate(context, nextState, [], toolResult.events);
}

function applyControllerMagnifier(context, state) {
  const toolResult = useMagnifierTool(context.modeRuntimeConfig, state.tools);
  const nextState = {
    ...state,
    tools: toolResult.state,
  };
  return createControllerUpdate(context, nextState, [], toolResult.events);
}

function createControllerRoundResult(context, state, completedAtUnixMs) {
  const viewModel = createRoundControllerViewModel(context, state);

  if (!viewModel.settlement) {
    return undefined;
  }

  return createRoundResultRecord(
    state.round.modeId,
    viewModel.settlement,
    completedAtUnixMs,
  );
}

function createControllerUpdate(context, state, roundEvents, toolEvents) {
  return {
    state,
    roundEvents,
    toolEvents,
    feedbackPlans: createFeedbackPlans({
      gameplayConfig: context.gameplayConfig,
      modeRuntimeConfig: context.modeRuntimeConfig,
      roundEvents,
      toolEvents,
    }),
    viewModel: createRoundControllerViewModel(context, state),
  };
}

function createFeedbackPlans(input) {
  const presetsById = mapById(input.gameplayConfig.feedbackPresets, "feedbackPresetId");
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

function getEffectiveTargetFeedbackPresetId(runtimeConfig, target) {
  return (
    runtimeConfig.mode.feedbackOverrides[target.typeId]?.feedbackPresetId ??
    target.feedbackPresetId
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

function createRoundState(runtimeConfig) {
  return {
    modeId: runtimeConfig.mode.modeId,
    status: "playing",
    selectedTargetIds: runtimeConfig.selectedTargets.map(
      (target) => target.targetId,
    ),
    foundTargetIds: [],
    score: 0,
    comboStreak: 0,
    correctHits: 0,
    wrongTaps: 0,
    elapsedSeconds: 0,
    remainingSeconds: runtimeConfig.mode.timeLimitSeconds,
  };
}

function applyRoundTap(runtimeConfig, state, point) {
  if (state.status !== "playing") {
    return { state, events: [] };
  }

  const target = runtimeConfig.selectedTargets.find((candidate) =>
    isPointInTargetHitArea(candidate, point),
  );

  if (!target) {
    return {
      state: {
        ...state,
        comboStreak: 0,
        wrongTaps: state.wrongTaps + 1,
      },
      events: [{ type: "wrongTap" }],
    };
  }

  if (state.foundTargetIds.includes(target.targetId)) {
    return {
      state,
      events: [{ type: "duplicateHit", target }],
    };
  }

  const foundTargetIds = [...state.foundTargetIds, target.targetId];
  const isRoundComplete = foundTargetIds.length >= state.selectedTargetIds.length;
  const comboStreak = state.comboStreak + 1;
  const scoreAdded = calculateCorrectHitScore({
    target,
    scoringRule: runtimeConfig.scoringRule,
    comboStreak,
    secondsRemaining: state.remainingSeconds,
    isRoundComplete,
  });
  const score = state.score + scoreAdded;
  const events = [
    {
      type: "correctHit",
      target,
      scoreAdded,
      isRoundComplete,
    },
  ];

  if (isRoundComplete) {
    events.push({ type: "roundCompleted", finalScore: score });
  }

  return {
    state: {
      ...state,
      status: isRoundComplete ? "completed" : "playing",
      foundTargetIds,
      score,
      comboStreak,
      correctHits: state.correctHits + 1,
    },
    events,
  };
}

function applyRoundTimeDelta(state, deltaSeconds) {
  if (state.status !== "playing") {
    return { state, events: [] };
  }

  const remainingSeconds = Math.max(0, state.remainingSeconds - deltaSeconds);
  const nextState = {
    ...state,
    elapsedSeconds: state.elapsedSeconds + Math.max(0, deltaSeconds),
    remainingSeconds,
    status: remainingSeconds <= 0 ? "expired" : "playing",
  };

  return {
    state: nextState,
    events:
      nextState.status === "expired"
        ? [{ type: "roundExpired", finalScore: nextState.score }]
        : [],
  };
}

function createToolRuntimeState(runtimeConfig) {
  const toolsById = {};

  for (const tool of runtimeConfig.tools) {
    toolsById[tool.toolId] = {
      toolId: tool.toolId,
      usesRemaining: tool.usesPerRound,
      cooldownRemainingSeconds: 0,
    };
  }

  return {
    toolsById,
  };
}

function advanceToolCooldowns(state, deltaSeconds) {
  const toolsById = {};

  for (const [toolId, toolState] of Object.entries(state.toolsById)) {
    toolsById[toolId] = {
      ...toolState,
      cooldownRemainingSeconds: Math.max(
        0,
        toolState.cooldownRemainingSeconds - Math.max(0, deltaSeconds),
      ),
    };
  }

  return {
    toolsById,
  };
}

function useHintTool(runtimeConfig, roundState, toolState) {
  const hintConfig = runtimeConfig.tools.find((tool) => tool.toolId === "hint");
  const hintState = toolState.toolsById.hint;

  if (!hintConfig || !hintState || hintState.usesRemaining <= 0) {
    return {
      state: toolState,
      events: [{ type: "toolUnavailable" }],
    };
  }

  if (hintState.cooldownRemainingSeconds > 0) {
    return {
      state: toolState,
      events: [{ type: "toolUnavailable" }],
    };
  }

  const foundTargetIds = new Set(roundState.foundTargetIds);
  const target = runtimeConfig.selectedTargets.find(
    (candidate) => !foundTargetIds.has(candidate.targetId),
  );

  if (!target) {
    return {
      state: toolState,
      events: [{ type: "toolUnavailable" }],
    };
  }

  return {
    state: {
      toolsById: {
        ...toolState.toolsById,
        hint: {
          ...hintState,
          usesRemaining: hintState.usesRemaining - 1,
          cooldownRemainingSeconds: hintConfig.cooldownSeconds,
        },
      },
    },
    events: [
      {
        type: "hintReveal",
        toolId: "hint",
        target,
        durationSeconds: hintConfig.durationSeconds ?? 2,
      },
    ],
  };
}

function useMagnifierTool(runtimeConfig, toolState) {
  const config = runtimeConfig.tools.find((tool) => tool.toolId === "magnifier");
  const state = toolState.toolsById.magnifier;
  if (!config || !state || state.usesRemaining <= 0) {
    return { state: toolState, events: [{ type: "toolUnavailable" }] };
  }
  return {
    state: {
      toolsById: {
        ...toolState.toolsById,
        magnifier: {
          ...state,
          usesRemaining: state.usesRemaining - 1,
          cooldownRemainingSeconds: config.cooldownSeconds,
        },
      },
    },
    events: [
      {
        type: "magnifierZoom",
        toolId: "magnifier",
        zoomMultiplier: config.value ?? 1,
        durationSeconds: config.durationSeconds ?? 0,
      },
    ],
  };
}

function createRoundViewModel(runtimeConfig, state, options) {
  const totalCount = state.selectedTargetIds.length;
  const foundCount = state.foundTargetIds.length;

  return {
    hud: {
      modeId: state.modeId,
      modeName: runtimeConfig.mode.name,
      status: state.status,
      score: state.score,
      comboStreak: state.comboStreak,
      foundCount,
      totalCount,
      progress01: totalCount > 0 ? foundCount / totalCount : 0,
      timer: createTimerViewModel(
        state.remainingSeconds,
        runtimeConfig.mode.timeLimitSeconds,
      ),
      targetList: [],
    },
    settlement:
      state.status === "playing"
        ? undefined
        : createSettlementViewModel(state, totalCount),
  };
}

function createTimerViewModel(remainingSeconds, totalSeconds) {
  const clampedRemainingSeconds = Math.max(0, Math.ceil(remainingSeconds));
  return {
    remainingSeconds: clampedRemainingSeconds,
    label: formatSeconds(clampedRemainingSeconds),
    urgency: clampedRemainingSeconds <= 5 ? "critical" : "normal",
    progress01: totalSeconds > 0 ? clampedRemainingSeconds / totalSeconds : 0,
  };
}

function createSettlementViewModel(state, totalCount) {
  const foundCount = state.foundTargetIds.length;
  const accuracyDenominator = state.correctHits + state.wrongTaps;
  const accuracy01 =
    accuracyDenominator > 0 ? state.correctHits / accuracyDenominator : 0;

  return {
    status: state.status,
    title: state.status === "completed" ? "Round Complete" : "Time Up",
    foundCount,
    totalCount,
    score: state.score,
    accuracy01,
    timeRemaining: state.remainingSeconds,
    starRating: state.status === "completed" && accuracy01 >= 0.9 ? 3 : 0,
  };
}

function createRoundResultRecord(modeId, settlement, completedAtUnixMs) {
  return {
    modeId,
    status: settlement.status === "completed" ? "completed" : "expired",
    score: settlement.score,
    foundCount: settlement.foundCount,
    totalCount: settlement.totalCount,
    accuracy01: settlement.accuracy01,
    starRating: settlement.starRating,
    completedAtUnixMs,
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

  if (rule.type === "allOfType") {
    return targetPoints.filter(
      (targetPoint) => targetPoint.typeId === rule.typeId,
    );
  }

  return [];
}

function calculateCorrectHitScore(input) {
  const baseScore = input.target.reward.score || input.scoringRule.correctHitScore;
  const comboBonus = Math.min(
    input.comboStreak * input.scoringRule.combo.bonusPerStreak,
    input.scoringRule.combo.maxBonus,
  );
  const timeBonus = input.isRoundComplete
    ? Math.min(
        input.secondsRemaining *
          input.scoringRule.timeBonus.pointsPerSecondRemaining,
        input.scoringRule.timeBonus.maxBonus,
      )
    : 0;

  return baseScore + comboBonus + timeBonus;
}

function isPointInTargetHitArea(target, point) {
  const localPoint = {
    x: point.x - target.position.x,
    y: point.y - target.position.y,
  };
  const hitShape = target.hitShape;

  if (hitShape.type === "circle") {
    return localPoint.x * localPoint.x + localPoint.y * localPoint.y <=
      hitShape.radius * hitShape.radius;
  }

  if (hitShape.type === "rectangle") {
    return (
      Math.abs(localPoint.x) <= hitShape.width / 2 &&
      Math.abs(localPoint.y) <= hitShape.height / 2
    );
  }

  if (hitShape.type === "polygon") {
    return true;
  }

  return false;
}

function formatSeconds(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function findRequired(items, field, id) {
  const item = (items ?? []).find((candidate) => candidate?.[field] === id);
  if (!item) {
    throw new Error(`Missing ${field}: ${id}`);
  }
  return item;
}

function mapById(items, field) {
  return new Map((items ?? []).map((item) => [item[field], item]));
}

function assertArray(groupName, label, actual, expected) {
  if (
    actual.length !== expected.length ||
    actual.some((value, index) => value !== expected[index])
  ) {
    failures.push(
      `${groupName} expected ${label} [${expected.join(", ")}] but got [${actual.join(", ")}]`,
    );
  }
}

function assertArrayLength(groupName, label, actual, expectedLength) {
  if (actual.length !== expectedLength) {
    failures.push(
      `${groupName} expected ${label} length ${expectedLength} but got ${actual.length}`,
    );
  }
}

function assertPartialObject(groupName, label, actual, expected) {
  if (!actual) {
    failures.push(`${groupName} expected ${label} but got none`);
    return;
  }

  for (const [field, expectedValue] of Object.entries(expected)) {
    const actualValue = actual[field];
    if (isObject(expectedValue)) {
      assertPartialObject(groupName, `${label}.${field}`, actualValue, expectedValue);
    } else if (!nearlyEqual(actualValue, expectedValue)) {
      failures.push(
        `${groupName} expected ${label}.${field}=${expectedValue} but got ${actualValue}`,
      );
    }
  }
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function nearlyEqual(actual, expected) {
  if (typeof actual === "number" && typeof expected === "number") {
    return Math.abs(actual - expected) < 0.000001;
  }

  return actual === expected;
}
