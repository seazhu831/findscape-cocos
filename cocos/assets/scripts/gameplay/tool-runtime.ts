import type { ModeRuntimeConfig } from "../config/gameplay-config";
import type { TargetPointConfig, ToolConfig } from "../config/gameplay-schema";
import type { RoundState } from "./round-runtime";

export type ToolUseStatus =
  | "used"
  | "unavailable"
  | "coolingDown"
  | "noTargets";

export interface ToolState {
  toolId: string;
  usesRemaining: number;
  cooldownRemainingSeconds: number;
}

export interface ToolRuntimeState {
  toolsById: Record<string, ToolState>;
}

export type ToolEvent =
  | {
      type: "hintReveal";
      toolId: string;
      target: TargetPointConfig;
      durationSeconds: number;
    }
  | {
      type: "toolUnavailable";
      toolId: string;
      status: Exclude<ToolUseStatus, "used">;
    };

export interface ToolUseResult {
  status: ToolUseStatus;
  state: ToolRuntimeState;
  events: ToolEvent[];
}

export function createToolRuntimeState(
  modeRuntimeConfig: ModeRuntimeConfig,
): ToolRuntimeState {
  const toolsById: Record<string, ToolState> = {};

  for (const tool of modeRuntimeConfig.tools) {
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

export function advanceToolCooldowns(
  state: ToolRuntimeState,
  deltaSeconds: number,
): ToolRuntimeState {
  const toolsById: Record<string, ToolState> = {};

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

export function useHintTool(
  modeRuntimeConfig: ModeRuntimeConfig,
  roundState: RoundState,
  toolRuntimeState: ToolRuntimeState,
  toolId = "hint",
): ToolUseResult {
  const toolConfig = modeRuntimeConfig.tools.find((tool) => tool.toolId === toolId);
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

  const target = selectHintTarget(modeRuntimeConfig.selectedTargets, roundState);

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

function selectHintTarget(
  selectedTargets: TargetPointConfig[],
  roundState: RoundState,
): TargetPointConfig | undefined {
  const foundTargetIds = new Set(roundState.foundTargetIds);
  return selectedTargets.find((target) => !foundTargetIds.has(target.targetId));
}

function createUnavailableResult(
  state: ToolRuntimeState,
  toolId: string,
  status: Exclude<ToolUseStatus, "used">,
): ToolUseResult {
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

function updateToolState(
  state: ToolRuntimeState,
  toolState: ToolState,
): ToolRuntimeState {
  return {
    toolsById: {
      ...state.toolsById,
      [toolState.toolId]: toolState,
    },
  };
}
