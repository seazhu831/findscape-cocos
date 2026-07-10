# Static Web Preview

Issue: https://github.com/seazhu831/findscape-cocos/issues/22

This stage adds a small browser preview before Cocos Creator metadata is available.

## Files

- `cocos/web-preview/index.html`
- `cocos/web-preview/styles.css`
- `cocos/web-preview/preview.js`
- `tools/content/check-web-preview.mjs`

## Purpose

The preview makes the current config visible and clickable:

- Mode selection.
- Placeholder map world.
- Selected target points.
- Circle, rectangle, and polygon hit testing.
- Found count.
- Score.
- Target list counts.

It is not a replacement for the Cocos scene. It is a lightweight way to inspect data and interaction assumptions while the editor project is still blocked on the Cocos Creator version.

## Run

From `cocos/`:

```sh
npm run preview:web
```

Open:

```text
http://127.0.0.1:4173/web-preview/
```

## Verify

From `cocos/`:

```sh
npm run check:web-preview
npm run check:all
```
