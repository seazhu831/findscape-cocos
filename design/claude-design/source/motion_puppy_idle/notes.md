# Puppy Idle Source Notes

Accepted from `findscape_motion_batch_v1` on 2026-07-22 for Issue #71.

- Six 512x512 RGBA frames at an authored 8 fps loop.
- `frame_00.png` and `reference_static.png` exactly match the current runtime
  `target_puppy.png` by SHA-256.
- Paw baseline remains pixel-stable across all frames.
- The frame 05 to frame 00 delta is slightly larger than the other adjacent
  transitions. Treat loop smoothness as a visual acceptance item after Cocos
  integration; it does not block the adapter-validation batch.

This source set is provisionally accepted for runtime promotion. Regenerate only
if the in-game 8 fps loop shows a visible tail snap.
