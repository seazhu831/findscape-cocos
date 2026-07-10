import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const configPath = path.join(
  repoRoot,
  "cocos/assets/resources/config/demo-gameplay.json",
);
const fixturePath = path.join(scriptDir, "fixtures/demo-session-cases.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const fixtures = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const failures = [];

for (const fixture of fixtures) {
  const context = createDemoSessionContext(config);
  let state = createInitialDemoSessionState(fixture.initialSaveData);

  if (fixture.expectedContext) {
    assertPartialObject(
      fixture.name,
      "context",
      context,
      fixture.expectedContext,
    );
  }

  for (const step of fixture.steps) {
    let update;

    if (step.type === "showModeSelect") {
      state = showModeSelect(state);
    } else if (step.type === "startRound") {
      state = startDemoRound(context, state, step.modeId);
    } else if (step.type === "tap") {
      update = applyDemoSessionTap(state, step.point, {
        completedAtUnixMs: step.completedAtUnixMs,
      });
      state = update.state;
    } else if (step.type === "tick") {
      update = applyDemoSessionTick(state, step.deltaSeconds, {
        completedAtUnixMs: step.completedAtUnixMs,
      });
      state = update.state;
    } else if (step.type === "hint") {
      update = applyDemoSessionHint(state);
      state = update.state;
    } else if (step.type === "returnToModeSelect") {
      state = returnToModeSelect(state);
    } else {
      failures.push(`${fixture.name} has unsupported step type: ${step.type}`);
      continue;
    }

    if (step.expectedRoundEvents) {
      assertArray(
        fixture.name,
        `${step.type} roundEvents`,
        (update?.roundEvents ?? []).map((event) => event.type),
        step.expectedRoundEvents,
      );
    }

    if (step.expectedToolEvents) {
      assertArray(
        fixture.name,
        `${step.type} toolEvents`,
        (update?.toolEvents ?? []).map((event) => event.type),
        step.expectedToolEvents,
      );
    }

    if (step.expectedState) {
      assertPartialObject(fixture.name, `${step.type} state`, state, step.expectedState);
    }
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Validated ${fixtures.length} demo session fixture groups`);

function createDemoSessionContext(gameplayConfig) {
  const index = createGameplayConfigIndex(gameplayConfig);
  const modeRuntimeConfigs = gameplayConfig.gameModes.map((mode) =>
    createModeRuntimeConfig(index, mode.modeId),
  );

  return {
    config: gameplayConfig,
    index,
    targetTypesById: index.targetTypesById,
    modeSummaries: modeRuntimeConfigs.map(createModeVariantSummary),
  };
}

function createInitialDemoSessionState(saveData = createEmptyLocalSave()) {
  return {
    screen: "home",
    saveData,
  };
}

function showModeSelect(state) {
  return {
    ...state,
    screen: "modeSelect",
    selectedModeId: undefined,
    roundContext: undefined,
    roundState: undefined,
    roundViewModel: undefined,
  };
}

function startDemoRound(context, state, modeId) {
  const modeRuntimeConfig = createModeRuntimeConfig(context.index, modeId);
  const roundContext = {
    gameplayConfig: context.config,
    modeRuntimeConfig,
    targetTypesById: context.targetTypesById,
  };
  const roundState = createRoundControllerState(modeRuntimeConfig);

  return {
    ...state,
    screen: "round",
    selectedModeId: modeId,
    roundContext,
    roundState,
    roundViewModel: createRoundControllerViewModel(roundContext, roundState),
    lastResult: undefined,
  };
}

function applyDemoSessionTap(state, point, options = {}) {
  const activeRound = requireActiveRound(state);
  if (!activeRound) {
    return createEmptyUpdate(state);
  }

  const update = applyControllerTap(activeRound.context, activeRound.state, point);
  return createDemoSessionUpdate(state, update, options.completedAtUnixMs);
}

function applyDemoSessionTick(state, deltaSeconds, options = {}) {
  const activeRound = requireActiveRound(state);
  if (!activeRound) {
    return createEmptyUpdate(state);
  }

  const update = applyControllerTick(
    activeRound.context,
    activeRound.state,
    deltaSeconds,
  );
  return createDemoSessionUpdate(state, update, options.completedAtUnixMs);
}

function applyDemoSessionHint(state) {
  const activeRound = requireActiveRound(state);
  if (!activeRound) {
    return createEmptyUpdate(state);
  }

  const update = applyControllerHint(activeRound.context, activeRound.state);
  return createDemoSessionUpdate(state, update);
}

function returnToModeSelect(state) {
  return showModeSelect(state);
}

function createDemoSessionUpdate(previousState, controllerUpdate, completedAtUnixMs = 0) {
  const nextState = settleIfNeeded(
    {
      ...previousState,
      screen: "round",
      roundState: controllerUpdate.state,
      roundViewModel: controllerUpdate.viewModel,
    },
    completedAtUnixMs,
  );

  return {
    state: nextState,
    roundEvents: controllerUpdate.roundEvents,
    toolEvents: controllerUpdate.toolEvents,
    feedbackPlans: controllerUpdate.feedbackPlans,
  };
}

function settleIfNeeded(state, completedAtUnixMs) {
  if (
    !state.roundContext ||
    !state.roundState ||
    !state.roundViewModel?.settlement
  ) {
    return state;
  }

  const result = createControllerRoundResult(
    state.roundContext,
    state.roundState,
    completedAtUnixMs,
  );

  if (!result) {
    return state;
  }

  return {
    ...state,
    screen: "settlement",
    saveData: applyRoundResultToLocalSave(state.saveData, result),
    lastResult: result,
  };
}

function requireActiveRound(state) {
  if (
    state.screen !== "round" ||
    !state.roundContext ||
    !state.roundState
  ) {
    return undefined;
  }

  return {
    context: state.roundContext,
    state: state.roundState,
  };
}

function createEmptyUpdate(state) {
  return {
    state,
    roundEvents: [],
    toolEvents: [],
    feedbackPlans: [],
  };
}

function createGameplayConfigIndex(gameplayConfig) {
  return {
    mapsById: mapById(gameplayConfig.maps, "mapId"),
    targetTypesById: mapById(gameplayConfig.targetTypes, "typeId"),
    targetPointSetsById: mapById(gameplayConfig.targetPointSets, "targetPointSetId"),
    scoringRulesById: mapById(gameplayConfig.scoringRules, "scoringRuleId"),
    toolsById: mapById(gameplayConfig.tools, "toolId"),
    gameModesById: mapById(gameplayConfig.gameModes, "modeId"),
  };
}

function createModeRuntimeConfig(index, modeId) {
  const mode = requireById(index.gameModesById, modeId, "game mode");
  const mapConfig = requireById(index.mapsById, mode.mapId, "map");
  const targetPointSet = requireById(
    index.targetPointSetsById,
    mapConfig.targetPointSetId,
    "target point set",
  );
  const scoringRule = requireById(
    index.scoringRulesById,
    mode.scoringRuleId,
    "scoring rule",
  );

  return {
    mode,
    map: mapConfig,
    targetPointSet,
    scoringRule,
    tools: mode.toolIds.map((toolId) =>
      requireById(index.toolsById, toolId, "tool"),
    ),
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

function createRoundControllerState(modeRuntimeConfig) {
  return {
    round: createRoundState(modeRuntimeConfig),
    tools: createToolRuntimeState(modeRuntimeConfig),
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

function createRoundState(modeRuntimeConfig) {
  return {
    modeId: modeRuntimeConfig.mode.modeId,
    status: "playing",
    selectedTargetIds: modeRuntimeConfig.selectedTargets.map(
      (target) => target.targetId,
    ),
    foundTargetIds: [],
    score: 0,
    comboStreak: 0,
    correctHits: 0,
    wrongTaps: 0,
    elapsedSeconds: 0,
    remainingSeconds: modeRuntimeConfig.mode.timeLimitSeconds,
  };
}

function applyRoundTap(modeRuntimeConfig, state, point) {
  if (state.status !== "playing") {
    return {
      state,
      events: [],
    };
  }

  const hitTarget = modeRuntimeConfig.selectedTargets.find((target) =>
    isPointInTargetHitArea(target, point),
  );

  if (!hitTarget) {
    const penalty = modeRuntimeConfig.scoringRule.wrongTapPenalty;
    return {
      state: {
        ...state,
        score: Math.max(0, state.score - penalty),
        comboStreak: 0,
        wrongTaps: state.wrongTaps + 1,
      },
      events: [
        {
          type: "wrongTap",
          penalty,
        },
      ],
    };
  }

  if (state.foundTargetIds.includes(hitTarget.targetId)) {
    return {
      state,
      events: [
        {
          type: "duplicateHit",
          target: hitTarget,
        },
      ],
    };
  }

  const foundTargetIds = [...state.foundTargetIds, hitTarget.targetId];
  const isRoundComplete =
    foundTargetIds.length >= state.selectedTargetIds.length &&
    modeRuntimeConfig.mode.successRule === "findAllSelectedTargets";
  const comboStreak = state.comboStreak + 1;
  const scoreAdded = calculateCorrectHitScore({
    target: hitTarget,
    scoringRule: modeRuntimeConfig.scoringRule,
    comboStreak,
    secondsRemaining: state.remainingSeconds,
    isRoundComplete,
  });
  const score = state.score + scoreAdded;
  const events = [
    {
      type: "correctHit",
      target: hitTarget,
      scoreAdded,
      isRoundComplete,
    },
  ];

  if (isRoundComplete) {
    events.push({
      type: "roundCompleted",
      finalScore: score,
    });
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
    return {
      state,
      events: [],
    };
  }

  const elapsedSeconds = state.elapsedSeconds + Math.max(0, deltaSeconds);
  const remainingSeconds = Math.max(0, state.remainingSeconds - deltaSeconds);
  const nextState = {
    ...state,
    elapsedSeconds,
    remainingSeconds,
    status: remainingSeconds <= 0 ? "expired" : "playing",
  };

  return {
    state: nextState,
    events:
      nextState.status === "expired"
        ? [
            {
              type: "roundExpired",
              finalScore: nextState.score,
            },
          ]
        : [],
  };
}

function createToolRuntimeState(modeRuntimeConfig) {
  return {
    toolsById: Object.fromEntries(
      modeRuntimeConfig.tools.map((tool) => [
        tool.toolId,
        {
          toolId: tool.toolId,
          usesRemaining: tool.usesPerRound,
          cooldownRemainingSeconds: 0,
          isActive: false,
        },
      ]),
    ),
  };
}

function useHintTool(modeRuntimeConfig, roundState, toolState) {
  const hint = toolState.toolsById.hint;
  if (!hint || hint.usesRemaining <= 0 || hint.cooldownRemainingSeconds > 0) {
    return {
      state: toolState,
      events: [
        {
          type: "toolUnavailable",
          toolId: "hint",
        },
      ],
    };
  }

  const unresolvedTargets = modeRuntimeConfig.selectedTargets.filter(
    (target) => !roundState.foundTargetIds.includes(target.targetId),
  );
  const revealedTarget = unresolvedTargets[0];
  const hintConfig = modeRuntimeConfig.tools.find((tool) => tool.toolId === "hint");
  const nextHint = {
    ...hint,
    usesRemaining: hint.usesRemaining - 1,
    cooldownRemainingSeconds: hintConfig?.cooldownSeconds ?? 0,
    isActive: true,
  };

  return {
    state: {
      toolsById: {
        ...toolState.toolsById,
        hint: nextHint,
      },
    },
    events: revealedTarget
      ? [
          {
            type: "hintReveal",
            toolId: "hint",
            target: revealedTarget,
          },
        ]
      : [],
  };
}

function advanceToolCooldowns(toolState, deltaSeconds) {
  const toolsById = {};
  for (const [toolId, tool] of Object.entries(toolState.toolsById)) {
    toolsById[toolId] = {
      ...tool,
      cooldownRemainingSeconds: Math.max(
        0,
        tool.cooldownRemainingSeconds - deltaSeconds,
      ),
    };
  }
  return {
    toolsById,
  };
}

function createRoundViewModel(modeRuntimeConfig, state, options) {
  const totalCount = state.selectedTargetIds.length;
  const foundCount = state.foundTargetIds.length;
  const progress01 = totalCount > 0 ? foundCount / totalCount : 0;
  const hud = {
    modeId: state.modeId,
    modeName: modeRuntimeConfig.mode.name,
    status: state.status,
    score: state.score,
    comboStreak: state.comboStreak,
    foundCount,
    totalCount,
    progress01,
    timer: createTimerViewModel(
      state.remainingSeconds,
      modeRuntimeConfig.mode.timeLimitSeconds,
    ),
    targetList: createTargetListViewModels(
      modeRuntimeConfig,
      state,
      options.targetTypesById,
    ),
  };

  return {
    hud,
    settlement:
      state.status === "playing"
        ? undefined
        : createSettlementViewModel(state, totalCount),
  };
}

function createTimerViewModel(remainingSeconds, totalSeconds) {
  const clampedRemainingSeconds = Math.max(0, Math.ceil(remainingSeconds));
  const progress01 =
    totalSeconds > 0 ? Math.min(Math.max(clampedRemainingSeconds / totalSeconds, 0), 1) : 0;

  return {
    remainingSeconds: clampedRemainingSeconds,
    label: formatSeconds(clampedRemainingSeconds),
    urgency: getTimerUrgency(clampedRemainingSeconds),
    progress01,
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
    starRating: calculateStarRating(state.status, foundCount, totalCount, accuracy01),
  };
}

function createTargetListViewModels(modeRuntimeConfig, state, targetTypesById) {
  const requiredCounts = new Map();
  const foundCounts = new Map();
  const foundTargetIds = new Set(state.foundTargetIds);

  for (const target of modeRuntimeConfig.selectedTargets) {
    requiredCounts.set(target.typeId, (requiredCounts.get(target.typeId) ?? 0) + 1);
    if (foundTargetIds.has(target.targetId)) {
      foundCounts.set(target.typeId, (foundCounts.get(target.typeId) ?? 0) + 1);
    }
  }

  return [...requiredCounts.entries()].map(([typeId, requiredCount]) => {
    const targetType = targetTypesById.get(typeId);
    const foundCount = foundCounts.get(typeId) ?? 0;

    return {
      typeId,
      displayName: targetType?.displayName ?? typeId,
      iconAsset: targetType?.iconAsset ?? "",
      foundCount,
      requiredCount,
      isComplete: foundCount >= requiredCount,
    };
  });
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

function applyRoundResultToLocalSave(saveData, result) {
  const existingBest = saveData.bestByModeId[result.modeId];
  const shouldReplaceBest =
    !existingBest ||
    result.score > existingBest.bestScore ||
    (result.score === existingBest.bestScore &&
      result.starRating > existingBest.bestStarRating) ||
    (result.score === existingBest.bestScore &&
      result.starRating === existingBest.bestStarRating &&
      result.accuracy01 > existingBest.bestAccuracy01);

  return {
    version: 1,
    bestByModeId: {
      ...saveData.bestByModeId,
      ...(shouldReplaceBest
        ? {
            [result.modeId]: {
              modeId: result.modeId,
              bestScore: result.score,
              bestStarRating: result.starRating,
              bestAccuracy01: result.accuracy01,
              bestFoundCount: result.foundCount,
              totalCount: result.totalCount,
              updatedAtUnixMs: result.completedAtUnixMs,
            },
          }
        : {}),
    },
    lastResult: result,
  };
}

function createEmptyLocalSave() {
  return {
    version: 1,
    bestByModeId: {},
  };
}

function calculateCorrectHitScore(input) {
  const baseScore =
    input.target.reward.score || input.scoringRule.correctHitScore;
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

function isPointInTargetHitArea(target, point) {
  const localPoint = {
    x: point.x - target.position.x,
    y: point.y - target.position.y,
  };
  const shape = target.hitShape;
  if (shape.type === "circle") {
    return squaredDistance(localPoint) <= shape.radius * shape.radius;
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
  if (shape.type === "spriteBounds") {
    return false;
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

function formatSeconds(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function getTimerUrgency(remainingSeconds) {
  if (remainingSeconds <= 5) {
    return "critical";
  }
  if (remainingSeconds <= 15) {
    return "warning";
  }
  return "normal";
}

function calculateStarRating(status, foundCount, totalCount, accuracy01) {
  if (totalCount <= 0 || foundCount <= 0) {
    return 0;
  }
  const completion01 = foundCount / totalCount;
  if (status === "completed" && accuracy01 >= 0.9) {
    return 3;
  }
  if (completion01 >= 0.75 && accuracy01 >= 0.7) {
    return 2;
  }
  if (completion01 >= 0.4) {
    return 1;
  }
  return 0;
}

function requireById(mapped, id, label) {
  const item = mapped.get(id);
  if (!item) {
    throw new Error(`Unknown ${label}: ${id}`);
  }
  return item;
}

function mapById(items, fieldName) {
  return new Map(items.map((item) => [item[fieldName], item]));
}

function uniqueSortedByFirstSeen(items) {
  return Array.from(new Set(items));
}

function assertArray(name, label, actual, expected) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures.push(
      `${name} ${label}: expected ${JSON.stringify(
        expected,
      )}, got ${JSON.stringify(actual)}`,
    );
  }
}

function assertPartialObject(name, label, actual, expected) {
  for (const [key, expectedValue] of Object.entries(expected)) {
    const actualValue = actual?.[key];

    if (expectedValue === null) {
      if (actualValue !== undefined) {
        failures.push(`${name} ${label}.${key}: expected undefined`);
      }
      continue;
    }

    if (Array.isArray(expectedValue)) {
      assertPartialArray(name, `${label}.${key}`, actualValue, expectedValue);
      continue;
    }

    if (isPlainObject(expectedValue)) {
      assertPartialObject(name, `${label}.${key}`, actualValue, expectedValue);
      continue;
    }

    if (actualValue !== expectedValue) {
      failures.push(
        `${name} ${label}.${key}: expected ${JSON.stringify(
          expectedValue,
        )}, got ${JSON.stringify(actualValue)}`,
      );
    }
  }
}

function assertPartialArray(name, label, actual, expected) {
  if (!Array.isArray(actual)) {
    failures.push(`${name} ${label}: expected array, got ${typeof actual}`);
    return;
  }

  if (actual.length < expected.length) {
    failures.push(
      `${name} ${label}: expected at least ${expected.length} items, got ${actual.length}`,
    );
    return;
  }

  for (let index = 0; index < expected.length; index += 1) {
    const expectedValue = expected[index];
    const actualValue = actual[index];

    if (isPlainObject(expectedValue)) {
      assertPartialObject(name, `${label}[${index}]`, actualValue, expectedValue);
    } else if (JSON.stringify(actualValue) !== JSON.stringify(expectedValue)) {
      failures.push(
        `${name} ${label}[${index}]: expected ${JSON.stringify(
          expectedValue,
        )}, got ${JSON.stringify(actualValue)}`,
      );
    }
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
