import type {
  GameModeConfig,
  GameplayConfig,
  MapConfig,
  ScoringRuleConfig,
  TargetPointConfig,
  TargetPointSetConfig,
  TargetTypeConfig,
  ToolConfig,
} from "./gameplay-schema";

export interface GameplayConfigIndex {
  mapsById: Map<string, MapConfig>;
  targetTypesById: Map<string, TargetTypeConfig>;
  targetPointSetsById: Map<string, TargetPointSetConfig>;
  scoringRulesById: Map<string, ScoringRuleConfig>;
  toolsById: Map<string, ToolConfig>;
  gameModesById: Map<string, GameModeConfig>;
}

export interface ModeRuntimeConfig {
  mode: GameModeConfig;
  map: MapConfig;
  targetPointSet: TargetPointSetConfig;
  scoringRule: ScoringRuleConfig;
  tools: ToolConfig[];
  selectedTargets: TargetPointConfig[];
}

export interface CorrectHitScoreInput {
  target: TargetPointConfig;
  scoringRule: ScoringRuleConfig;
  comboStreak: number;
  secondsRemaining: number;
  isRoundComplete: boolean;
}

export function createGameplayConfigIndex(
  config: GameplayConfig,
): GameplayConfigIndex {
  return {
    mapsById: mapById(config.maps, "mapId"),
    targetTypesById: mapById(config.targetTypes, "typeId"),
    targetPointSetsById: mapById(config.targetPointSets, "targetPointSetId"),
    scoringRulesById: mapById(config.scoringRules, "scoringRuleId"),
    toolsById: mapById(config.tools, "toolId"),
    gameModesById: mapById(config.gameModes, "modeId"),
  };
}

export function createModeRuntimeConfig(
  index: GameplayConfigIndex,
  modeId: string,
): ModeRuntimeConfig {
  const mode = requireById(index.gameModesById, modeId, "game mode");
  const map = requireById(index.mapsById, mode.mapId, "map");
  const targetPointSet = requireById(
    index.targetPointSetsById,
    map.targetPointSetId,
    "target point set",
  );
  const scoringRule = requireById(
    index.scoringRulesById,
    mode.scoringRuleId,
    "scoring rule",
  );
  const tools = mode.toolIds.map((toolId) =>
    requireById(index.toolsById, toolId, "tool"),
  );
  const selectedTargets = selectTargetsForMode(mode, targetPointSet.targetPoints);

  return {
    mode,
    map,
    targetPointSet,
    scoringRule,
    tools,
    selectedTargets,
  };
}

export function selectTargetsForMode(
  mode: GameModeConfig,
  targetPoints: TargetPointConfig[],
): TargetPointConfig[] {
  const rule = mode.targetSelectionRule;

  if (rule.type === "byCategoryCounts") {
    const selected: TargetPointConfig[] = [];
    for (const [typeId, count] of Object.entries(rule.countsByType)) {
      selected.push(
        ...targetPoints
          .filter((targetPoint) => targetPoint.typeId === typeId)
          .slice(0, count),
      );
    }
    return selected;
  }

  if (rule.type === "byTag") {
    return targetPoints
      .filter((targetPoint) => targetPoint.tags.includes(rule.tag))
      .slice(0, rule.count);
  }

  if (rule.type === "allOfType") {
    return targetPoints.filter(
      (targetPoint) => targetPoint.typeId === rule.typeId,
    );
  }

  return [];
}

export function calculateCorrectHitScore(
  input: CorrectHitScoreInput,
): number {
  const baseScore =
    input.target.reward.score || input.scoringRule.correctHitScore;
  const comboBonus = Math.min(
    input.comboStreak * input.scoringRule.combo.bonusPerStreak,
    input.scoringRule.combo.maxBonus,
  );
  const timeBonus = input.isRoundComplete
    ? Math.min(
        input.secondsRemaining *
          input.scoringRule.timeBonus.pointsPerSecondRemaining,
        input.scoringRule.timeBonus.maxBonus,
      )
    : 0;

  return baseScore + comboBonus + timeBonus;
}

function mapById<T extends object>(
  items: T[],
  idField: keyof T,
): Map<string, T> {
  const mapped = new Map<string, T>();
  for (const item of items) {
    const id = item[idField];
    if (typeof id === "string") {
      mapped.set(id, item);
    }
  }
  return mapped;
}

function requireById<T>(
  mapped: Map<string, T>,
  id: string,
  label: string,
): T {
  const item = mapped.get(id);
  if (!item) {
    throw new Error(`Unknown ${label}: ${id}`);
  }
  return item;
}
