# Claude Design Dense Region Handoff

Issue: https://github.com/seazhu831/findscape-cocos/issues/75

## Master Prompt

You are the visual design and production partner for Findscape, a cozy portrait
mobile hidden-object game built with Cocos Creator. Read this entire handoff and
use every supplied reference image before generating assets.

Create one production-ready dense scene slice named
`findscape_dense_region_batch_v1`. Extend the existing lower garden region of
the supplied `demo_cozy_town_placeholder` map without replacing or repainting
the base map. The purpose of this batch is to validate runtime composition of
independent static decorations, ambient actors, hidden targets, and foreground
occluders.

Preserve the existing cozy hand-drawn language: soft rounded brown linework,
flat but gently textured color, friendly multicolor palette, simple readable
silhouettes, and the current map's scale and top-down/three-quarter perspective.
New objects must look native when composited onto the supplied crop.

Return the contact sheet and composite preview first. After visual approval,
return every runtime asset as a separate transparent PNG plus the final
manifest. Do not generate a new full map, HUD, buttons, text, hit areas, shadows
that belong to the background, or target-success effects.

## Authored Region

- Map asset: `art/maps/demo_cozy_town_placeholder`
- Map canvas: 1600 x 2400 pixels, top-left map origin.
- Region ID: `region_lower_garden_v1`
- Region bounds: x 320, y 1500, width 1000, height 760.
- Supplied crop: `reference_region_lower_garden.png` at 1000 x 760.
- Existing targets in or touching the region:
  - puppy: `entity_demo_puppy_001` at map `(480, 1980)`.
  - gem: `entity_demo_gem_001` at map `(1200, 2090)`.
  - balloon: `entity_demo_balloon_002` at map `(1170, 1620)`.

Treat the supplied crop as immutable. Its pixels are reference and composite
background only; do not include them in transparent runtime exports.

## Required Runtime Assets

All map positions below use the 1600 x 2400 map's top-left origin. Positions may
move by at most 40 pixels when required for a convincing composite. Record every
deviation in `decision_note.md` and the final manifest.

| Asset ID | Role | Suggested map position | Export |
| --- | --- | --- | --- |
| `garden_picnic_basket` | static decoration | `(570, 1710)` | 384x384 RGBA PNG |
| `garden_planter_cluster` | static decoration / warm-shape decoy | `(410, 1935)` | 512x512 RGBA PNG |
| `garden_scattered_toys` | static decoration | `(960, 1880)` | 512x384 RGBA PNG |
| `garden_blue_glass_cluster` | static decoration / gem-color decoy | `(1080, 2170)` | 384x384 RGBA PNG |
| `actor_gardener_kneeling` | ambient person, six-frame idle | `(760, 1840)` | 6 x 512x512 RGBA PNG |
| `actor_reader_seated` | ambient person, six-frame idle | `(980, 2070)` | 6 x 512x512 RGBA PNG |
| `occluder_puppy_planter` | foreground occluder for puppy | `(480, 1995)` | 512x512 RGBA PNG |
| `occluder_gem_flower_basket` | foreground occluder for gem | `(1200, 2105)` | 512x512 RGBA PNG |
| `occluder_lane_shrub` | foreground depth and clutter | `(700, 2190)` | 640x512 RGBA PNG |

Static assets must contain one cohesive object cluster, not a rectangular scene
patch. Do not bake large floor, grass, path, or plaza areas into them.

## Concealment Intent

`occluder_puppy_planter` must cover the puppy's lower body and one side while
leaving about 55 percent of its authored silhouette visible. The face or one ear
should remain discoverable at focused zoom. It must not make the target
impossible at default zoom.

`occluder_gem_flower_basket` must cover the gem's lower and side edges while
leaving about 42 percent visible. Nearby blue glass and flowers may create color
similarity, but no decoration may duplicate the gem silhouette.

The occluders are independent foreground PNGs. Never paint the puppy, gem, or a
target-shaped hole into an occluder. Composite order, not image masking, creates
concealment.

## Ambient Actor Motion

Each actor has exactly six full-frame transparent PNGs named `frame_00.png`
through `frame_05.png`, authored for 6 fps seamless looping.

- Gardener: tiny breathing shift and one hand tending a plant; knees and ground
  contact stay fixed.
- Reader: tiny breathing shift and a small page/hand movement; seated baseline
  stays fixed.
- Canvas, anchor, optical scale, line weight, and baseline must remain identical
  across each sequence.
- Every frame must contain the complete actor. Incremental overlays, sparse
  delta frames, isolated limbs, masks, and partial replacement layers are not
  accepted.
- `frame_00.png` must also work as the actor's static fallback.

## Package Contract

```text
findscape_dense_region_batch_v1/
  README.md
  decision_note.md
  manifest.json
  contact_sheet.png
  region_composite_preview.png
  static/
    garden_picnic_basket.png
    garden_planter_cluster.png
    garden_scattered_toys.png
    garden_blue_glass_cluster.png
  actors/
    actor_gardener_kneeling/frame_00.png ... frame_05.png
    actor_reader_seated/frame_00.png ... frame_05.png
  occluders/
    occluder_puppy_planter.png
    occluder_gem_flower_basket.png
    occluder_lane_shrub.png
```

`region_composite_preview.png` must be exactly 1000 x 760 and use the supplied
crop as its unchanged background. Place every new asset and all three supplied
target references at manifest coordinates. Show occluders in final render order.

The contact sheet is review-only and must show every transparent asset on a
neutral checkerboard, with all actor frames in playback order. Do not bake labels
into runtime assets.

## Manifest Requirements

Start from `manifest-template.json`. For each asset provide:

- stable `assetId`, exact relative source file, and proposed runtime path.
- kind, layer, render order, activation policy, native canvas size, anchor, and
  final map position.
- frame order, fps, loop, and stable baseline for animated actors.
- target entity, intended visible ratio, edge placement, and visual-similarity
  tags for occluders.
- SHA-256 for every exported PNG.

Do not rename existing target entity IDs or target runtime paths.

## Acceptance Checklist

- The composite looks native to the existing map at default and 1.5x focused
  zoom; no pasted rectangular patches or perspective mismatch.
- Runtime PNGs have real alpha, complete uncropped silhouettes, and no text,
  watermark, checkerboard, HUD, target markers, or baked hit areas.
- Puppy remains roughly 55 percent visible; gem remains roughly 42 percent
  visible; balloon remains unobstructed for Balloon Blast mode.
- Both actor loops keep a stable baseline and every frame contains at least 75
  percent of frame 00's visible subject pixels.
- Static clusters enrich the region without reproducing a target silhouette or
  making taps visually ambiguous.
- Manifest filenames, positions, dimensions, anchors, and hashes match exports.

## Explicitly Out Of Scope

- No full-map replacement or background repaint.
- No new game mode, target category, HUD, icon, audio, success effect, or Cocos
  project file.
- No texture atlas, sprite sheet, layered source requirement, or `.anim` file.
- No more assets than listed in this handoff.

## Delivery

Place the downloaded folder at `~/Downloads/findscape_dense_region_batch_v1`
and notify Codex. The repository intake will preserve raw exports, validate the
manifest and alpha coverage, then normalize approved assets into Cocos runtime
paths.
