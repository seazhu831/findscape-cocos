import type { ModeRuntimeConfig } from "../config/gameplay-config";
import type {
  FeedbackPresetConfig,
  GameplayConfig,
  TargetPointConfig,
} from "../config/gameplay-schema";
import type { RoundEvent } from "../gameplay/round-runtime";
import type { ToolEvent } from "../gameplay/tool-runtime";

export type FeedbackPlanKind = "preset" | "settlement";

export interface FeedbackPlan {
  planId: string;
  kind: FeedbackPlanKind;
  sourceEventType: RoundEvent["type"] | ToolEvent["type"];
  feedbackPresetId?: string;
  visuals: string[];
  soundAsset?: string;
  durationMs: number;
  targetId?: string;
  toolId?: string;
  scoreAdded?: number;
  finalScore?: number;
}

export interface FeedbackPlanInput {
  gameplayConfig: GameplayConfig;
  modeRuntimeConfig: ModeRuntimeConfig;
  roundEvents: RoundEvent[];
  toolEvents: ToolEvent[];
}

export function createFeedbackPlans(input: FeedbackPlanInput): FeedbackPlan[] {
  const presetsById = createPresetIndex(input.gameplayConfig.feedbackPresets);
  const plans: FeedbackPlan[] = [];

  for (const event of input.roundEvents) {
    plans.push(
      ...createRoundFeedbackPlans(
        input.modeRuntimeConfig,
        presetsById,
        event,
        plans.length,
      ),
    );
  }

  for (const event of input.toolEvents) {
    plans.push(...createToolFeedbackPlans(presetsById, event, plans.length));
  }

  return plans;
}

function createRoundFeedbackPlans(
  modeRuntimeConfig: ModeRuntimeConfig,
  presetsById: Map<string, FeedbackPresetConfig>,
  event: RoundEvent,
  offset: number,
): FeedbackPlan[] {
  if (event.type === "correctHit") {
    return [
      createPresetPlan({
        planId: createPlanId(offset, event.type),
        sourceEventType: event.type,
        preset: requirePreset(
          presetsById,
          getEffectiveTargetFeedbackPresetId(modeRuntimeConfig, event.target),
        ),
        targetId: event.target.targetId,
        scoreAdded: event.scoreAdded,
      }),
    ];
  }

  if (event.type === "wrongTap" || event.type === "duplicateHit") {
    return [
      createPresetPlan({
        planId: createPlanId(offset, event.type),
        sourceEventType: event.type,
        preset: requirePreset(presetsById, "wrong_tap"),
        targetId: event.type === "duplicateHit" ? event.target.targetId : undefined,
      }),
    ];
  }

  if (event.type === "roundCompleted" || event.type === "roundExpired") {
    return [
      {
        planId: createPlanId(offset, event.type),
        kind: "settlement",
        sourceEventType: event.type,
        visuals: [],
        durationMs: 0,
        finalScore: event.finalScore,
      },
    ];
  }

  return [];
}

function createToolFeedbackPlans(
  presetsById: Map<string, FeedbackPresetConfig>,
  event: ToolEvent,
  offset: number,
): FeedbackPlan[] {
  if (event.type === "hintReveal") {
    return [
      createPresetPlan({
        planId: createPlanId(offset, event.type),
        sourceEventType: event.type,
        preset: requirePreset(presetsById, "hint_reveal"),
        targetId: event.target.targetId,
        toolId: event.toolId,
        durationMs: event.durationSeconds * 1000,
      }),
    ];
  }

  return [];
}

function createPresetPlan(input: {
  planId: string;
  sourceEventType: FeedbackPlan["sourceEventType"];
  preset: FeedbackPresetConfig;
  targetId?: string;
  toolId?: string;
  scoreAdded?: number;
  durationMs?: number;
}): FeedbackPlan {
  return {
    planId: input.planId,
    kind: "preset",
    sourceEventType: input.sourceEventType,
    feedbackPresetId: input.preset.feedbackPresetId,
    visuals: input.preset.visuals,
    soundAsset: input.preset.soundAsset,
    durationMs: input.durationMs ?? input.preset.durationMs,
    targetId: input.targetId,
    toolId: input.toolId,
    scoreAdded: input.scoreAdded,
  };
}

function getEffectiveTargetFeedbackPresetId(
  modeRuntimeConfig: ModeRuntimeConfig,
  target: TargetPointConfig,
): string {
  return (
    modeRuntimeConfig.mode.feedbackOverrides[target.typeId]?.feedbackPresetId ??
    target.feedbackPresetId
  );
}

function createPresetIndex(
  presets: FeedbackPresetConfig[],
): Map<string, FeedbackPresetConfig> {
  const presetsById = new Map<string, FeedbackPresetConfig>();
  for (const preset of presets) {
    presetsById.set(preset.feedbackPresetId, preset);
  }
  return presetsById;
}

function requirePreset(
  presetsById: Map<string, FeedbackPresetConfig>,
  presetId: string,
): FeedbackPresetConfig {
  const preset = presetsById.get(presetId);
  if (!preset) {
    throw new Error(`Unknown feedback preset: ${presetId}`);
  }
  return preset;
}

function createPlanId(offset: number, eventType: string): string {
  return `feedback_${String(offset + 1).padStart(2, "0")}_${eventType}`;
}
