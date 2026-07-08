# Hit Testing

# Stage 4A Hit-test Core

Issue: https://github.com/seazhu831/findscape-cocos/issues/8

This stage adds the geometry core needed for target tapping before the Cocos scene is available.

## Files

- `cocos/assets/scripts/gameplay/target-hit-test.ts`: runtime TypeScript helper for target hit areas.
- `tools/content/fixtures/hit-test-cases.json`: deterministic geometry fixtures.
- `tools/content/check-hit-test-fixtures.mjs`: Node check for fixture semantics.

## Supported Shapes

- `circle`: point is inside when squared distance from target center is within radius.
- `rectangle`: point is inside when local x/y is within half width/height.
- `polygon`: point is inside by ray-casting against local polygon offsets.
- `spriteBounds`: point is inside sprite width/height plus padding, with bounds supplied by runtime options.

## Coordinate Convention

Hit testing uses the same map-local coordinates as gameplay config:

- Target `position` is in map-local world coordinates.
- Incoming pointer/touch point should be converted into the same map-local coordinates before hit testing.
- Polygon points are local offsets from `position`.

## Validate Fixtures

From the repository root:

```sh
node tools/content/check-hit-test-fixtures.mjs
```

Current limitation:

- TypeScript compilation is not run yet because the local environment does not have `tsc`, `ts-node`, `tsx`, or initialized Cocos TypeScript tooling.
