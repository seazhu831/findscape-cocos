# Portrait Gameplay Contract

Issue: https://github.com/seazhu831/findscape-cocos/issues/40

This stage migrates the demo gameplay contract from the landscape placeholder to
the accepted Claude Design portrait map. The source of truth is
`design/claude-design/intake/20260713/README.md`.

## World And Camera

- World size: `1600x2400` map pixels.
- Coordinate origin: top-left, matching the design handoff and existing runtime
  hit-test convention.
- Default camera center: `(800, 1200)`.
- Runtime background path remains
  `art/maps/demo_cozy_town_placeholder`.

## Runtime Anchors

| Target ID | Position |
|---|---:|
| `demo_pineapple_001` | `(330, 860)` |
| `demo_puppy_001` | `(480, 1980)` |
| `demo_balloon_001` | `(930, 360)` |
| `demo_thief_001` | `(1060, 1310)` |
| `demo_pineapple_002` | `(1330, 1040)` |
| `demo_gem_001` | `(1200, 2090)` |
| `demo_balloon_002` | `(1170, 1620)` |

## Preserved Contracts

- Semantic map, target, mode, scoring, tool, and feedback IDs are unchanged.
- Target selection rules and per-mode behavior are unchanged.
- Stable runtime asset paths are unchanged.
- Existing hit-shape dimensions are retained until the first Creator scene can
  be measured at actual device scale.

## Viewport Rule

When a zoom level makes the visible area larger than the map on one axis, that
axis stays centered on the map and renders surrounding letterbox space. The
camera center must never be pushed outside the map to satisfy impossible edge
clamps.

## Dependencies And Next Step

Completed dependencies:

- Issue #38: accepted portrait production assets.
- Issue #39: Creator 3.8.8 installation and typed asset import.

The next stage can create the first portrait Cocos scene using this contract.
Scene screenshots must verify anchor placement, target display size, HUD-safe
regions, and viewport behavior before hit shapes are tuned.
