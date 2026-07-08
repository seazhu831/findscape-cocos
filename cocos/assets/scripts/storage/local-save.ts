import type { SettlementViewModel } from "../ui/round-view-model";

export interface RoundResultRecord {
  modeId: string;
  status: "completed" | "expired";
  score: number;
  foundCount: number;
  totalCount: number;
  accuracy01: number;
  starRating: 0 | 1 | 2 | 3;
  completedAtUnixMs: number;
}

export interface ModeBestRecord {
  modeId: string;
  bestScore: number;
  bestStarRating: 0 | 1 | 2 | 3;
  bestAccuracy01: number;
  bestFoundCount: number;
  totalCount: number;
  updatedAtUnixMs: number;
}

export interface LocalSaveData {
  version: 1;
  bestByModeId: Record<string, ModeBestRecord>;
  lastResult?: RoundResultRecord;
}

export function createEmptyLocalSave(): LocalSaveData {
  return {
    version: 1,
    bestByModeId: {},
  };
}

export function createRoundResultRecord(
  modeId: string,
  settlement: SettlementViewModel,
  completedAtUnixMs: number,
): RoundResultRecord {
  return {
    modeId,
    status: settlement.status === "completed" ? "completed" : "expired",
    score: settlement.score,
    foundCount: settlement.foundCount,
    totalCount: settlement.totalCount,
    accuracy01: settlement.accuracy01,
    starRating: settlement.starRating,
    completedAtUnixMs,
  };
}

export function applyRoundResultToLocalSave(
  saveData: LocalSaveData,
  result: RoundResultRecord,
): LocalSaveData {
  const existingBest = saveData.bestByModeId[result.modeId];
  const shouldReplaceBest =
    !existingBest ||
    result.score > existingBest.bestScore ||
    (result.score === existingBest.bestScore &&
      result.starRating > existingBest.bestStarRating) ||
    (result.score === existingBest.bestScore &&
      result.starRating === existingBest.bestStarRating &&
      result.accuracy01 > existingBest.bestAccuracy01);

  return {
    version: 1,
    bestByModeId: {
      ...saveData.bestByModeId,
      ...(shouldReplaceBest
        ? {
            [result.modeId]: {
              modeId: result.modeId,
              bestScore: result.score,
              bestStarRating: result.starRating,
              bestAccuracy01: result.accuracy01,
              bestFoundCount: result.foundCount,
              totalCount: result.totalCount,
              updatedAtUnixMs: result.completedAtUnixMs,
            },
          }
        : {}),
    },
    lastResult: result,
  };
}

export function parseLocalSaveData(rawValue: string | undefined): LocalSaveData {
  if (!rawValue) {
    return createEmptyLocalSave();
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (
      parsed?.version !== 1 ||
      !parsed.bestByModeId ||
      typeof parsed.bestByModeId !== "object" ||
      Array.isArray(parsed.bestByModeId)
    ) {
      return createEmptyLocalSave();
    }

    return {
      version: 1,
      bestByModeId: parsed.bestByModeId ?? {},
      lastResult: parsed.lastResult,
    };
  } catch {
    return createEmptyLocalSave();
  }
}

export function serializeLocalSaveData(saveData: LocalSaveData): string {
  return JSON.stringify(saveData);
}
