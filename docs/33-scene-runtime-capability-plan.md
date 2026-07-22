# Scene Runtime Capability Plan

Issue: https://github.com/seazhu831/findscape-cocos/issues/68

This plan turns the current portrait demo into a reusable high-density scene
runtime. The reference experience is not just a larger hidden-object map. It is
a layered world where static clutter, lightly animated actors, foreground
occluders, camera tools, target rules, and feedback sequences cooperate without
becoming mode-specific scene code.

## Product Capability Model

The shared foundation should be:

```text
content package
  -> layered scene entities
  -> camera and input controller
  -> mode target projection
  -> domain events
  -> presentation sequence
  -> HUD and settlement
```

Game modes should select and reinterpret entities. They should not own separate
maps or duplicate object placement code.

Examples:

- A pineapple entity is decorative in one mode and a find target in another.
- A character can run an idle animation whether or not it is currently a target.
- A foreground basket can visually cover a target without owning target logic.
- A balloon can use the same entity runtime but a different trigger and feedback
  preset from a hidden item.

## Layered World Model

Use explicit semantic layers. Render order remains data-driven within each
layer.

1. `background`: baked terrain and large non-interactive illustration.
2. `staticDecoration`: tents, tables, plants, props, and visual clutter.
3. `ambientActor`: people and animals with lightweight idle motion.
4. `interactive`: entities that can be projected into the active mode as targets.
5. `foregroundOccluder`: foliage, furniture, crowds, and other partial covers.
6. `worldFeedback`: rings, sparkles, hint pulses, and local effects.
7. `screenFeedback`: fly-to-HUD clones and screen-space transitions.
8. `hud`: timer, tools, target counters, and settlement.

Static decoration may be baked into the background when it never needs separate
motion, occlusion, interaction, or content reuse. Interactive targets and useful
occluders must remain separate entities.

## Data Contract Direction

The next schema revision should remain backward compatible with gameplay config
version 1 while adding reusable scene packages.

### Scene Entity

```ts
interface SceneEntityConfig {
  entityId: string;
  mapId: string;
  kind: "decoration" | "actor" | "interactive" | "occluder";
  asset: string;
  transform: {
    position: Vector2Config;
    scale?: Vector2Config;
    rotationDegrees?: number;
    anchor?: Vector2Config;
  };
  render: {
    layer: SceneLayerId;
    order: number;
    visibleByDefault: boolean;
  };
  motionProfileId?: string;
  activationPolicy?: "always" | "nearViewport" | "modeSelected";
  tags: string[];
}
```

### Target Projection

`TargetPointConfig` should reference `entityId`. Hit shape, reward, trigger,
visibility rule, and feedback remain target concerns. Position may remain as a
version-1 fallback during migration.

This separates three questions:

- What exists in the world?
- What is a target in this mode?
- How does the target react when triggered?

### Motion Profile

```ts
interface MotionProfileConfig {
  motionProfileId: string;
  driver: "tween" | "spriteFrames" | "animationClip";
  idleVariants: MotionVariantConfig[];
  startDelayRangeMs?: [number, number];
  offscreenPolicy: "pause" | "reducedRate" | "continue";
}
```

The first implementation should support low-cost tween motion and Cocos
AnimationClip or sprite-frame loops. Skeletal animation is an optional asset
adapter, not a core schema requirement.

### Concealment Metadata

Difficulty cannot be represented only by a number. Add optional authoring data:

- `occluderEntityIds`
- `intendedVisibleRatio`
- `visualSimilarityTags`
- `edgePlacement`
- `scaleClass`

These fields support validation and authoring review. Runtime target correctness
must never depend on pixel sampling or the occluder intercepting touch events.

## Runtime Modules

### Scene Entity Registry

Responsibilities:

- Instantiate entities from data.
- Resolve entity IDs to Cocos nodes.
- Apply layer, order, transform, and activation policy.
- Expose entity bounds and anchors to target, camera, and feedback systems.
- Reset entities and cancel animations safely across replay and mode changes.

### Motion Scheduler

Responsibilities:

- Start randomized idle variants without synchronizing every actor.
- Pause or reduce work outside the viewport.
- Enforce a per-frame animation budget.
- Keep target hit shapes stable while visual children move locally.

The hit node should remain stationary. Idle motion belongs on a visual child so
animation does not change semantic target coordinates.

### Camera Controller

Replace direct `MapWorld` tweening with an explicit camera state machine:

- `free`: map pan is enabled.
- `transitioning`: input is suppressed during a short focus transition.
- `focused`: a map center and zoom are locked for the magnifier duration.
- `returning`: camera restores the captured pre-focus viewport.

Magnifier activation should capture the current viewport center, not choose a
target. It then zooms around that map point, clamps to bounds, locks pan according
to tool policy, and restores the exact previous center and zoom. Replay, mode
change, and settlement must cancel the sequence deterministically.

### Presentation Orchestrator

Domain state should update immediately, but visible effects need an ordered
sequence. Convert feedback plans into cancellable presentation steps:

1. Mark the world target as found and disable duplicate hits.
2. Play local lift, pulse, or pop feedback.
3. Clone the target visual into the screen-feedback layer.
4. Convert target world position and target-slot position into one coordinate
   space.
5. Fly the clone along a curved path to the matching HUD slot.
6. Pulse the slot and update its displayed count.
7. Hide or transform the world entity according to its lifecycle policy.
8. Allow settlement to appear after required feedback barriers complete.

The final-target case is the important contract: settlement cannot cover the
fly-to-list effect. Presentation cancellation must also prevent old callbacks
from affecting a replayed round.

## Camera And Coordinate Spaces

The runtime should treat coordinate conversion as a service rather than ad hoc
node math:

- map coordinates: stable content-authoring coordinates with top-left origin.
- world coordinates: Cocos scene coordinates.
- viewport/screen coordinates: camera projection.
- HUD local coordinates: target slot destination.

World-to-HUD feedback must use explicit conversion helpers and remain correct
while the map is panned or zoomed.

## Content And Performance Strategy

High-density maps are primarily a content-scale problem.

- Group entities into authored regions for activation and inspection.
- Atlas compatible sprites and preserve batch-friendly materials.
- Pool transient effects and fly-to-HUD clones.
- Avoid one `update()` component per ambient actor.
- Randomize animation phase but cap simultaneously active animated entities.
- Pause offscreen frame animations and tweens.
- Keep hit testing data-driven and independent of render-node event ordering.
- Measure node count, draw calls, texture memory, and frame time on WeChat device.

Initial device budgets are hypotheses to validate, not permanent limits:

- up to 150 instantiated scene entities in the first dense prototype.
- up to 24 simultaneously active lightweight idle animations.
- no more than 8 transient feedback nodes without pooling.
- target hit response available within one rendered frame.

## Authoring Tool Direction

Production content needs an inspectable source of truth. Extend the existing
config and validation pipeline before building a full custom editor.

Required first tools:

- JSON schema and deterministic validation for entities, layers, motions, and
  references.
- Scene manifest report grouped by region, layer, and animation cost.
- Debug overlay for entity IDs, target hit shapes, occluder links, and camera
  bounds.
- Screenshot checklist at default and focused zoom.

Only after these prove insufficient should the project add a visual placement
editor or spreadsheet import.

## Implementation Stages

### Stage 4B: Schema V2 And Validation

Status: complete in Issue #69. Authoring rules are recorded in
`docs/34-scene-entity-authoring.md`.

Outputs:

- Backward-compatible scene entity, layer, motion, and target-reference types.
- Demo scene entity manifest.
- Deterministic validator and fixtures.

Dependencies: none beyond the current config v1.

### Stage 4C: Layered Entity Runtime

Status: complete in Issue #70. Runtime behavior and verification are recorded
in `docs/35-layered-scene-entity-runtime.md`.

Outputs:

- Scene entity registry and layer roots.
- Static decoration, interactive entities, and foreground occluders instantiated
  from data.
- Mode selection projects target rules onto reusable entities.

Dependencies: Stage 4B.

### Stage 4D: Ambient Motion Runtime

Status: complete in Issue #71. Asset intake, runtime behavior, cancellation,
and verification are recorded in `docs/37-ambient-motion-runtime.md`.

Outputs:

- Tween and sprite/clip idle motion adapters.
- Central scheduling, randomized phase, reset, and offscreen policy.
- Several animals or characters moving without shifting hit coordinates.

Dependencies: Stage 4C and suitable asset variants from Claude Design.

### Stage 4E: Focus Camera And Magnifier

Status: complete in Issue #72. Camera state, Cocos binding, cancellation, and
verification are recorded in `docs/38-focus-camera-runtime.md`.

Outputs:

- Camera state machine and coordinate conversion service.
- Magnifier captures the current map region, centers it, zooms in, and restores.
- Gesture, replay, settlement, and mode-change cancellation tests.

Dependencies: Stage 4C. This can use current assets.

### Stage 4F: Target Collection Presentation

Status: complete in Issue #73. Planner, HUD contract, Cocos presentation,
settlement barrier, and verification are recorded in
`docs/39-target-collection-presentation.md`.

Outputs:

- Cancellable presentation orchestrator.
- Pineapple lift and curved fly-to-matching-HUD-slot effect.
- Counter arrival pulse and final-target settlement barrier.

Dependencies: Stage 4C and Stage 4E coordinate conversions.

### Stage 4G: Concealment And Dense Scene Slice

Status: complete in Issue #75. Source intake, normalized runtime assets,
target-linked occluder activation, composition tuning, and acceptance are
recorded in `docs/41-dense-region-runtime.md`.

Outputs:

- Foreground occluder relationships and difficulty metadata.
- One authored dense region with static clutter, ambient actors, and hidden
  targets.
- Visual and hit-test acceptance screenshots.

Dependencies: Stages 4C-4F and a focused Claude Design asset batch.

### Stage 4H: Scale, Diagnostics, And Device Budget

Outputs:

- Region activation, animation budget, pooling, and debug overlay.
- Web and WeChat performance report for a representative dense map.
- Adjusted production budgets based on physical-device measurements.

Dependencies: Stage 4G.

## Commit Boundaries

Keep each stage granular:

- schema types and validator fixtures.
- demo content manifest.
- runtime registry and layer binding.
- each motion adapter.
- camera state and Cocos binding.
- presentation planner and Cocos animation binding.
- content batch import.
- diagnostics and performance notes.

Generated art, normalized runtime assets, gameplay behavior, and documentation
must remain separate commits when they can be reviewed independently.

## Immediate Next Step

Start Stage 4H with deterministic region activation and runtime diagnostics.
Measure the representative Stage 4G slice before choosing pooling or animation
budgets, then record Web and physical-device results separately.
