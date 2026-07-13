import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const configPath = path.join(
  repoRoot,
  "cocos/assets/resources/config/demo-gameplay.json",
);
const fixturePath = path.join(scriptDir, "fixtures/tool-runtime-cases.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const fixtures = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const failures = [];

for (const fixture of fixtures) {
  const runtimeConfig = createModeRuntimeConfig(config, fixture.modeId);
  const roundState = createRoundState(runtimeConfig, fixture.roundFoundTargetIds ?? []);
  let toolRuntimeState = createToolRuntimeState(runtimeConfig);

  for (const step of fixture.steps) {
    let result = {
      status: "used",
      state: toolRuntimeState,
      events: [],
    };

    if (step.type === "useHint") {
      result = useHintTool(runtimeConfig, roundState, toolRuntimeState);
      toolRuntimeState = result.state;
    } else if (step.type === "useMagnifier") {
      result = useMagnifierTool(runtimeConfig, toolRuntimeState);
      toolRuntimeState = result.state;
    } else if (step.type === "advanceCooldown") {
      toolRuntimeState = advanceToolCooldowns(
        toolRuntimeState,
        step.deltaSeconds,
      );
      result = {
        status: "used",
        state: toolRuntimeState,
        events: [],
      };
    } else {
      failures.push(`${fixture.name} has unsupported step type: ${step.type}`);
      continue;
    }

    if (step.expectedStatus && result.status !== step.expectedStatus) {
      failures.push(
        `${fixture.name} expected status ${step.expectedStatus} but got ${result.status}`,
      );
    }

    if (step.expectedEvents) {
      assertArray(
        fixture.name,
        "events",
        result.events.map((event) => event.type),
        step.expectedEvents,
      );
    }

    if (step.expectedTargetId) {
      const targetId = result.events.find((event) => event.target)?.target?.targetId;
      if (targetId !== step.expectedTargetId) {
        failures.push(
          `${fixture.name} expected target ${step.expectedTargetId} but got ${targetId}`,
        );
      }
    }

    const magnifierEvent = result.events.find(
      (event) => event.type === "magnifierZoom",
    );
    if (
      step.expectedZoomMultiplier !== undefined &&
      magnifierEvent?.zoomMultiplier !== step.expectedZoomMultiplier
    ) {
      failures.push(
        `${fixture.name} expected zoomMultiplier ${step.expectedZoomMultiplier} but got ${magnifierEvent?.zoomMultiplier}`,
      );
    }
    if (
      step.expectedDurationSeconds !== undefined &&
      magnifierEvent?.durationSeconds !== step.expectedDurationSeconds
    ) {
      failures.push(
        `${fixture.name} expected durationSeconds ${step.expectedDurationSeconds} but got ${magnifierEvent?.durationSeconds}`,
      );
    }

    if (step.expectedToolState) {
      assertPartialObject(
        fixture.name,
        "toolState",
        toolRuntimeState.toolsById[step.toolId ?? "hint"],
        step.expectedToolState,
      );
    }
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Validated ${fixtures.length} tool runtime fixture groups`);

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

function useHintTool(runtimeConfig, roundState, toolRuntimeState, toolId = "hint") {
  const toolConfig = runtimeConfig.tools.find((tool) => tool.toolId === toolId);
  const toolState = toolRuntimeState.toolsById[toolId];

  if (!toolConfig || !toolState) {
    return createUnavailableResult(toolRuntimeState, toolId, "unavailable");
  }

  if (toolState.usesRemaining <= 0) {
    return createUnavailableResult(toolRuntimeState, toolId, "unavailable");
  }

  if (toolState.cooldownRemainingSeconds > 0) {
    return createUnavailableResult(toolRuntimeState, toolId, "coolingDown");
  }

  const target = selectHintTarget(runtimeConfig.selectedTargets, roundState);

  if (!target) {
    return createUnavailableResult(toolRuntimeState, toolId, "noTargets");
  }

  const nextState = updateToolState(toolRuntimeState, {
    ...toolState,
    usesRemaining: toolState.usesRemaining - 1,
    cooldownRemainingSeconds: toolConfig.cooldownSeconds,
  });

  return {
    status: "used",
    state: nextState,
    events: [
      {
        type: "hintReveal",
        toolId,
        target,
        durationSeconds: toolConfig.durationSeconds ?? 2,
      },
    ],
  };
}

function useMagnifierTool(runtimeConfig, toolRuntimeState, toolId = "magnifier") {
  const toolConfig = runtimeConfig.tools.find((tool) => tool.toolId === toolId);
  const toolState = toolRuntimeState.toolsById[toolId];

  if (!toolConfig || !toolState || toolState.usesRemaining <= 0) {
    return createUnavailableResult(toolRuntimeState, toolId, "unavailable");
  }
  if (toolState.cooldownRemainingSeconds > 0) {
    return createUnavailableResult(toolRuntimeState, toolId, "coolingDown");
  }

  const nextState = updateToolState(toolRuntimeState, {
    ...toolState,
    usesRemaining: toolState.usesRemaining - 1,
    cooldownRemainingSeconds: toolConfig.cooldownSeconds,
  });
  return {
    status: "used",
    state: nextState,
    events: [
      {
        type: "magnifierZoom",
        toolId,
        zoomMultiplier: toolConfig.value ?? 1,
        durationSeconds: toolConfig.durationSeconds ?? 0,
      },
    ],
  };
}

function selectHintTarget(selectedTargets, roundState) {
  const foundTargetIds = new Set(roundState.foundTargetIds);
  return selectedTargets.find((target) => !foundTargetIds.has(target.targetId));
}

function createUnavailableResult(state, toolId, status) {
  return {
    status,
    state,
    events: [
      {
        type: "toolUnavailable",
        toolId,
        status,
      },
    ],
  };
}

function updateToolState(state, toolState) {
  return {
    toolsById: {
      ...state.toolsById,
      [toolState.toolId]: toolState,
    },
  };
}

function createModeRuntimeConfig(gameplayConfig, modeId) {
  const mode = findRequired(gameplayConfig.gameModes, "modeId", modeId);
  const mapConfig = findRequired(gameplayConfig.maps, "mapId", mode.mapId);
  const targetPointSet = findRequired(
    gameplayConfig.targetPointSets,
    "targetPointSetId",
    mapConfig.targetPointSetId,
  );
  const toolsById = new Map(gameplayConfig.tools.map((tool) => [tool.toolId, tool]));
  const selectedTargets = selectTargetsForMode(mode, targetPointSet.targetPoints);

  return {
    mode,
    map: mapConfig,
    targetPointSet,
    tools: mode.toolIds.map((toolId) => toolsById.get(toolId)).filter(Boolean),
    selectedTargets,
  };
}

function createRoundState(runtimeConfig, foundTargetIds) {
  return {
    modeId: runtimeConfig.mode.modeId,
    status: "playing",
    selectedTargetIds: runtimeConfig.selectedTargets.map(
      (target) => target.targetId,
    ),
    foundTargetIds,
    score: 0,
    comboStreak: 0,
    correctHits: foundTargetIds.length,
    wrongTaps: 0,
    elapsedSeconds: 0,
    remainingSeconds: runtimeConfig.mode.timeLimitSeconds,
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

function findRequired(items, field, id) {
  const item = (items ?? []).find((candidate) => candidate?.[field] === id);
  if (!item) {
    throw new Error(`Missing ${field}: ${id}`);
  }
  return item;
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

function assertPartialObject(groupName, label, actual, expected) {
  if (!actual) {
    failures.push(`${groupName} expected ${label} but got none`);
    return;
  }

  for (const [field, expectedValue] of Object.entries(expected)) {
    const actualValue = actual[field];
    if (actualValue !== expectedValue) {
      failures.push(
        `${groupName} expected ${label}.${field}=${expectedValue} but got ${actualValue}`,
      );
    }
  }
}
