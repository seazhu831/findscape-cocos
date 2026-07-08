import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const LOCAL_SAVE_STORAGE_KEY = "findscape.localSave.v1";
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(scriptDir, "fixtures/storage-port-cases.json");
const fixtures = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const failures = [];

for (const fixture of fixtures) {
  const storagePort = createMemoryStoragePort(
    fixture.initialStorage ?? {},
    Boolean(fixture.throwsOnGet),
  );
  const options = fixture.storageKey ? { storageKey: fixture.storageKey } : {};
  let actualSave;

  if (fixture.operation === "load") {
    actualSave = await loadLocalSaveFromStorage(storagePort, options);
  } else if (fixture.operation === "applyResult") {
    actualSave = await applyRoundResultToStorage(
      storagePort,
      fixture.result,
      options,
    );
  } else if (fixture.operation === "clear") {
    await clearLocalSaveStorage(storagePort, options);
  } else {
    failures.push(`${fixture.name} has unsupported operation: ${fixture.operation}`);
    continue;
  }

  if (fixture.expectedSave) {
    assertPartialObject(fixture.name, "save", actualSave, fixture.expectedSave);
  }

  if (fixture.expectedStorage) {
    assertExpectedStorage(fixture.name, storagePort.dump(), fixture.expectedStorage);
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Validated ${fixtures.length} storage port fixture groups`);

function createMemoryStoragePort(initialStorage, throwsOnGet) {
  const storage = new Map(Object.entries(initialStorage));

  return {
    async getItem(key) {
      if (throwsOnGet) {
        throw new Error("read failed");
      }
      return storage.get(key);
    },
    async setItem(key, value) {
      storage.set(key, value);
    },
    async removeItem(key) {
      storage.delete(key);
    },
    dump() {
      return Object.fromEntries(storage.entries());
    },
  };
}

async function loadLocalSaveFromStorage(storagePort, options = {}) {
  const storageKey = options.storageKey ?? LOCAL_SAVE_STORAGE_KEY;

  try {
    return parseLocalSaveData(await storagePort.getItem(storageKey));
  } catch {
    return createEmptyLocalSave();
  }
}

async function saveLocalSaveToStorage(storagePort, saveData, options = {}) {
  const storageKey = options.storageKey ?? LOCAL_SAVE_STORAGE_KEY;
  await storagePort.setItem(storageKey, serializeLocalSaveData(saveData));
}

async function applyRoundResultToStorage(storagePort, result, options = {}) {
  const currentSave = await loadLocalSaveFromStorage(storagePort, options);
  const nextSave = applyRoundResultToLocalSave(currentSave, result);
  await saveLocalSaveToStorage(storagePort, nextSave, options);
  return nextSave;
}

async function clearLocalSaveStorage(storagePort, options = {}) {
  const storageKey = options.storageKey ?? LOCAL_SAVE_STORAGE_KEY;

  if (storagePort.removeItem) {
    await storagePort.removeItem(storageKey);
    return;
  }

  await storagePort.setItem(storageKey, serializeLocalSaveData(createEmptyLocalSave()));
}

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

function assertExpectedStorage(groupName, actualStorage, expectedStorage) {
  const actualKeys = Object.keys(actualStorage);
  const expectedKeys = Object.keys(expectedStorage);

  if (actualKeys.length !== expectedKeys.length) {
    failures.push(
      `${groupName} expected storage keys [${expectedKeys.join(", ")}] but got [${actualKeys.join(", ")}]`,
    );
    return;
  }

  for (const [key, expectedValue] of Object.entries(expectedStorage)) {
    const rawActual = actualStorage[key];
    if (rawActual === undefined) {
      failures.push(`${groupName} expected storage key ${key}`);
      continue;
    }

    assertPartialObject(
      groupName,
      `storage.${key}`,
      parseLocalSaveData(rawActual),
      expectedValue,
    );
  }
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
