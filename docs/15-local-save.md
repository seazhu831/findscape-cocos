# Local Save

# Stage 5B Local Save Boundary

Issue: https://github.com/seazhu831/findscape-cocos/issues/13

This stage adds the pure save-data logic for local progress before platform storage is wired.

## Files

- `cocos/assets/scripts/storage/local-save.ts`: runtime TypeScript helpers for save data.
- `tools/content/fixtures/local-save-cases.json`: deterministic save fixtures.
- `tools/content/check-local-save-fixtures.mjs`: Node check for save fixture semantics.

## Responsibilities

The local save helpers handle:

- Creating an empty save.
- Parsing invalid or missing raw save data safely.
- Serializing save data.
- Recording the latest round result.
- Updating mode-specific best score records.

## Best Record Rules

A new result replaces the best record for a mode when:

- It has a higher score.
- It ties score but has a higher star rating.
- It ties score and star rating but has higher accuracy.

Lower results still update `lastResult`.

## Platform Boundary

This module does not call browser, WeChat, Cocos, or native storage APIs directly. Platform-specific adapters should own the actual read/write calls and pass raw JSON strings through these helpers.

## Validate Fixtures

From the repository root:

```sh
node tools/content/check-local-save-fixtures.mjs
```

From `cocos/`:

```sh
npm run check:save
```
