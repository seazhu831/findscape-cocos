import type { ModeRuntimeConfig } from "../config/gameplay-config";
import type { TargetTypeConfig } from "../config/gameplay-schema";
import type { RoundState } from "../gameplay/round-runtime";
import type { ToolRuntimeState } from "../gameplay/tool-runtime";

export interface TargetListItemViewModel {
  typeId: string;
  displayName: string;
  iconAsset: string;
  foundCount: number;
  requiredCount: number;
  isComplete: boolean;
}

export interface TimerViewModel {
  remainingSeconds: number;
  label: string;
  urgency: "normal" | "warning" | "critical";
  progress01: number;
}

export interface ToolHudViewModel {
  toolId: string;
  usesRemaining: number;
  cooldownSeconds: number;
  isCoolingDown: boolean;
  isDepleted: boolean;
}

export interface RoundHudViewModel {
  modeId: string;
  modeName: string;
  status: RoundState["status"];
  score: number;
  comboStreak: number;
  foundCount: number;
  totalCount: number;
  progress01: number;
  timer: TimerViewModel;
  targetList: TargetListItemViewModel[];
  tools: ToolHudViewModel[];
}

export interface SettlementViewModel {
  status: RoundState["status"];
  title: string;
  foundCount: number;
  totalCount: number;
  score: number;
  accuracy01: number;
  timeRemaining: number;
  starRating: 0 | 1 | 2 | 3;
}

export interface RoundViewModel {
  hud: RoundHudViewModel;
  settlement?: SettlementViewModel;
}

export interface RoundViewModelOptions {
  targetTypesById: Map<string, TargetTypeConfig>;
  toolRuntimeState?: ToolRuntimeState;
}

export function createRoundViewModel(
  modeRuntimeConfig: ModeRuntimeConfig,
  state: RoundState,
  options: RoundViewModelOptions,
): RoundViewModel {
  const totalCount = state.selectedTargetIds.length;
  const foundCount = state.foundTargetIds.length;
  const progress01 = totalCount > 0 ? foundCount / totalCount : 0;
  const hud: RoundHudViewModel = {
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
    tools: createToolHudViewModels(modeRuntimeConfig, options.toolRuntimeState),
  };

  return {
    hud,
    settlement:
      state.status === "playing"
        ? undefined
        : createSettlementViewModel(state, totalCount),
  };
}

export function createToolHudViewModels(
  modeRuntimeConfig: ModeRuntimeConfig,
  toolRuntimeState?: ToolRuntimeState,
): ToolHudViewModel[] {
  return modeRuntimeConfig.tools.map((tool) => {
    const state = toolRuntimeState?.toolsById[tool.toolId];
    const usesRemaining = state?.usesRemaining ?? tool.usesPerRound;
    const cooldownSeconds = Math.max(
      0,
      Math.ceil(state?.cooldownRemainingSeconds ?? 0),
    );
    return {
      toolId: tool.toolId,
      usesRemaining,
      cooldownSeconds,
      isCoolingDown: cooldownSeconds > 0 && usesRemaining > 0,
      isDepleted: usesRemaining <= 0,
    };
  });
}

export function createTimerViewModel(
  remainingSeconds: number,
  totalSeconds: number,
): TimerViewModel {
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

export function createSettlementViewModel(
  state: RoundState,
  totalCount: number,
): SettlementViewModel {
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

function createTargetListViewModels(
  modeRuntimeConfig: ModeRuntimeConfig,
  state: RoundState,
  targetTypesById: Map<string, TargetTypeConfig>,
): TargetListItemViewModel[] {
  const requiredCounts = new Map<string, number>();
  const foundCounts = new Map<string, number>();
  const foundTargetIds = new Set(state.foundTargetIds);

  for (const target of modeRuntimeConfig.selectedTargets) {
    requiredCounts.set(target.typeId, (requiredCounts.get(target.typeId) ?? 0) + 1);
    if (foundTargetIds.has(target.targetId)) {
      foundCounts.set(target.typeId, (foundCounts.get(target.typeId) ?? 0) + 1);
    }
  }

  return Array.from(requiredCounts.entries()).map(([typeId, requiredCount]) => {
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

function formatSeconds(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function getTimerUrgency(
  remainingSeconds: number,
): TimerViewModel["urgency"] {
  if (remainingSeconds <= 5) {
    return "critical";
  }

  if (remainingSeconds <= 15) {
    return "warning";
  }

  return "normal";
}

function calculateStarRating(
  status: RoundState["status"],
  foundCount: number,
  totalCount: number,
  accuracy01: number,
): SettlementViewModel["starRating"] {
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

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}
