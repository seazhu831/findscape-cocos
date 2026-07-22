# Scene Runtime Diagnostics And Budget

Issue: https://github.com/seazhu831/findscape-cocos/issues/76

Stage 4H adds authored scene regions, viewport-driven activation, an opt-in
runtime overlay, and provisional scale checks around the Stage 4G dense lower
garden. The implementation is complete for automated, Web Mobile, and WeChat
DevTools coverage. Physical-device measurements remain the final calibration
dependency.

## Region Runtime

`SceneRegionConfig` defines a stable `regionId`, map-space bounds, and an
activation margin. Scene entities may reference a region; unassigned entities
retain their existing activation behavior. The runtime projects active regions
from the logical camera viewport, then combines region membership, entity
activation policy, selected targets, and offscreen policy into one visible
entity set.

The Cocos binding refreshes the projection after initial scene setup, map pan,
magnifier focus, exact viewport restore, Replay, and mode changes. Motion plans
are regenerated from the same visible set, so offscreen work does not require
one updater per actor.

## Diagnostics

Append `?sceneDiagnostics=1` to a Web preview URL to enable the overlay. It is
absent by default and reports:

- active regions and active/visible entity counts;
- target and scheduled-motion counts;
- instantiated scene-node count;
- current-frame texture estimate;
- active entity count by semantic layer;
- rolling 120-frame average, P95, and maximum frame time.

At `390x844`, the representative Hidden Object view reported 1/1 active
regions, 13/16 active and visible entities, 4 interactive targets, 3 scheduled
motions, 16 instantiated scene nodes, and a 13.1 MiB current-frame texture
estimate. Under browser instrumentation the stable sample was approximately
16.7 ms average and 27.1 ms P95. These browser timings are regression evidence,
not a substitute for device profiling.

## Provisional Budgets

`tools/content/scene-runtime-budget.json` and `npm run check:scene-budget`
currently enforce:

- at most 150 configured scene entities;
- at most 24 configured motion entities;
- at most 8 selected-target transient feedback nodes;
- at most 96 MiB decoded RGBA art across the current runtime asset set;
- a provisional 33.4 ms P95 frame-time target for device review.

The current static report is 16 entities, 6 motion-linked entities, 1 region,
4 maximum selected targets, and 50 PNGs with a 79.43 MiB decoded RGBA upper
bound. Persistent scene nodes should remain persistent rather than pooled.
Target-flight proxies peak at four for the current modes, below the eight-node
threshold, so a pool would add lifecycle complexity without a measured need.
Revisit pooling when a mode can exceed the threshold or device allocation
traces show collection pauses.

## WeChat Verification

The release WeChat package built with Creator 3.8.8 and passed
`npm run check:wechat-build-output`:

- total generated files: 204;
- total package size: 7,464,274 bytes (7.12 MiB);
- main package: 2,642,808 bytes (2.52 MiB), below the 4 MiB hard limit;
- resources subpackage: 4,821,466 bytes (4.60 MiB), below the 20 MiB hard
  limit.

The package-level regression guard is now 8 MiB to accommodate the accepted
dense assets while preserving platform hard limits as separate checks.

WeChat DevTools loaded the scene in approximately 176 ms, loaded all 5 MP3
clips, selected WeChat storage, rendered the dense Hidden Object mode, and
reported zero project errors. Creator's release engine trimming omits the
`Animation` component when no external clips are configured; motion reset now
guards that optional module while sprite-frame and Tween motion continue to
work. Three remaining console warnings are DevTools/base-library notices.

## Remaining Device Calibration

Use a preview build on at least one representative iPhone before converting
the provisional values into production budgets. Record:

- startup and dense-region interaction smoothness;
- P95 frame time during pan, focus zoom, actor motion, and target flight;
- peak memory and any allocation spikes across Replay;
- audio playback and mute persistence;
- full exit/re-entry save restoration.

Until that pass is recorded, Issue #76 remains open and the budget file keeps
the `provisionalUntilPhysicalDeviceValidation` status.
