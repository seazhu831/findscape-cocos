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
  frameTiming: SceneFrameTiming;
}

export interface SceneFrameTiming {
  sampleCount: number;
  averageFrameTimeMs: number;
  p95FrameTimeMs: number;
  maxFrameTimeMs: number;
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
  frameTiming: SceneFrameTiming;
  activeEntityCountByLayer: Record<SceneLayerId, number>;
}

export class SceneFrameTimeSampler {
  private readonly samples: number[] = [];
  private readonly maxSamples: number;

  constructor(maxSamples = 120) {
    this.maxSamples = maxSamples;
  }

  public add(deltaTimeSeconds: number): void {
    if (!Number.isFinite(deltaTimeSeconds) || deltaTimeSeconds <= 0) {
      return;
    }
    this.samples.push(deltaTimeSeconds * 1000);
    while (this.samples.length > Math.max(1, this.maxSamples)) {
      this.samples.shift();
    }
  }

  public snapshot(): SceneFrameTiming {
    if (this.samples.length === 0) {
      return {
        sampleCount: 0,
        averageFrameTimeMs: 0,
        p95FrameTimeMs: 0,
        maxFrameTimeMs: 0,
      };
    }
    const sorted = [...this.samples].sort((left, right) => left - right);
    const total = this.samples.reduce((sum, sample) => sum + sample, 0);
    return {
      sampleCount: this.samples.length,
      averageFrameTimeMs: total / this.samples.length,
      p95FrameTimeMs: sorted[Math.ceil(sorted.length * 0.95) - 1],
      maxFrameTimeMs: sorted[sorted.length - 1],
    };
  }
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
    frameTiming: input.frameTiming,
    activeEntityCountByLayer,
  };
}
