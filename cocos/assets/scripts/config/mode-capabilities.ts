import type {
  FeedbackPresetId,
  GameModeConfig,
  TargetPointConfig,
  TargetSelectionRule,
  TargetTypeId,
  ToolId,
  TriggerBehavior,
} from "./gameplay-schema";
import type { ModeRuntimeConfig } from "./gameplay-config";

export type ModeCapabilityId =
  | "targetList"
  | "timer"
  | "score"
  | "settlement"
  | "hint"
  | "magnifier"
  | "tapFind"
  | "tapPop"
  | "tapCatch"
  | "dragCatch"
  | "feedbackOverrides";

export interface ModeVariantSummary {
  modeId: string;
  name: string;
  targetSelectionLabel: string;
  selectedTargetCount: number;
  targetTypeIds: TargetTypeId[];
  triggerBehaviors: TriggerBehavior[];
  feedbackPresetIds: FeedbackPresetId[];
  toolIds: ToolId[];
  capabilities: ModeCapabilityId[];
  sharedRuntime: string[];
}

const capabilityOrder: ModeCapabilityId[] = [
  "targetList",
  "timer",
  "score",
  "settlement",
  "hint",
  "magnifier",
  "tapFind",
  "tapPop",
  "tapCatch",
  "dragCatch",
  "feedbackOverrides",
];

const sharedRuntime = [
  "targetSelection",
  "hitTest",
  "roundState",
  "scoring",
  "timer",
  "tools",
  "viewModel",
  "storage",
];

export function createModeVariantSummary(
  runtimeConfig: ModeRuntimeConfig,
): ModeVariantSummary {
  const triggerBehaviors = uniqueSortedByFirstSeen(
    runtimeConfig.selectedTargets.map((target) =>
      resolveTriggerBehavior(runtimeConfig.mode, target),
    ),
  );
  const feedbackPresetIds = uniqueSortedByFirstSeen(
    runtimeConfig.selectedTargets.map((target) =>
      resolveFeedbackPresetId(runtimeConfig.mode, target),
    ),
  );

  return {
    modeId: runtimeConfig.mode.modeId,
    name: runtimeConfig.mode.name,
    targetSelectionLabel: createTargetSelectionLabel(
      runtimeConfig.mode.targetSelectionRule,
    ),
    selectedTargetCount: runtimeConfig.selectedTargets.length,
    targetTypeIds: uniqueSortedByFirstSeen(
      runtimeConfig.selectedTargets.map((target) => target.typeId),
    ),
    triggerBehaviors,
    feedbackPresetIds,
    toolIds: runtimeConfig.tools.map((tool) => tool.toolId),
    capabilities: createCapabilityList(
      runtimeConfig.mode,
      runtimeConfig.tools.map((tool) => tool.toolId),
      triggerBehaviors,
    ),
    sharedRuntime,
  };
}

export function createModeVariantSummaries(
  runtimeConfigs: ModeRuntimeConfig[],
): ModeVariantSummary[] {
  return runtimeConfigs.map((runtimeConfig) =>
    createModeVariantSummary(runtimeConfig),
  );
}

function resolveTriggerBehavior(
  mode: GameModeConfig,
  target: TargetPointConfig,
): TriggerBehavior {
  return mode.feedbackOverrides[target.typeId]?.triggerBehavior
    ?? target.triggerBehavior;
}

function resolveFeedbackPresetId(
  mode: GameModeConfig,
  target: TargetPointConfig,
): FeedbackPresetId {
  return mode.feedbackOverrides[target.typeId]?.feedbackPresetId
    ?? target.feedbackPresetId;
}

function createCapabilityList(
  mode: GameModeConfig,
  toolIds: ToolId[],
  triggerBehaviors: TriggerBehavior[],
): ModeCapabilityId[] {
  const capabilities = new Set<ModeCapabilityId>([
    "targetList",
    "timer",
    "score",
    "settlement",
  ]);

  for (const toolId of toolIds) {
    if (toolId === "hint" || toolId === "magnifier") {
      capabilities.add(toolId);
    }
  }

  for (const triggerBehavior of triggerBehaviors) {
    capabilities.add(toTriggerCapability(triggerBehavior));
  }

  if (Object.keys(mode.feedbackOverrides).length > 0) {
    capabilities.add("feedbackOverrides");
  }

  return capabilityOrder.filter((capability) => capabilities.has(capability));
}

function toTriggerCapability(
  triggerBehavior: TriggerBehavior,
): ModeCapabilityId {
  if (triggerBehavior === "tapToPop") {
    return "tapPop";
  }
  if (triggerBehavior === "tapToCatch") {
    return "tapCatch";
  }
  if (triggerBehavior === "dragToCatch") {
    return "dragCatch";
  }
  return "tapFind";
}

function createTargetSelectionLabel(rule: TargetSelectionRule): string {
  if (rule.type === "byCategoryCounts") {
    return Object.entries(rule.countsByType)
      .map(([typeId, count]) => `${count} ${typeId}`)
      .join(", ");
  }

  if (rule.type === "byTag") {
    return `${rule.count} targets tagged ${rule.tag}`;
  }

  return `all ${rule.typeId}`;
}

function uniqueSortedByFirstSeen<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}
