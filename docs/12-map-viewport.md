# Map Viewport

# Stage 4B Viewport Core

Issue: https://github.com/seazhu831/findscape-cocos/issues/9

This stage adds the pure viewport math needed before Cocos pan/zoom input is wired.

## Files

- `cocos/assets/scripts/gameplay/map-viewport.ts`: runtime TypeScript helper for map/screen coordinate conversion and viewport state changes.
- `tools/content/fixtures/viewport-cases.json`: deterministic viewport fixtures.
- `tools/content/check-viewport-fixtures.mjs`: Node check for viewport fixture semantics.

## Coordinate Model

- `center`: map-local coordinate currently at the center of the screen.
- `viewSize`: visible screen/canvas size in pixels.
- `mapSize`: full map size in map-local pixels.
- `zoom`: display scale. Larger zoom means less map area is visible.
- `screenToMapPoint`: converts touch/screen coordinates to map-local coordinates.
- `mapToScreenPoint`: converts map-local coordinates to screen coordinates.

## Interaction Semantics

- Screen center maps to viewport center.
- Panning by a screen delta moves the camera center in the opposite direction.
- Zooming at an anchor preserves the map point under that anchor when possible.
- Camera center is clamped so the viewport stays within map bounds.

## Validate Fixtures

From the repository root:

```sh
node tools/content/check-viewport-fixtures.mjs
```

From `cocos/`:

```sh
npm run check:viewport
```

Current limitation:

- Full gesture feel still requires Cocos Creator preview or a Web preview harness.
- TypeScript compilation is not run yet because the local TypeScript/Cocos toolchain is not initialized.
