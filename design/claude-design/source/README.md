# Claude Design Source Exports

This folder stores selected Claude Design outputs only after an export is accepted for possible runtime use.

Do not commit broad exploratory batches. Keep only source files that explain or reproduce a runtime asset decision.

## Directory Shape

Use one folder per manifest asset:

```text
source/
  {assetId}/
    source_{assetId}_{yyyymmdd}_{nn}.png
    notes.md
```

Examples:

```text
source/icon_pineapple/source_icon_pineapple_20260710_01.png
source/map_demo_cozy_town_placeholder/source_map_demo_cozy_town_placeholder_20260710_01.png
```

## Intake Steps

1. Pick one selected Claude Design output for an asset.
2. Place it under `source/{assetId}/`.
3. Add or update `source/{assetId}/notes.md` with prompt changes, acceptance notes, and rejection notes for nearby variants.
4. Update `design/claude-design/asset-manifest.json`:
   - Set `state` to `sourceExport`.
   - Set `sourceFile` to the relative source path, for example `source/icon_pineapple/source_icon_pineapple_20260710_01.png`.
5. Run `npm run check:assets` from `cocos/`.

## Runtime Promotion

After a source export is cropped, resized, checked, and placed under `cocos/assets/resources/art/`, update the manifest:

- Keep `sourceFile` pointing to the selected source export.
- Set `state` to `runtimeAsset`.
- Keep `runtimePath` stable.

The checker accepts these runtime file extensions:

- `.png`
- `.webp`
- `.jpg`
- `.jpeg`

## Rejection Rule

If a generated output is not selected, do not commit it. Record useful rejection notes in the selected asset folder or brief only when they materially guide the next generation pass.
