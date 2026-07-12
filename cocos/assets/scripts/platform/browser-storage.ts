import type { KeyValueStoragePort } from "../storage/storage-port";

export interface BrowserStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function createBrowserStoragePort(
  storage: BrowserStorageLike | undefined,
): KeyValueStoragePort {
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
        // Storage quota or privacy-mode failures should not break gameplay.
      }
    },
    async removeItem(key) {
      if (!storage) {
        return;
      }

      try {
        storage.removeItem(key);
      } catch {
        // Ignore platform storage failures; callers can continue with memory state.
      }
    },
  };
}
