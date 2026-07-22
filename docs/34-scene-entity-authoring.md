# Scene Entity Authoring Contract

Issue: https://github.com/seazhu831/findscape-cocos/issues/69

This document defines how illustrated map content becomes reusable runtime
entities. It applies to hand-authored demo JSON and to future Claude Design
handoff batches.

## Source Of Truth

`cocos/assets/resources/config/demo-gameplay.json` remains config version 1.
The new fields are additive:

- A map may reference one `sceneEntitySetId`.
- A target point may reference one `entityId`.
- Top-level `sceneEntitySets` describe visible world objects.
- Top-level `motionProfiles` describe reusable idle motion.

Configs without these fields remain valid. During migration, a target point
with an `entityId` must keep its fallback `position` equal to the linked entity
position. This gives old and new runtimes the same semantic coordinate.

## Baked Or Separate

Keep an object baked into the background only when all of these are true:

- It never moves.
- It is never interactive.
- It is not needed as a foreground occluder.
- It does not need mode-specific visibility or reuse.

Export an object as a separate transparent asset when any of those conditions
is false. Targets and useful foreground occluders must always be separate.

## Layer And Kind Rules

| Kind | Allowed authoring role | Expected layer |
| --- | --- | --- |
| `decoration` | Independent static prop | `staticDecoration` |
| `actor` | Non-target person or animal | `ambientActor` |
| `interactive` | Entity that a mode can select as a target | `interactive` |
| `occluder` | Prop intentionally drawn above another entity | `foregroundOccluder` |

`render.order` is ascending within a layer. Use stable integer values and leave
gaps when a region is likely to receive additional assets.

## Coordinates And Anchors

- Map coordinates use a top-left origin inside the declared map `worldSize`.
- `transform.position` is the authored semantic point.
- `transform.anchor` uses normalized sprite coordinates; use `{x: 0.5, y: 0.5}`
  unless the asset manifest explicitly defines another anchor.
- Target hit shapes are relative to the semantic point, not to animated pixels.
- Idle motion will be applied to a visual child. It must not move the entity's
  hit node or change its authored target position.

## Activation And Motion

Use `always` for cheap permanent scenery, `nearViewport` for dense decoration or
ambient actors, and `modeSelected` for target candidates. Omitted activation
policy defaults to runtime-visible behavior and should be reserved for legacy
content.

Motion profiles may contain multiple idle variants. Runtime chooses a stable
variant and randomized start delay so a crowd does not move in lockstep.

- `tween` is appropriate for small bob, sway, rotation, or breathing motion.
- `spriteFrames` is appropriate for authored frame sequences.
- `animationClip` is appropriate for Cocos-authored clips.
- `offscreenPolicy: pause` is the default production choice.

## Concealment

Concealment is authoring metadata, not hit-test behavior. Foreground art must
never swallow input intended for an active target.

- Every `occluderEntityId` must reference an `occluder` on the same map.
- `intendedVisibleRatio` is a review target from 0 to 1, not runtime alpha.
- `visualSimilarityTags` describe nearby color, silhouette, or subject clutter.
- `edgePlacement` records whether the target is partially clipped by a region.
- `scaleClass` supports difficulty review across assets of different sizes.

An empty occluder list is valid for color or clutter camouflage. Do not create a
fake occluder entity merely to satisfy metadata.

## Claude Design Delivery Contract

Each future separate asset must include:

- Stable asset ID and suggested runtime path.
- Map position, pixel dimensions, and normalized anchor.
- Kind, layer, and render order.
- Whether it can be selected as a target.
- Optional motion profile intent and available frame or clip assets.
- Optional occluder relationships and intended visible ratio.
- Transparent PNG source at the declared native scale.

The dense-scene batch must also include a contact sheet and a machine-readable
manifest. Background pixels and separate assets must align at authored
coordinates without requiring visual offsets in code.

## Current Demo Mapping

The seven existing target sprites are represented as interactive entities. The
two balloons use `ambient_bob_subtle`, the thief uses `thief_idle_frames`, and
the puppy uses `puppy_idle_clip`. Pineapples and the gem stay static. Existing
camouflage metadata intentionally has no occluder references because the current
asset batch contains no honest independent foreground covers.

## Validation

Run:

```bash
cd cocos
npm run validate:config
npm run check:scene-entities
```

The validator rejects duplicate IDs, broken references, invalid layers and
motion variants, out-of-bounds entities, target/entity position drift, and
invalid occluder relationships.
