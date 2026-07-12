# Static Web Preview

Issue: https://github.com/seazhu831/findscape-cocos/issues/22

This stage adds a small browser preview before Cocos Creator metadata is available.

## Files

- `cocos/web-preview/index.html`
- `cocos/web-preview/styles.css`
- `cocos/web-preview/preview.js`
- `cocos/web-preview/preview-model.mjs`
- `tools/content/check-web-preview.mjs`

## Purpose

The preview makes the current config visible and clickable:

- Mode selection.
- Placeholder map world.
- Drag pan, wheel zoom, and viewport control buttons.
- Selected target points.
- Circle, rectangle, and polygon hit testing.
- Found count.
- Score.
- Playing and complete round status.
- Latest feedback plan summary.
- Target list counts.
- Claude Design asset readiness for the active mode.
- Loading and error states for preview data.

It is not a replacement for the Cocos scene. It is a lightweight way to inspect data and interaction assumptions while the editor project is still blocked on the Cocos Creator version.

## Run

From `cocos/`:

```sh
npm run preview:web
```

Open:

```text
http://127.0.0.1:4173/cocos/web-preview/
```

## Verify

From `cocos/`:

```sh
npm run check:web-preview
npm run check:web-preview-model
npm run check:all
```
