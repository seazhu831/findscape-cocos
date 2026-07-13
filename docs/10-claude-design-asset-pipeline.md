# Claude Design Asset Pipeline

# Stage 1B Asset Pipeline

Issue: https://github.com/seazhu831/findscape-cocos/issues/7

Claude Design is the preferred source for early design assets. Cocos remains the implementation source of truth.

The production-ready handoff for the first asset batch is available in two forms:

- Editable source: `docs/28-claude-design-asset-handoff.md`
- Shareable PDF: `output/pdf/claude-design-asset-production-handoff.pdf`

Give the PDF to Claude Design and begin with Batch A. Approve the world map and core target visual family before producing icons, HUD references, or feedback sheets.

This pipeline converts generated design output into normalized runtime assets that can be referenced by gameplay config.

## Asset States

Use three states for generated assets:

- Brief: prompt, constraints, references, and acceptance notes.
- Source export: selected output from Claude Design that is worth preserving.
- Runtime asset: normalized file imported by Cocos and referenced by config.

Do not commit large exploratory dumps. Commit selected source exports only when they explain or reproduce a runtime asset decision.

## Directory Plan

```text
design/
  claude-design/
    README.md
    briefs/
      demo-map.md
      target-set.md
      ui-feedback.md
    source/
      .gitkeep
cocos/
  assets/
    resources/
      art/
        maps/
        icons/
        targets/
        ui/
        feedback/
      audio/
```

## Runtime Path Rules

Gameplay config should reference logical runtime paths without file extensions:

- Map backgrounds: `art/maps/{map_id}`
- Target icons: `art/icons/icon_{target_type}`
- Target sprites: `art/targets/target_{target_type}`
- Tool icons: `art/icons/tool_{tool_id}`
- UI: `art/ui/{screen_or_component}_{state}`
- Feedback: `art/feedback/{feedback_preset}_{frame_or_state}`

These paths match the current demo config in `cocos/assets/resources/config/demo-gameplay.json`.

## Naming Rules

- Use lowercase snake case.
- Include semantic role first: `icon_`, `target_`, `tool_`, `map_`, `ui_`, `feedback_`.
- Avoid temporary words such as `final`, `new`, `copy`, and `v2` in runtime names.
- Keep iteration numbers only in source exports, not normalized runtime paths.
- Keep config IDs stable even if art is regenerated.

## Recommended Dimensions

Initial dimensions are intentionally practical placeholders. Adjust after Cocos preview and memory checks.

- Demo map background: `2400x1600` PNG or WebP, 2x-ready source preferred.
- Target sprite source: square `512x512` transparent PNG.
- Target icon: square `256x256` transparent PNG.
- Tool icon: square `256x256` transparent PNG.
- UI mock: portrait `1080x1920` PNG.
- Feedback sprite strip or frame source: `1024x1024` transparent PNG or separate square frames.
- Share image draft: `1200x960` PNG.

## Visual Direction

Keep generated assets aligned with the PRD:

- Cozy hand-drawn style.
- Soft lines.
- Warm but not monochrome palette.
- Cute simplified shapes.
- No aggressive sharp forms.
- Clear object silhouettes at mobile scale.
- Hidden objects should be findable, not invisible.

## Normalization Checklist

Before a generated asset is referenced by config:

- Crop transparent padding.
- Confirm expected dimensions.
- Confirm file name follows runtime path naming.
- Confirm object remains readable at target mobile scale.
- Confirm no text is baked into gameplay-critical art unless localization is impossible.
- Confirm the asset has no unwanted watermark or UI chrome.
- Place it under the matching `cocos/assets/resources/art/` subfolder.
- Update config references only after the runtime file exists.

## Manifest Fields

When a source export is selected for runtime use, record it in a manifest or brief note:

- `assetId`
- `sourceBrief`
- `sourceFile`
- `runtimePath`
- `dimensions`
- `transparentBackground`
- `intendedUse`
- `configReferences`
- `notes`

The current machine-readable manifest lives at:

- `design/claude-design/asset-manifest.json`

Validate it from `cocos/` with:

```sh
npm run check:assets
```

Report config asset readiness from `cocos/` with:

```sh
npm run report:assets
```

This report is informational. It should show brief-only entries while Claude Design exports are still pending, and runtime files as they are normalized into `cocos/assets/resources/art/`.

## First Asset Batch

The first batch should unblock Stage 4:

- `art/maps/demo_cozy_town_placeholder`
- `art/icons/icon_pineapple`
- `art/icons/icon_balloon`
- `art/icons/icon_thief`
- `art/icons/icon_puppy`
- `art/icons/icon_gem`
- `art/targets/target_pineapple`
- `art/targets/target_balloon`
- `art/targets/target_thief`
- `art/targets/target_puppy`
- `art/targets/target_gem`
- `art/icons/tool_hint`
- `art/icons/tool_magnifier`

Feedback and audio can remain hook-only until the core map interaction works.
