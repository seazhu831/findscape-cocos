import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(scriptDir, "fixtures/local-save-cases.json");
const fixtures = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const failures = [];

for (const fixture of fixtures) {
  let actual;

  if (Object.hasOwn(fixture, "rawValue")) {
    actual = parseLocalSaveData(fixture.rawValue ?? undefined);
  } else {
    actual = applyRoundResultToLocalSave(fixture.initialSave, fixture.result);
  }

  assertPartialObject(fixture.name, "save", actual, fixture.expectedSave);

  const reparsed = parseLocalSaveData(serializeLocalSaveData(actual));
  assertPartialObject(fixture.name, "serialized save", reparsed, fixture.expectedSave);
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Validated ${fixtures.length} local save fixture groups`);

function createEmptyLocalSave() {
  return {
    version: 1,
    bestByModeId: {},
  };
}

function applyRoundResultToLocalSave(saveData, result) {
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

function parseLocalSaveData(rawValue) {
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

function serializeLocalSaveData(saveData) {
  return JSON.stringify(saveData);
}

function assertPartialObject(groupName, label, actual, expected) {
  if (!actual) {
    failures.push(`${groupName} expected ${label} but got none`);
    return;
  }

  for (const [field, expectedValue] of Object.entries(expected)) {
    const actualValue = actual[field];
    if (isObject(expectedValue)) {
      assertPartialObject(groupName, `${label}.${field}`, actualValue, expectedValue);
    } else if (actualValue !== expectedValue) {
      failures.push(
        `${groupName} expected ${label}.${field}=${expectedValue} but got ${actualValue}`,
      );
    }
  }
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
