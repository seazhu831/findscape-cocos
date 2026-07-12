# Browser Storage Adapter

Issue: https://github.com/seazhu831/findscape-cocos/issues/34

This stage adds a small browser storage adapter for the existing save storage port.

## Files

- `cocos/assets/scripts/platform/browser-storage.ts`: wraps browser-like `Storage`.
- `tools/content/fixtures/browser-storage-cases.json`: deterministic adapter fixtures.
- `tools/content/check-browser-storage-fixtures.mjs`: Node fixture check.

## Contract

`createBrowserStoragePort(storage)` returns the existing `KeyValueStoragePort` shape:

- `getItem`: returns a string or `undefined`.
- `setItem`: writes a string value when storage is available.
- `removeItem`: removes a value when storage is available.

Unavailable, quota-limited, or privacy-mode storage failures are treated as non-fatal. Reads return `undefined`; writes and removes no-op. Gameplay can continue with in-memory state, and save persistence can be retried by the platform layer later.

## Validate Fixtures

From `cocos/`:

```sh
npm run check:browser-storage
```

Current limitation:

- This adapter targets browser-like storage only. WeChat-specific storage APIs still need a separate adapter once the mini game target is active.
