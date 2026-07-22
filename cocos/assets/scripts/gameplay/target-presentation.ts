import type { TargetPointConfig } from "../config/gameplay-schema";

export const TARGET_LIFT_DURATION_MS = 180;
export const TARGET_FLIGHT_DURATION_MS = 520;
export const TARGET_ARRIVAL_DURATION_MS = 240;

export interface TargetPresentationPlan {
  targetId: string;
  typeId: string;
  token: number;
  liftDurationMs: number;
  flightDurationMs: number;
  arrivalDurationMs: number;
  isFinalTarget: boolean;
}

export interface TargetPresentationState {
  generation: number;
  nextToken: number;
  activeByTargetId: ReadonlyMap<string, TargetPresentationPlan>;
  settlementPending: boolean;
}

export interface TargetPresentationStart {
  state: TargetPresentationState;
  plan?: TargetPresentationPlan;
}

export interface TargetPresentationCompletion {
  state: TargetPresentationState;
  completed: boolean;
  releaseSettlement: boolean;
}

export function createTargetPresentationState(): TargetPresentationState {
  return {
    generation: 0,
    nextToken: 0,
    activeByTargetId: new Map(),
    settlementPending: false,
  };
}

export function startTargetPresentation(
  state: TargetPresentationState,
  target: TargetPointConfig,
  isFinalTarget: boolean,
): TargetPresentationStart {
  if (
    target.triggerBehavior !== "tapToFind" ||
    state.activeByTargetId.has(target.targetId)
  ) {
    return { state };
  }
  const token = state.nextToken + 1;
  const plan: TargetPresentationPlan = {
    targetId: target.targetId,
    typeId: target.typeId,
    token,
    liftDurationMs: TARGET_LIFT_DURATION_MS,
    flightDurationMs: TARGET_FLIGHT_DURATION_MS,
    arrivalDurationMs: TARGET_ARRIVAL_DURATION_MS,
    isFinalTarget,
  };
  const activeByTargetId = new Map(state.activeByTargetId);
  activeByTargetId.set(plan.targetId, plan);
  return {
    state: {
      ...state,
      nextToken: token,
      activeByTargetId,
      settlementPending: state.settlementPending || isFinalTarget,
    },
    plan,
  };
}

export function completeTargetPresentation(
  state: TargetPresentationState,
  targetId: string,
  token: number,
): TargetPresentationCompletion {
  const active = state.activeByTargetId.get(targetId);
  if (!active || active.token !== token) {
    return { state, completed: false, releaseSettlement: false };
  }
  const activeByTargetId = new Map(state.activeByTargetId);
  activeByTargetId.delete(targetId);
  const releaseSettlement =
    state.settlementPending && activeByTargetId.size === 0;
  return {
    state: {
      ...state,
      activeByTargetId,
      settlementPending: releaseSettlement ? false : state.settlementPending,
    },
    completed: true,
    releaseSettlement,
  };
}

export function cancelTargetPresentations(
  state: TargetPresentationState,
): TargetPresentationState {
  return {
    generation: state.generation + 1,
    nextToken: state.nextToken,
    activeByTargetId: new Map(),
    settlementPending: false,
  };
}
