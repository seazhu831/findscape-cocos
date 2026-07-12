import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(scriptDir, "fixtures/browser-storage-cases.json");
const fixtures = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const failures = [];

for (const fixture of fixtures) {
  const storage = fixture.storageAvailable
    ? createBrowserStorageLike(Boolean(fixture.throws))
    : undefined;
  const port = createBrowserStoragePort(storage);

  for (const step of fixture.steps) {
    if (step.type === "set") {
      await port.setItem(step.key, step.value);
    } else if (step.type === "get") {
      const actualValue = await port.getItem(step.key);
      if (actualValue !== step.expectedValue) {
        failures.push(
          `${fixture.name} expected ${step.key}=${step.expectedValue}, got ${actualValue}`,
        );
      }
    } else if (step.type === "remove") {
      await port.removeItem?.(step.key);
    } else {
      failures.push(`${fixture.name} has unsupported step type: ${step.type}`);
    }
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Validated ${fixtures.length} browser storage fixture groups`);

function createBrowserStoragePort(storage) {
  return {
    async getItem(key) {
      if (!storage) {
        return undefined;
      }

      try {
        return storage.getItem(key) ?? undefined;
      } catch {
        return undefined;
      }
    },
    async setItem(key, value) {
      if (!storage) {
        return;
      }

      try {
        storage.setItem(key, value);
      } catch {
        // Ignore platform storage failures in this adapter contract.
      }
    },
    async removeItem(key) {
      if (!storage) {
        return;
      }

      try {
        storage.removeItem(key);
      } catch {
        // Ignore platform storage failures in this adapter contract.
      }
    },
  };
}

function createBrowserStorageLike(throws) {
  const values = new Map();

  return {
    getItem(key) {
      if (throws) {
        throw new Error("get failed");
      }
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      if (throws) {
        throw new Error("set failed");
      }
      values.set(key, value);
    },
    removeItem(key) {
      if (throws) {
        throw new Error("remove failed");
      }
      values.delete(key);
    },
  };
}
