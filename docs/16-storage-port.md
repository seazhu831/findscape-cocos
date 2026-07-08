# Storage Port

# Stage 5C Storage Port Boundary

Issue: https://github.com/seazhu831/findscape-cocos/issues/14

This stage adds a platform-neutral storage boundary for local save data.

## Files

- `cocos/assets/scripts/storage/storage-port.ts`: runtime TypeScript storage port helpers.
- `tools/content/fixtures/storage-port-cases.json`: deterministic storage port fixtures.
- `tools/content/check-storage-port-fixtures.mjs`: Node check for storage port fixture semantics.

## Port Shape

Platform-specific storage adapters should implement:

```ts
interface KeyValueStoragePort {
  getItem(key: string): Promise<string | undefined>;
  setItem(key: string, value: string): Promise<void>;
  removeItem?(key: string): Promise<void>;
}
```

This can wrap browser `localStorage`, Cocos `sys.localStorage`, WeChat storage, or a future cloud-backed cache.

## Helpers

- `loadLocalSaveFromStorage`: reads and parses save data, falling back to an empty save if missing or invalid.
- `saveLocalSaveToStorage`: serializes and writes save data.
- `applyRoundResultToStorage`: loads, applies a round result, saves, and returns the updated save.
- `clearLocalSaveStorage`: removes the save key when possible or writes an empty save fallback.

## Storage Key

Default key:

```text
findscape.localSave.v1
```

Callers can override it through `storageKey` for tests, profiles, or future migration flows.

## Validate Fixtures

From the repository root:

```sh
node tools/content/check-storage-port-fixtures.mjs
```

From `cocos/`:

```sh
npm run check:storage
```

Current limitation:

- This is a platform-neutral boundary only. Browser, WeChat, and Cocos concrete adapters should be added after the runtime target is available.
