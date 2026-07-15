import type { FeedbackPlan } from "./feedback-runtime";

export const DEFAULT_FEEDBACK_VOLUME = 0.65;

export interface AudioPlaybackCommand {
  planId: string;
  soundAsset: string;
  volume: number;
}

export function createAudioPlaybackCommands(
  plans: readonly FeedbackPlan[],
  volume = DEFAULT_FEEDBACK_VOLUME,
): AudioPlaybackCommand[] {
  const safeVolume = Math.min(1, Math.max(0, volume));
  return plans.flatMap((plan) =>
    plan.kind === "preset" && plan.soundAsset
      ? [{ planId: plan.planId, soundAsset: plan.soundAsset, volume: safeVolume }]
      : [],
  );
}
