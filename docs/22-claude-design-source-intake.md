# Claude Design Source Intake

Issue: https://github.com/seazhu831/findscape-cocos/issues/21

This stage defines how selected Claude Design outputs enter the repository.

## Lifecycle

Asset states in `design/claude-design/asset-manifest.json` now have stricter meanings:

- `brief`: the asset is planned, but no selected source export is committed.
- `sourceExport`: a selected Claude Design source file exists under `design/claude-design/source/`.
- `runtimeAsset`: the selected source file exists and a normalized runtime file exists under `cocos/assets/resources/`.

## Source Export Rule

Selected source exports live under:

```text
design/claude-design/source/{assetId}/
```

The recommended file name is:

```text
source_{assetId}_{yyyymmdd}_{nn}.png
```

The manifest `sourceFile` is relative to `design/claude-design/`.

Example:

```json
{
  "assetId": "icon_pineapple",
  "state": "sourceExport",
  "sourceFile": "source/icon_pineapple/source_icon_pineapple_20260710_01.png"
}
```

## Runtime Promotion Rule

When the normalized runtime asset is ready, place it under `cocos/assets/resources/` using the manifest `runtimePath`.

Example runtime files accepted by the checker:

```text
cocos/assets/resources/art/icons/icon_pineapple.png
cocos/assets/resources/art/icons/icon_pineapple.webp
```

Then set the manifest state to `runtimeAsset`.

## Validation

From `cocos/`:

```sh
npm run check:assets
```

The checker now verifies:

- `brief` entries do not point at a source file.
- `sourceExport` entries point at an existing source file.
- `runtimeAsset` entries point at an existing source file and an existing runtime file.
- `sourceFile` paths stay inside `design/claude-design/source/`.
