# Findscape Dense Region Batch v1

Dense lower-garden slice for region_lower_garden_v1 (map 1600x2400, bounds
x320 y1500 w1000 h760), per issue #75 handoff. Style-matched to the supplied
crop: flat cozy shapes, soft rounded #6b5744 linework, established palette.

Contents
- region_composite_preview.png — 1000x760, unchanged supplied crop as
  background; every asset plus the three target references at manifest
  coordinates, occluders in final render order.
- contact_sheet.png — review only; all transparent assets on checkerboard,
  actor frames in playback order.
- static/ — 4 decoration clusters (real alpha, single cohesive clusters,
  no floor patches).
- actors/ — 2 ambient actors, 6 full-frame PNGs each, 6 fps seamless loop,
  baseline y=450, frame_00 doubles as static fallback.
- occluders/ — 3 independent foreground PNGs; concealment comes from
  composite order only (no targets painted, no target-shaped holes).
- manifest.json — per-asset runtime paths, anchors, positions, render order,
  motion data, concealment intent, SHA-256 hashes.
- decision_note.md — deviations and reasoning.

Concealment (measured against target refs at preview scale 0.45)
- puppy: 55.0% visible (face and one ear clear at focused zoom)
- gem: 41.1% visible (top edge and sparkles peek over the basket rim)
- balloon: unobstructed
