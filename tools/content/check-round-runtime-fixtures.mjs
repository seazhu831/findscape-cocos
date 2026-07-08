import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const configPath = path.join(
  repoRoot,
  "cocos/assets/resources/config/demo-gameplay.json",
);
const fixturePath = path.join(scriptDir, "fixtures/round-runtime-cases.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const fixtures = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const failures = [];

for (const fixture of fixtures) {
  const runtimeConfig = createModeRuntimeConfig(config, fixture.modeId);
  let state = createRoundState(runtimeConfig);

  if (fixture.expectedInitialSelectedTargets) {
    assertArray(
      fixture.name,
      "initial selected targets",
      state.selectedTargetIds,
      fixture.expectedInitialSelectedTargets,
    );
  }

  for (const step of fixture.steps) {
    let events = [];

    if (step.type === "tap") {
      const update = applyRoundTap(runtimeConfig, state, step.point);
      state = update.state;
      events = update.events;
    } else if (step.type === "advanceTime") {
      const update = applyRoundTimeDelta(state, step.deltaSeconds);
      state = update.state;
      events = update.events;
    } else {
      failures.push(`${fixture.name} has unsupported step type: ${step.type}`);
      continue;
    }

    if (step.expectedEvents) {
      assertArray(
        fixture.name,
        `${step.type} events`,
        events.map((event) => event.type),
        step.expectedEvents,
      );
    }

    if (step.expectedState) {
      assertPartialState(fixture.name, step.type, state, step.expectedState);
    }
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Validated ${fixtures.length} round runtime fixture groups`);

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
    const penalty = runtimeConfig.scoringRule.wrongTapPenalty;
    return {
      state: {
        ...state,
        score: Math.max(0, state.score - penalty),
        comboStreak: 0,
        wrongTaps: state.wrongTaps + 1,
      },
      events: [{ type: "wrongTap", penalty }],
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
  const score = state.score + scoreAdded;
  const nextState = {
    ...state,
    status: isRoundComplete ? "completed" : "playing",
    foundTargetIds,
    score,
    comboStreak,
    correctHits: state.correctHits + 1,
  };
  const events = [
    {
      type: "correctHit",
      target: hitTarget,
      scoreAdded,
      isRoundComplete,
    },
  ];

  if (isRoundComplete) {
    events.push({ type: "roundCompleted", finalScore: score });
  }

  return { state: nextState, events };
}

function advanceRoundTime(state, deltaSeconds) {
  if (state.status !== "playing") {
    return state;
  }

  const elapsedSeconds = state.elapsedSeconds + Math.max(0, deltaSeconds);
  const remainingSeconds = Math.max(0, state.remainingSeconds - deltaSeconds);

  return {
    ...state,
    elapsedSeconds,
    remainingSeconds,
    status: remainingSeconds <= 0 ? "expired" : "playing",
  };
}

function applyRoundTimeDelta(state, deltaSeconds) {
  const nextState = advanceRoundTime(state, deltaSeconds);

  if (state.status === "playing" && nextState.status === "expired") {
    return {
      state: nextState,
      events: [{ type: "roundExpired", finalScore: nextState.score }],
    };
  }

  return {
    state: nextState,
    events: [],
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

function findRequired(items, field, id) {
  const item = (items ?? []).find((candidate) => candidate?.[field] === id);
  if (!item) {
    throw new Error(`Missing ${field}: ${id}`);
  }
  return item;
}

function assertArray(groupName, checkName, actual, expected) {
  if (
    actual.length !== expected.length ||
    actual.some((value, index) => value !== expected[index])
  ) {
    failures.push(
      `${groupName} ${checkName} expected [${expected.join(", ")}] but got [${actual.join(", ")}]`,
    );
  }
}

function assertPartialState(groupName, stepType, state, expectedState) {
  for (const [field, expected] of Object.entries(expectedState)) {
    const actual = state[field];
    if (actual !== expected) {
      failures.push(
        `${groupName} ${stepType} expected state.${field}=${expected} but got ${actual}`,
      );
    }
  }
}
