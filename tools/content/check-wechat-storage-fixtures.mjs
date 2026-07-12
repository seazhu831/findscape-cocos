import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(scriptDir, "fixtures/wechat-storage-cases.json");
const fixtures = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const failures = [];

for (const fixture of fixtures) {
  const api = fixture.apiAvailable
    ? createWeChatStorageApi(fixture.initialStorage ?? {}, Boolean(fixture.fails))
    : undefined;
  const port = createWeChatStoragePort(api);

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

console.log(`Validated ${fixtures.length} WeChat storage fixture groups`);

function createWeChatStoragePort(storageApi) {
  return {
    async getItem(key) {
      if (!storageApi) {
        return undefined;
      }

      return new Promise((resolve) => {
        try {
          storageApi.getStorage({
            key,
            success(result) {
              resolve(typeof result.data === "string" ? result.data : undefined);
            },
            fail() {
              resolve(undefined);
            },
          });
        } catch {
          resolve(undefined);
        }
      });
    },
    async setItem(key, value) {
      if (!storageApi) {
        return;
      }

      return new Promise((resolve) => {
        try {
          storageApi.setStorage({
            key,
            data: value,
            success: resolve,
            fail: resolve,
          });
        } catch {
          resolve();
        }
      });
    },
    async removeItem(key) {
      if (!storageApi) {
        return;
      }

      return new Promise((resolve) => {
        try {
          storageApi.removeStorage({
            key,
            success: resolve,
            fail: resolve,
          });
        } catch {
          resolve();
        }
      });
    },
  };
}

function createWeChatStorageApi(initialStorage, fails) {
  const values = new Map(Object.entries(initialStorage));

  return {
    getStorage(options) {
      if (fails || !values.has(options.key)) {
        options.fail?.();
        return;
      }
      options.success?.({ data: values.get(options.key) });
    },
    setStorage(options) {
      if (fails) {
        options.fail?.();
        return;
      }
      values.set(options.key, options.data);
      options.success?.();
    },
    removeStorage(options) {
      if (fails) {
        options.fail?.();
        return;
      }
      values.delete(options.key);
      options.success?.();
    },
  };
}
