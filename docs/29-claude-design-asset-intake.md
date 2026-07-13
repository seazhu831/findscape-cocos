# Claude Design Asset Intake

Issue: https://github.com/seazhu831/findscape-cocos/issues/38

Intake date: 2026-07-13

Source package: `~/Downloads/design_handoff_findscape`

## Accepted Assets

The first Claude Design production package has been preserved under `design/claude-design/source/` and promoted to stable runtime paths under `cocos/assets/resources/art/`.

Accepted runtime assets:

- Primary portrait map: `art/maps/demo_cozy_town_placeholder`
- Five target sprites under `art/targets/`
- Five target-list icons and two tool icons under `art/icons/`
- HUD implementation reference: `art/ui/ui_hud_reference`
- Five feedback reference sheets under `art/feedback/`

All 19 manifest entries are now in `runtimeAsset` state. The original portrait and landscape map exports are both preserved; the portrait `_02` export is the selected runtime source.

## Design Audit Trail

The received handoff README, three batch decision notes, two anchor review composites, and icon review contact sheet are preserved under:

```text
design/claude-design/intake/20260713/
```

Review composites and decision notes are not runtime resources.

## Verified Contract

- Primary map: 1600x2400, fully opaque.
- Target sprites: 512x512 with real alpha transparency.
- Target-list and tool icons: 256x256 with real alpha transparency.
- HUD reference: 1080x1920, fully opaque and reference-only.
- Feedback reference sheets: 1024x1024 with real alpha transparency.
- Runtime paths match the existing manifest naming contract.

## Creator Integration Status

Cocos Creator 3.8.8 has imported the accepted runtime assets and generated their `.meta` files. Scene, prefab, atlas, and asset-specific import tuning remain part of the next integration stage.

The accepted primary map changes the map contract from the current 2400x1600 landscape config to a 1600x2400 portrait world. Creator integration must therefore update these together:

- Map `worldSize` and camera framing.
- Seven target coordinates using the portrait anchor set.
- Hit areas and target display scale.
- Viewport and gameplay fixtures.
- Web preview map assumptions.

The handoff anchor coordinates use a top-left origin. For a centered Cocos map node with a 1600x2400 source, the expected conversion is:

```text
cocosX = sourceX - 800
cocosY = 1200 - sourceY
```

Feedback files are four-state reference sheets. Creator integration must slice or reconstruct their visual elements and combine them with particles and tweens; importing a whole sheet as a single effect is not sufficient.

## Validation

From `cocos/`:

```sh
npm run check:assets
npm run report:assets
npm run check:all
```
