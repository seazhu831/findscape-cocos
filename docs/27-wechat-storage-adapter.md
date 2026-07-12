# WeChat Storage Adapter

Issue: https://github.com/seazhu831/findscape-cocos/issues/35

This stage adds a WeChat-style async storage adapter for the existing save storage port.

## Files

- `cocos/assets/scripts/platform/wechat-storage.ts`: wraps `wx.getStorage`, `wx.setStorage`, and `wx.removeStorage`-style APIs.
- `tools/content/fixtures/wechat-storage-cases.json`: deterministic adapter fixtures.
- `tools/content/check-wechat-storage-fixtures.mjs`: Node fixture check.

## Contract

`createWeChatStoragePort(storageApi)` returns the existing `KeyValueStoragePort` shape:

- `getItem`: resolves to a string or `undefined`.
- `setItem`: resolves after the platform write succeeds or fails.
- `removeItem`: resolves after the platform remove succeeds or fails.

Unavailable APIs and callback failures are non-fatal. Reads return `undefined`; writes and removes resolve without throwing so gameplay can continue with in-memory state.

## Validate Fixtures

From `cocos/`:

```sh
npm run check:wechat-storage
```

Current limitation:

- This is only the API adapter. The Cocos/WeChat scene bootstrap still needs to provide the real `wx` object once mini game integration starts.
