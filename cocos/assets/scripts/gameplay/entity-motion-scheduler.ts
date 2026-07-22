import type {
  MotionProfileConfig,
  MotionVariantConfig,
} from "../config/gameplay-schema";
import type { SceneEntityRuntimeState } from "./scene-entity-runtime";

export const DEFAULT_ACTIVE_MOTION_BUDGET = 24;
export const REDUCED_RATE_PLAYBACK = 0.35;

export interface EntityMotionScheduleOptions {
  visibleEntityIds?: ReadonlySet<string>;
  maxActiveMotions?: number;
}

export interface EntityMotionPlan {
  entityId: string;
  motionProfileId: string;
  variant: MotionVariantConfig;
  startDelayMs: number;
  playbackRate: number;
  offscreen: boolean;
}

export function createEntityMotionSchedule(
  states: SceneEntityRuntimeState[],
  motionProfiles: MotionProfileConfig[],
  options: EntityMotionScheduleOptions = {},
): EntityMotionPlan[] {
  const profilesById = new Map(
    motionProfiles.map((profile) => [profile.motionProfileId, profile]),
  );
  const visibleEntityIds = options.visibleEntityIds;
  const maxActiveMotions = Math.max(
    0,
    Math.floor(options.maxActiveMotions ?? DEFAULT_ACTIVE_MOTION_BUDGET),
  );

  return states
    .filter((state) => state.active && Boolean(state.entity.motionProfileId))
    .map((state) => createCandidate(state, profilesById, visibleEntityIds))
    .filter((plan): plan is EntityMotionPlan => Boolean(plan))
    .sort((left, right) => {
      if (left.offscreen !== right.offscreen) {
        return left.offscreen ? 1 : -1;
      }
      return left.entityId.localeCompare(right.entityId);
    })
    .slice(0, maxActiveMotions);
}

function createCandidate(
  state: SceneEntityRuntimeState,
  profilesById: Map<string, MotionProfileConfig>,
  visibleEntityIds: ReadonlySet<string> | undefined,
): EntityMotionPlan | undefined {
  const motionProfileId = state.entity.motionProfileId;
  if (!motionProfileId) {
    return undefined;
  }
  const profile = profilesById.get(motionProfileId);
  if (!profile || profile.idleVariants.length === 0) {
    return undefined;
  }
  const offscreen = Boolean(
    visibleEntityIds && !visibleEntityIds.has(state.entity.entityId),
  );
  if (offscreen && profile.offscreenPolicy === "pause") {
    return undefined;
  }

  const entityHash = stableHash(state.entity.entityId);
  const variant = profile.idleVariants[entityHash % profile.idleVariants.length];
  const delayMin = profile.startDelayMinMs ?? 0;
  const delayMax = profile.startDelayMaxMs ?? delayMin;
  const delayRange = Math.max(0, delayMax - delayMin);
  const startDelayMs = delayMin + (delayRange > 0 ? entityHash % (delayRange + 1) : 0);

  return {
    entityId: state.entity.entityId,
    motionProfileId,
    variant,
    startDelayMs,
    playbackRate:
      offscreen && profile.offscreenPolicy === "reducedRate"
        ? REDUCED_RATE_PLAYBACK
        : 1,
    offscreen,
  };
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
