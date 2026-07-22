# Focus Camera Runtime

Stage 4E was completed in Issue #72. It replaces the previous map-origin scale
effect with a logical viewport and a cancellable focus-camera state machine.

## Camera Model

`map-viewport.ts` remains the coordinate and clamp foundation. The new
`focus-camera.ts` owns four phases:

- `idle`: map dragging is enabled.
- `focusing`: position and scale animate toward the focused viewport.
- `focused`: the selected region is locked for inspection.
- `restoring`: position and scale animate back to the saved viewport.

The focus transition snapshots the current center and zoom. It multiplies the
current zoom within map limits, clamps the center for the new visible extent,
and preserves that region at the screen center. Restore returns to the exact
pre-focus viewport instead of resetting the map.

Each transition receives a monotonically increasing token. Replay, settlement,
mode change, destruction, or explicit cancellation advances the token and
restores immediately, so delayed Tween callbacks cannot mutate a newer round.

## Cocos Binding

`PortraitRoundScene` now treats logical viewport state as the source of truth:

- map drag calls `panFocusCamera` and applies its clamped viewport;
- one projection method converts map center and zoom into `MapWorld` position
  and scale;
- target and background hit conversion uses the active map dimensions;
- magnifier input begins focus, locks drag, waits for the configured duration,
  and restores through the same state machine;
- Replay and settlement use the shared cancellation path.

The initial zoom covers the full visible canvas without exposing empty space
and preserves the current scene's existing baseline scale. Map config still
supplies world size, center, and zoom limits.

## Verification

Pure fixtures cover:

- preserving a panned region while focusing;
- zoom and map-edge clamping;
- rejecting pan while focused;
- focus and restore round trips;
- invalidating late transition completion after cancellation.

Web Mobile acceptance at `390x844` covered:

- dragging away from map center, then focusing that exact region;
- attempted dragging during focus without viewport movement;
- automatic restoration after the configured four seconds;
- clicking and scoring a pineapple while focused;
- completing the round while focused;
- Replay reset followed by a five-second stale-callback observation;
- Stage 4D sprite-frame and AnimationClip actors rendering under zoom.

`cd cocos && npm run check:all` passes. The Creator Web Mobile build completes
with the known success exit code 36 and no TypeScript build errors.

## Next Dependency

Stage 4F can use the current target sprites and HUD slots. It should create a
cancellable presentation planner before implementing target lift, curved flight,
counter arrival pulse, and the final-target settlement barrier.
