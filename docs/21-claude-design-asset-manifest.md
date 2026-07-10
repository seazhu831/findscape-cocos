# Claude Design Asset Manifest

Issue: https://github.com/seazhu831/findscape-cocos/issues/19

This stage turns the Claude Design asset plan into a machine-readable manifest.

## Manifest

`design/claude-design/asset-manifest.json` records the first demo asset batch:

- Demo Cozy Town map background.
- Target list icons.
- Map target sprites.
- Tool icons.
- HUD reference.
- Feedback reference sheets.
- Audio hook paths from feedback presets.

The manifest keeps all assets in `brief` state until a selected Claude Design export is accepted and normalized.

## Why It Exists

The manifest gives future design and implementation work a stable contract:

- Designers can see exactly which Claude Design briefs to run.
- Runtime paths stay aligned with `demo-gameplay.json`.
- Cocos integration can wait until actual files exist.
- Asset generation stays granular instead of committing broad exploratory dumps.

## Validation

From `cocos/`:

```sh
npm run check:assets
npm run check:all
```

The check validates:

- Manifest version and Claude Design source.
- Unique asset IDs and runtime paths.
- Source brief files exist.
- State-specific source export and runtime file requirements.
- Runtime paths follow the project naming rules.
- Map, target, and tool asset paths from gameplay config are covered.
- Feedback preset and game mode references exist.
- Audio hooks cover configured feedback sound paths.

## Next Step

When a Claude Design output is selected:

1. Place the selected source export under `design/claude-design/source/`.
2. Normalize the runtime PNG/WebP under `cocos/assets/resources/art/`.
3. Update the manifest entry from `brief` to `sourceExport` or `runtimeAsset`.
4. Keep the `runtimePath` stable unless config intentionally changes.

See `docs/22-claude-design-source-intake.md` for the source export naming and promotion rules.
