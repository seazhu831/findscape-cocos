# Target Collection Presentation

Stage 4F was completed in Issue #73. It adds a cancellable target collection
presentation and prevents final settlement from covering in-flight feedback.

## Pure Planner

`target-presentation.ts` owns presentation tokens, active target plans, and the
settlement barrier. `tapToFind` targets receive a three-phase plan:

- 180 ms lift;
- 520 ms arced flight;
- 240 ms HUD arrival and fade.

Balloon pop and thief catch behaviors keep their existing mode-specific
feedback. Multiple find targets can be active concurrently. If the final target
is hit while earlier targets are still flying, settlement remains pending until
the active set becomes empty.

Replay, mode change, and scene reset cancel all plans, advance the generation,
clear the settlement barrier, and reject stale completion callbacks.

## Cocos Presentation

`PortraitTargetPresentation` clones the current `SceneEntityVisual` SpriteFrame
into a full-screen presentation root. It captures the source world position and
scale before settlement restores a focused camera, then:

1. lifts and slightly enlarges the proxy;
2. moves it through a raised midpoint toward the HUD;
3. shrinks and fades it at the arrival node;
4. destroys the proxy and completes its planner token.

The semantic target node is hidden after the proxy is created. Hit coordinates
and reusable entity state are not animated.

## HUD Contract

`PortraitHud` exposes a stable arrival node for each target type. An expanded
target panel returns the matching slot. A collapsed panel returns the central
panel toggle, so collection feedback does not reopen an obstructive HUD band.

Counts for active presentations are held at their previous values. The count
changes only after the arrival pulse completes. Score and combo remain
authoritative and update immediately.

## Settlement Barrier

The session can enter its authoritative settlement state as soon as the final
hit is scored. `PortraitRoundScene` suppresses only the settlement overlay while
the planner reports `settlementPending`. Timer updates stop, save data is
written, camera focus is cancelled, and ambient motion stops through their
existing paths. The overlay appears after all collection proxies complete.

## Verification

Pure fixtures cover supported and unsupported trigger behavior, timings,
concurrent final-target barriers, stale completions, and cancellation.

Web Mobile acceptance at `390x844` covered:

- pineapple lift, arced flight, arrival, and delayed count update;
- three concurrent target presentations;
- final settlement remaining hidden until the last proxy completes;
- collapsed target-panel fallback to the central toggle;
- source capture and flight while the Stage 4E focus camera is active;
- puppy and gem collection using their current animated/static visuals.

`cd cocos && npm run check:all` passes. The Creator Web Mobile build completes
with the known success exit code 36 and no TypeScript build errors.

## Next Dependency

Stage 4G needs one focused Claude Design dense-region batch: background region,
static clutter, ambient actors, hidden targets, and foreground occluders with
explicit depth and concealment metadata. Runtime contracts are now stable enough
to write that handoff without guessing implementation limits.
