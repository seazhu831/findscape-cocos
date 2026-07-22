# Motion Batch Acceptance

Issue: https://github.com/seazhu831/findscape-cocos/issues/71

Source package: `~/Downloads/findscape_motion_batch_v1`

Accepted on 2026-07-22 after these checks:

- Required folder layout, README, manifest, contact sheet, two references, and
  twelve frames are present.
- All frames are 512x512, 8-bit RGBA PNG with real alpha transparency.
- Both references and both frame 00 files exactly match the corresponding
  repository target sprites by SHA-256.
- Thief loop seam delta is within its neighboring transition range.
- Puppy paw baseline is stable; its larger final-to-first tail delta remains a
  post-integration visual review item.

The batch is accepted for Stage 4D adapter implementation. It is not the dense
scene or foreground occluder batch.
