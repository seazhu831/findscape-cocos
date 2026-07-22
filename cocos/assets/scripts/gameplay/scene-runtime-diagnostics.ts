import type {
  SceneLayerId,
  SceneRegionConfig,
} from "../config/gameplay-schema";
import type { EntityMotionPlan } from "./entity-motion-scheduler";
import type { SceneEntityRuntimeState } from "./scene-entity-runtime";

const DIAGNOSTIC_LAYER_ORDER: SceneLayerId[] = [
  "background",
  "staticDecoration",
  "ambientActor",
  "interactive",
  "foregroundOccluder",
];

export interface SceneRuntimeDiagnosticsInput {
  states: SceneEntityRuntimeState[];
  regions: SceneRegionConfig[];
  activeRegionIds: ReadonlySet<string>;
  visibleEntityIds: ReadonlySet<string>;
  motionPlans: EntityMotionPlan[];
  instantiatedNodeCount: number;
  residentTextureBytesEstimate: number;
}

export interface SceneRuntimeDiagnosticsSnapshot {
  regionCount: number;
  activeRegionCount: number;
  activeRegionIds: string[];
  entityCount: number;
  activeEntityCount: number;
  visibleEntityCount: number;
  interactiveEntityCount: number;
  foundTargetCount: number;
  scheduledMotionCount: number;
  offscreenMotionCount: number;
  instantiatedNodeCount: number;
  residentTextureBytesEstimate: number;
  activeEntityCountByLayer: Record<SceneLayerId, number>;
}

export function createSceneRuntimeDiagnosticsSnapshot(
  input: SceneRuntimeDiagnosticsInput,
): SceneRuntimeDiagnosticsSnapshot {
  const activeStates = input.states.filter((state) => state.active);
  const activeEntityCountByLayer = Object.fromEntries(
    DIAGNOSTIC_LAYER_ORDER.map((layer) => [
      layer,
      activeStates.filter((state) => state.entity.render.layer === layer).length,
    ]),
  ) as Record<SceneLayerId, number>;
  return {
    regionCount: input.regions.length,
    activeRegionCount: input.activeRegionIds.size,
    activeRegionIds: [...input.activeRegionIds].sort(),
    entityCount: input.states.length,
    activeEntityCount: activeStates.length,
    visibleEntityCount: activeStates.filter((state) =>
      input.visibleEntityIds.has(state.entity.entityId),
    ).length,
    interactiveEntityCount: activeStates.filter((state) => state.interactive)
      .length,
    foundTargetCount: input.states.filter((state) => state.found).length,
    scheduledMotionCount: input.motionPlans.length,
    offscreenMotionCount: input.motionPlans.filter((plan) => plan.offscreen).length,
    instantiatedNodeCount: Math.max(0, Math.floor(input.instantiatedNodeCount)),
    residentTextureBytesEstimate: Math.max(
      0,
      Math.floor(input.residentTextureBytesEstimate),
    ),
    activeEntityCountByLayer,
  };
}
