# Content Tools

This folder is reserved for content pipeline helpers.

Planned uses:

- Validate map and target config files.
- Convert spreadsheet or editor exports into runtime JSON.
- Normalize Claude Design asset manifests.
- Run consistency checks for asset names, target IDs, and mode references.

Keep tools small and deterministic so they can be run before committing content changes.

## Current Checks

From `cocos/`:

```sh
npm run check:all
```

Individual checks:

- `npm run validate:config`: validate gameplay config references and basic structure.
- `npm run preview:modes`: print selected target counts for each demo mode.
- `npm run check:modes`: validate mode capability summaries for demo variants.
- `npm run check:hit-test`: validate target hit-test geometry fixtures.
- `npm run check:viewport`: validate map viewport coordinate fixtures.
- `npm run check:round`: validate round runtime fixtures.
- `npm run check:view-model`: validate HUD, target-list, timer, and settlement view-model fixtures.
- `npm run check:save`: validate local save fixtures.
- `npm run check:storage`: validate storage port fixtures.
- `npm run check:tools`: validate hint/tool runtime fixtures.
- `npm run check:controller`: validate round controller facade fixtures.
