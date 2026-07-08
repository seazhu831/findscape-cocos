import type { ModeRuntimeConfig } from "../config/gameplay-config";
import { calculateCorrectHitScore } from "../config/gameplay-config";
import type { TargetPointConfig, Vector2Config } from "../config/gameplay-schema";
import type { HitTestOptions } from "./target-hit-test";
import { isPointInTargetHitArea } from "./target-hit-test";

export type RoundStatus = "playing" | "completed" | "expired";

export interface RoundState {
  modeId: string;
  status: RoundStatus;
  selectedTargetIds: string[];
  foundTargetIds: string[];
  score: number;
  comboStreak: number;
  correctHits: number;
  wrongTaps: number;
  elapsedSeconds: number;
  remainingSeconds: number;
}

export type RoundEvent =
  | {
      type: "correctHit";
      target: TargetPointConfig;
      scoreAdded: number;
      isRoundComplete: boolean;
    }
  | {
      type: "duplicateHit";
      target: TargetPointConfig;
    }
  | {
      type: "wrongTap";
      penalty: number;
    }
  | {
      type: "roundCompleted";
      finalScore: number;
    }
  | {
      type: "roundExpired";
      finalScore: number;
    };

export interface RoundUpdate {
  state: RoundState;
  events: RoundEvent[];
}

export function createRoundState(
  modeRuntimeConfig: ModeRuntimeConfig,
): RoundState {
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

export function applyRoundTap(
  modeRuntimeConfig: ModeRuntimeConfig,
  state: RoundState,
  mapPoint: Vector2Config,
  hitTestOptions: HitTestOptions = {},
): RoundUpdate {
  if (state.status !== "playing") {
    return {
      state,
      events: [],
    };
  }

  const hitTarget = findHitTarget(
    modeRuntimeConfig.selectedTargets,
    mapPoint,
    hitTestOptions,
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
  const nextState: RoundState = {
    ...state,
    status: isRoundComplete ? "completed" : "playing",
    foundTargetIds,
    score,
    comboStreak,
    correctHits: state.correctHits + 1,
  };
  const events: RoundEvent[] = [
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
    state: nextState,
    events,
  };
}

export function advanceRoundTime(
  state: RoundState,
  deltaSeconds: number,
): RoundState {
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

export function applyRoundTimeDelta(
  state: RoundState,
  deltaSeconds: number,
): RoundUpdate {
  const nextState = advanceRoundTime(state, deltaSeconds);

  if (state.status === "playing" && nextState.status === "expired") {
    return {
      state: nextState,
      events: [
        {
          type: "roundExpired",
          finalScore: nextState.score,
        },
      ],
    };
  }

  return {
    state: nextState,
    events: [],
  };
}

export function expireRound(state: RoundState): RoundUpdate {
  if (state.status !== "playing") {
    return {
      state,
      events: [],
    };
  }

  const nextState: RoundState = {
    ...state,
    status: "expired",
    remainingSeconds: 0,
  };

  return {
    state: nextState,
    events: [
      {
        type: "roundExpired",
        finalScore: nextState.score,
      },
    ],
  };
}

function findHitTarget(
  selectedTargets: TargetPointConfig[],
  mapPoint: Vector2Config,
  hitTestOptions: HitTestOptions,
): TargetPointConfig | undefined {
  return selectedTargets.find((target) =>
    isPointInTargetHitArea(target, mapPoint, hitTestOptions),
  );
}
