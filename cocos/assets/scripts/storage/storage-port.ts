import {
  applyRoundResultToLocalSave,
  createEmptyLocalSave,
  parseLocalSaveData,
  serializeLocalSaveData,
  type LocalSaveData,
  type RoundResultRecord,
} from "./local-save";

export const LOCAL_SAVE_STORAGE_KEY = "findscape.localSave.v1";

export interface KeyValueStoragePort {
  getItem(key: string): Promise<string | undefined>;
  setItem(key: string, value: string): Promise<void>;
  removeItem?(key: string): Promise<void>;
}

export interface LocalSaveStorageOptions {
  storageKey?: string;
}

export async function loadLocalSaveFromStorage(
  storagePort: KeyValueStoragePort,
  options: LocalSaveStorageOptions = {},
): Promise<LocalSaveData> {
  const storageKey = options.storageKey ?? LOCAL_SAVE_STORAGE_KEY;

  try {
    return parseLocalSaveData(await storagePort.getItem(storageKey));
  } catch {
    return createEmptyLocalSave();
  }
}

export async function saveLocalSaveToStorage(
  storagePort: KeyValueStoragePort,
  saveData: LocalSaveData,
  options: LocalSaveStorageOptions = {},
): Promise<void> {
  const storageKey = options.storageKey ?? LOCAL_SAVE_STORAGE_KEY;
  await storagePort.setItem(storageKey, serializeLocalSaveData(saveData));
}

export async function applyRoundResultToStorage(
  storagePort: KeyValueStoragePort,
  result: RoundResultRecord,
  options: LocalSaveStorageOptions = {},
): Promise<LocalSaveData> {
  const currentSave = await loadLocalSaveFromStorage(storagePort, options);
  const nextSave = applyRoundResultToLocalSave(currentSave, result);
  await saveLocalSaveToStorage(storagePort, nextSave, options);
  return nextSave;
}

export async function clearLocalSaveStorage(
  storagePort: KeyValueStoragePort,
  options: LocalSaveStorageOptions = {},
): Promise<void> {
  const storageKey = options.storageKey ?? LOCAL_SAVE_STORAGE_KEY;

  if (storagePort.removeItem) {
    await storagePort.removeItem(storageKey);
    return;
  }

  await storagePort.setItem(
    storageKey,
    serializeLocalSaveData(createEmptyLocalSave()),
  );
}
