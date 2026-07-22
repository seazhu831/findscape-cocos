# Thief Idle Source Notes

Accepted from `findscape_motion_batch_v1` on 2026-07-22 for Issue #71.

- Six 512x512 RGBA frames at an authored 8 fps loop.
- `frame_00.png` and `reference_static.png` exactly match the current runtime
  `target_thief.png` by SHA-256.
- The loop delta from frame 05 to frame 00 is within the measured range of its
  other adjacent frame transitions.
- Alpha bounds move by at most two pixels below the declared baseline due to
  breathing-scale antialiasing; feet remain visually planted in the contact
  sheet.

This source set is accepted for runtime promotion and sprite-frame adapter
validation.
