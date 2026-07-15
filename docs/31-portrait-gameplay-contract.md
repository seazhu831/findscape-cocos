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

## Search HUD Rule

- The top timer/score/combo panel stays compact and centered near the safe-area
  top instead of spanning the map width.
- The bottom target strip stays compact and can be collapsed with a dedicated
  chevron control; the control remains available while the strip is hidden.
- Hint and magnifier controls stay near the outer edges and must not cover the
  central target strip.
- Map touch and drag gestures reduce HUD chrome opacity for the duration of the
  gesture, then restore it on touch end or cancellation.
- HUD controls stop touch propagation so collapsing the target strip never moves
  the map or triggers a target.

## Dependencies And Next Step

Completed dependencies:

- Issue #38: accepted portrait production assets.
- Issue #39: Creator 3.8.8 installation and typed asset import.

The portrait scene implements this contract. Anchor placement, target display
size, viewport bounds, compact HUD layout, collapse/restore, and map dragging
have been checked at `390x844`; physical-device confirmation remains in Issue
#64.
