# Static Web Preview

Issue: https://github.com/seazhu831/findscape-cocos/issues/22

This folder contains a small static preview for the demo gameplay config.

It is not a Cocos runtime replacement. It exists so the team can inspect mode selection, map coordinates, target hit areas, target counts, and scoring while the Cocos Creator project metadata is still pending.

## Run

From `cocos/`:

```sh
npm run preview:web
```

Then open:

```text
http://127.0.0.1:4173/cocos/web-preview/
```

## What It Shows

- Mode selection from `assets/resources/config/demo-gameplay.json`.
- A canvas placeholder for the configured map world.
- Drag pan, wheel zoom, and viewport control buttons.
- Selected target points for the active mode.
- Basic click hit testing for circle, rectangle, and polygon targets.
- Found count and score.
- Local best score per mode.
- Playing and complete round status.
- Latest feedback plan, including preset, visuals, sound hook, and settlement events.
- Target list counts by type.
- Claude Design asset batch status and active-mode asset readiness.
- Loading and error states for missing config or manifest data.

## Limits

- It does not load final art assets yet.
- It does not simulate Cocos tween, audio playback, or node lifecycle.
- It is a data and interaction preview only.

## Model Checks

The pure preview state logic lives in `preview-model.mjs`.

From `cocos/`:

```sh
npm run check:web-preview-model
```
