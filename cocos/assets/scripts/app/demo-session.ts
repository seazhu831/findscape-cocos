import {
  createGameplayConfigIndex,
  createModeRuntimeConfig,
  type GameplayConfigIndex,
  type ModeRuntimeConfig,
} from "../config/gameplay-config";
import type {
  GameModeId,
  GameplayConfig,
  TargetTypeConfig,
  Vector2Config,
} from "../config/gameplay-schema";
import {
  createModeVariantSummaries,
  type ModeVariantSummary,
} from "../config/mode-capabilities";
import {
  applyControllerHint,
  applyControllerTap,
  applyControllerTick,
  createControllerRoundResult,
  createRoundControllerState,
  createRoundControllerViewModel,
  type RoundControllerContext,
  type RoundControllerState,
  type RoundControllerUpdate,
} from "../gameplay/round-controller";
import type { HitTestOptions } from "../gameplay/target-hit-test";
import {
  applyRoundResultToLocalSave,
  createEmptyLocalSave,
  type LocalSaveData,
  type RoundResultRecord,
} from "../storage/local-save";
import type { RoundViewModel } from "../ui/round-view-model";

export type DemoSessionScreen =
  | "home"
  | "modeSelect"
  | "round"
  | "settlement";

export interface DemoSessionContext {
  config: GameplayConfig;
  index: GameplayConfigIndex;
  targetTypesById: Map<string, TargetTypeConfig>;
  modeSummaries: ModeVariantSummary[];
}

export interface DemoSessionState {
  screen: DemoSessionScreen;
  saveData: LocalSaveData;
  selectedModeId?: GameModeId;
  roundContext?: RoundControllerContext;
  roundState?: RoundControllerState;
  roundViewModel?: RoundViewModel;
  lastResult?: RoundResultRecord;
}

export interface DemoSessionUpdate {
  state: DemoSessionState;
  roundEvents: RoundControllerUpdate["roundEvents"];
  toolEvents: RoundControllerUpdate["toolEvents"];
}

export interface DemoSessionActionOptions {
  completedAtUnixMs?: number;
  hitTestOptions?: HitTestOptions;
}

export function createDemoSessionContext(
  config: GameplayConfig,
): DemoSessionContext {
  const index = createGameplayConfigIndex(config);
  const modeRuntimeConfigs = config.gameModes.map((mode) =>
    createModeRuntimeConfig(index, mode.modeId),
  );

  return {
    config,
    index,
    targetTypesById: index.targetTypesById,
    modeSummaries: createModeVariantSummaries(modeRuntimeConfigs),
  };
}

export function createInitialDemoSessionState(
  saveData: LocalSaveData = createEmptyLocalSave(),
): DemoSessionState {
  return {
    screen: "home",
    saveData,
  };
}

export function showModeSelect(
  state: DemoSessionState,
): DemoSessionState {
  return {
    ...state,
    screen: "modeSelect",
    selectedModeId: undefined,
    roundContext: undefined,
    roundState: undefined,
    roundViewModel: undefined,
  };
}

export function startDemoRound(
  context: DemoSessionContext,
  state: DemoSessionState,
  modeId: GameModeId,
): DemoSessionState {
  const modeRuntimeConfig = createModeRuntimeConfig(context.index, modeId);
  const roundContext = createRoundControllerContext(
    context,
    modeRuntimeConfig,
  );
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

export function applyDemoSessionTap(
  state: DemoSessionState,
  mapPoint: Vector2Config,
  options: DemoSessionActionOptions = {},
): DemoSessionUpdate {
  const activeRound = requireActiveRound(state);
  if (!activeRound) {
    return createEmptyUpdate(state);
  }

  const update = applyControllerTap(
    activeRound.context,
    activeRound.state,
    mapPoint,
    options.hitTestOptions,
  );
  return createDemoSessionUpdate(state, update, options.completedAtUnixMs);
}

export function applyDemoSessionTick(
  state: DemoSessionState,
  deltaSeconds: number,
  options: DemoSessionActionOptions = {},
): DemoSessionUpdate {
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

export function applyDemoSessionHint(
  state: DemoSessionState,
): DemoSessionUpdate {
  const activeRound = requireActiveRound(state);
  if (!activeRound) {
    return createEmptyUpdate(state);
  }

  const update = applyControllerHint(activeRound.context, activeRound.state);
  return createDemoSessionUpdate(state, update);
}

export function returnToModeSelect(
  state: DemoSessionState,
): DemoSessionState {
  return showModeSelect(state);
}

function createRoundControllerContext(
  context: DemoSessionContext,
  modeRuntimeConfig: ModeRuntimeConfig,
): RoundControllerContext {
  return {
    modeRuntimeConfig,
    targetTypesById: context.targetTypesById,
  };
}

function createDemoSessionUpdate(
  previousState: DemoSessionState,
  controllerUpdate: RoundControllerUpdate,
  completedAtUnixMs = 0,
): DemoSessionUpdate {
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
  };
}

function settleIfNeeded(
  state: DemoSessionState,
  completedAtUnixMs: number,
): DemoSessionState {
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

function requireActiveRound(
  state: DemoSessionState,
):
  | {
      context: RoundControllerContext;
      state: RoundControllerState;
    }
  | undefined {
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

function createEmptyUpdate(state: DemoSessionState): DemoSessionUpdate {
  return {
    state,
    roundEvents: [],
    toolEvents: [],
  };
}
