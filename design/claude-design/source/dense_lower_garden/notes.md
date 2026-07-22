# Dense Lower Garden Source Notes

Accepted from `findscape_dense_region_batch_v1` on 2026-07-22 for Issue #75.
The untouched delivery remains under
`design/claude-design/intake/20260722-dense-region/`.

- Four static decoration clusters, two six-frame ambient actors, and three
  foreground occluders are preserved here without pixel changes.
- All 19 PNG hashes match the delivered manifest.
- Every runtime asset is an 8-bit RGBA PNG with visible pixels and alpha.
- Both actor sequences contain complete subjects in every frame. Visible-pixel
  coverage stays above 99 percent of frame 00 and the measured alpha baseline
  is stable at y=455 across all 12 frames.
- The delivered manifest declares y=450 for both actor baselines. Runtime
  metadata must normalize this to the measured y=455 without modifying source
  pixels.
- The preview measures target concealment at target canvas scale 0.45. Runtime
  occluder positions and scale remain subject to Cocos visual acceptance because
  the current authored target nodes use a 140x140 custom display size.
- Delivered `regionVisible`, `decoration`, `actor`, and `foreground` vocabulary
  is design-facing. Runtime configuration maps it to the existing
  `nearViewport`, `staticDecoration`, `ambientActor`, and
  `foregroundOccluder` values.
