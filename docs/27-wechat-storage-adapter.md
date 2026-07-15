# WeChat Storage Adapter

Issue: https://github.com/seazhu831/findscape-cocos/issues/35

Runtime binding: https://github.com/seazhu831/findscape-cocos/issues/61

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

## Runtime Selection

`cocos/assets/scripts/platform/runtime-storage.ts` validates the global `wx`
object and selects the WeChat adapter when `getStorage`, `setStorage`, and
`removeStorage` are all available. Other builds use the existing browser
adapter with `sys.localStorage`.

`PortraitRoundScene` logs the selected platform during initialization, loads
the local save before starting a round, and writes the updated save when a
round settles. The release build logged `Using wechat storage` in DevTools, and
the same `findscape.localSave.v1` payload was read before and after a simulator
recompile.

## Validate Fixtures

From `cocos/`:

```sh
npm run check:wechat-storage
```

Remaining validation is a physical-device pass through a preview QR code.
