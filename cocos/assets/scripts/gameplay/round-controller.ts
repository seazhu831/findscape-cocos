import type { ModeRuntimeConfig } from "../config/gameplay-config";
import type { TargetTypeConfig, Vector2Config } from "../config/gameplay-schema";
import {
  createRoundResultRecord,
  type RoundResultRecord,
} from "../storage/local-save";
import {
  createRoundViewModel,
  type RoundViewModel,
} from "../ui/round-view-model";
import type { HitTestOptions } from "./target-hit-test";
import {
  applyRoundTap,
  applyRoundTimeDelta,
  createRoundState,
  type RoundEvent,
  type RoundState,
} from "./round-runtime";
import {
  advanceToolCooldowns,
  createToolRuntimeState,
  useHintTool,
  type ToolEvent,
  type ToolRuntimeState,
} from "./tool-runtime";

export interface RoundControllerState {
  round: RoundState;
  tools: ToolRuntimeState;
}

export interface RoundControllerContext {
  modeRuntimeConfig: ModeRuntimeConfig;
  targetTypesById: Map<string, TargetTypeConfig>;
}

export interface RoundControllerUpdate {
  state: RoundControllerState;
  roundEvents: RoundEvent[];
  toolEvents: ToolEvent[];
  viewModel: RoundViewModel;
}

export function createRoundControllerState(
  modeRuntimeConfig: ModeRuntimeConfig,
): RoundControllerState {
  return {
    round: createRoundState(modeRuntimeConfig),
    tools: createToolRuntimeState(modeRuntimeConfig),
  };
}

export function createRoundControllerViewModel(
  context: RoundControllerContext,
  state: RoundControllerState,
): RoundViewModel {
  return createRoundViewModel(context.modeRuntimeConfig, state.round, {
    targetTypesById: context.targetTypesById,
  });
}

export function applyControllerTap(
  context: RoundControllerContext,
  state: RoundControllerState,
  mapPoint: Vector2Config,
  hitTestOptions: HitTestOptions = {},
): RoundControllerUpdate {
  const roundUpdate = applyRoundTap(
    context.modeRuntimeConfig,
    state.round,
    mapPoint,
    hitTestOptions,
  );
  const nextState = {
    ...state,
    round: roundUpdate.state,
  };

  return createControllerUpdate(context, nextState, roundUpdate.events, []);
}

export function applyControllerTick(
  context: RoundControllerContext,
  state: RoundControllerState,
  deltaSeconds: number,
): RoundControllerUpdate {
  const roundUpdate = applyRoundTimeDelta(state.round, deltaSeconds);
  const nextState = {
    round: roundUpdate.state,
    tools: advanceToolCooldowns(state.tools, deltaSeconds),
  };

  return createControllerUpdate(context, nextState, roundUpdate.events, []);
}

export function applyControllerHint(
  context: RoundControllerContext,
  state: RoundControllerState,
): RoundControllerUpdate {
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

export function createControllerRoundResult(
  context: RoundControllerContext,
  state: RoundControllerState,
  completedAtUnixMs: number,
): RoundResultRecord | undefined {
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

function createControllerUpdate(
  context: RoundControllerContext,
  state: RoundControllerState,
  roundEvents: RoundEvent[],
  toolEvents: ToolEvent[],
): RoundControllerUpdate {
  return {
    state,
    roundEvents,
    toolEvents,
    viewModel: createRoundControllerViewModel(context, state),
  };
}
