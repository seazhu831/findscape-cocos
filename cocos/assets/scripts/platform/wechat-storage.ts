import type { KeyValueStoragePort } from "../storage/storage-port";

export interface WeChatStorageApi {
  getStorage(options: {
    key: string;
    success?: (result: { data?: unknown }) => void;
    fail?: () => void;
  }): void;
  setStorage(options: {
    key: string;
    data: string;
    success?: () => void;
    fail?: () => void;
  }): void;
  removeStorage(options: {
    key: string;
    success?: () => void;
    fail?: () => void;
  }): void;
}

export function createWeChatStoragePort(
  storageApi: WeChatStorageApi | undefined,
): KeyValueStoragePort {
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
