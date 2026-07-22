# Layered Scene Entity Runtime

Issue: https://github.com/seazhu831/findscape-cocos/issues/70

Stage 4C connects the additive scene entity schema to the portrait Cocos scene.
It keeps world existence, mode target selection, and Cocos node presentation as
separate responsibilities.

## Runtime Flow

```text
gameplay config
  -> SceneEntityRegistry
  -> mode target projection
  -> PortraitSceneEntityBinder
  -> semantic Cocos layer roots
```

`SceneEntityRegistry` is engine-independent. It owns stable entity/target
associations, layer ordering, activation state, found state, and round reset.
Configs without entity sets receive synthetic interactive entities using target
type assets and target positions.

`PortraitSceneEntityBinder` owns Cocos concerns. It creates these map children:

1. `SceneLayer_background`
2. `SceneLayer_staticDecoration`
3. `SceneLayer_ambientActor`
4. `SceneLayer_interactive`
5. `SceneLayer_foregroundOccluder`

The existing map sprite moves under the background root. Existing target nodes
are reused and bound by target/entity ID. A configured entity with no authored
scene node is instantiated from its Resources `SpriteFrame` path.

## Coordinate And Reset Contract

Config positions remain top-left map coordinates. Binder conversion is:

```text
localX = configX - mapWidth / 2
localY = mapHeight / 2 - configY
```

Mode selection calls `projectMode`, and replay calls `resetRound`. Reset restores
configured activation, interaction, scale, and opacity. A correct hit marks the
registry state found before its visual exit feedback starts, preventing semantic
and visual state from drifting apart.

`always` and `nearViewport` entities begin active when visible by default.
`modeSelected` entities activate only when their linked target is selected by
the current mode. Viewport-based throttling for `nearViewport` is deferred to
the diagnostics and scale stage.

## Verification

- `cd cocos && npm run check:all` passes.
- Cocos Creator 3.8.8 completes the Web Mobile build; the known CLI exit code is
  36 after a finished build.
- A `390x844` Web Mobile pass covered mode selection, target rendering, Crime
  Hunt hit and settlement, Replay restoration, and map dragging.
- No new runtime warning or error remained after the final pass.

The first browser pass exposed Cocos transpiling an iterable spread into an
array containing the iterator itself. The registry now uses `Array.from` for
runtime map values, and the fix is included in the final binding commit.

## Current Boundary

All demo modes use one map, so the current scene binder initializes one map
package for the scene lifetime. A future multi-map scene should dispose and
reinitialize the binder when the selected mode changes map. No new art was
needed for this stage.
