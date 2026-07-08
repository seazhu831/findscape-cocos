import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const configPath = path.join(
  repoRoot,
  "cocos/assets/resources/config/demo-gameplay.json",
);
const fixturePath = path.join(scriptDir, "fixtures/round-view-model-cases.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const fixtures = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const failures = [];

for (const fixture of fixtures) {
  const runtimeConfig = createModeRuntimeConfig(config, fixture.modeId);
  const targetTypesById = mapById(config.targetTypes, "typeId");
  let state = createRoundState(runtimeConfig);

  for (const step of fixture.steps) {
    if (step.type === "tap") {
      state = applyRoundTap(runtimeConfig, state, step.point).state;
    } else if (step.type === "advanceTime") {
      state = applyRoundTimeDelta(state, step.deltaSeconds).state;
    } else {
      failures.push(`${fixture.name} has unsupported step type: ${step.type}`);
    }
  }

  const viewModel = createRoundViewModel(runtimeConfig, state, {
    targetTypesById,
  });
  assertPartialObject(fixture.name, "hud", viewModel.hud, fixture.expectedHud);

  if (fixture.expectedSettlement === null) {
    if (viewModel.settlement !== undefined) {
      failures.push(`${fixture.name} expected no settlement view model`);
    }
  } else {
    assertPartialObject(
      fixture.name,
      "settlement",
      viewModel.settlement,
      fixture.expectedSettlement,
    );
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Validated ${fixtures.length} round view model fixture groups`);

function createRoundViewModel(runtimeConfig, state, options) {
  const totalCount = state.selectedTargetIds.length;
  const foundCount = state.foundTargetIds.length;
  const progress01 = totalCount > 0 ? foundCount / totalCount : 0;
  const hud = {
    modeId: state.modeId,
    modeName: runtimeConfig.mode.name,
    status: state.status,
    score: state.score,
    comboStreak: state.comboStreak,
    foundCount,
    totalCount,
    progress01,
    timer: createTimerViewModel(
      state.remainingSeconds,
      runtimeConfig.mode.timeLimitSeconds,
    ),
    targetList: createTargetListViewModels(
      runtimeConfig,
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
    totalSeconds > 0 ? clamp01(clampedRemainingSeconds / totalSeconds) : 0;

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

function createTargetListViewModels(runtimeConfig, state, targetTypesById) {
  const requiredCounts = new Map();
  const foundCounts = new Map();
  const foundTargetIds = new Set(state.foundTargetIds);

  for (const target of runtimeConfig.selectedTargets) {
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
  const selectedTargets = selectTargetsForMode(mode, targetPointSet.targetPoints);

  return {
    mode,
    map: mapConfig,
    targetPointSet,
    scoringRule,
    selectedTargets,
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

function applyRoundTap(runtimeConfig, state, mapPoint) {
  if (state.status !== "playing") {
    return { state, events: [] };
  }

  const hitTarget = runtimeConfig.selectedTargets.find((target) =>
    isPointInTargetHitArea(target, mapPoint),
  );

  if (!hitTarget) {
    return {
      state: {
        ...state,
        comboStreak: 0,
        wrongTaps: state.wrongTaps + 1,
      },
      events: [{ type: "wrongTap" }],
    };
  }

  if (state.foundTargetIds.includes(hitTarget.targetId)) {
    return {
      state,
      events: [{ type: "duplicateHit", target: hitTarget }],
    };
  }

  const foundTargetIds = [...state.foundTargetIds, hitTarget.targetId];
  const isRoundComplete =
    foundTargetIds.length >= state.selectedTargetIds.length &&
    runtimeConfig.mode.successRule === "findAllSelectedTargets";
  const comboStreak = state.comboStreak + 1;
  const scoreAdded = calculateCorrectHitScore({
    target: hitTarget,
    scoringRule: runtimeConfig.scoringRule,
    comboStreak,
    secondsRemaining: state.remainingSeconds,
    isRoundComplete,
  });

  return {
    state: {
      ...state,
      status: isRoundComplete ? "completed" : "playing",
      foundTargetIds,
      score: state.score + scoreAdded,
      comboStreak,
      correctHits: state.correctHits + 1,
    },
    events: [{ type: "correctHit" }],
  };
}

function applyRoundTimeDelta(state, deltaSeconds) {
  if (state.status !== "playing") {
    return { state, events: [] };
  }

  const remainingSeconds = Math.max(0, state.remainingSeconds - deltaSeconds);

  return {
    state: {
      ...state,
      elapsedSeconds: state.elapsedSeconds + Math.max(0, deltaSeconds),
      remainingSeconds,
      status: remainingSeconds <= 0 ? "expired" : "playing",
    },
    events: remainingSeconds <= 0 ? [{ type: "roundExpired" }] : [],
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

function isPointInTargetHitArea(targetPoint, worldPoint) {
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

function clamp01(value) {
  return Math.min(Math.max(value, 0), 1);
}

function findRequired(items, field, id) {
  const item = (items ?? []).find((candidate) => candidate?.[field] === id);
  if (!item) {
    throw new Error(`Missing ${field}: ${id}`);
  }
  return item;
}

function mapById(items, field) {
  const mapped = new Map();
  for (const item of items ?? []) {
    mapped.set(item[field], item);
  }
  return mapped;
}

function assertPartialObject(groupName, label, actual, expected) {
  if (!actual) {
    failures.push(`${groupName} expected ${label} but got none`);
    return;
  }

  for (const [field, expectedValue] of Object.entries(expected)) {
    const actualValue = actual[field];

    if (Array.isArray(expectedValue)) {
      assertArrayContainsObjects(groupName, `${label}.${field}`, actualValue, expectedValue);
    } else if (isObject(expectedValue)) {
      assertPartialObject(groupName, `${label}.${field}`, actualValue, expectedValue);
    } else if (!nearlyEqual(actualValue, expectedValue)) {
      failures.push(
        `${groupName} expected ${label}.${field}=${expectedValue} but got ${actualValue}`,
      );
    }
  }
}

function assertArrayContainsObjects(groupName, label, actual, expected) {
  if (!Array.isArray(actual)) {
    failures.push(`${groupName} expected ${label} to be an array`);
    return;
  }

  for (const expectedItem of expected) {
    const actualItem = actual.find((candidate) =>
      Object.entries(expectedItem).every(([field, expectedValue]) =>
        nearlyEqual(candidate[field], expectedValue),
      ),
    );

    if (!actualItem) {
      failures.push(
        `${groupName} expected ${label} to contain ${JSON.stringify(expectedItem)}`,
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
