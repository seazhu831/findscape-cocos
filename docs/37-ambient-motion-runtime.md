# Ambient Motion Runtime

Stage 4D was completed in Issue #71. It adds deterministic, budgeted idle
motion without moving semantic entity or hit-test nodes.

## Asset Intake

The accepted Claude Design batch is preserved under:

- `design/claude-design/intake/20260722-motion/`
- `design/claude-design/source/motion_thief_idle/`
- `design/claude-design/source/motion_puppy_idle/`

Runtime frames live under `cocos/assets/resources/art/motion/`. The motion asset
manifest records source and runtime hashes, dimensions, alpha requirements, and
baseline tolerances. `npm run check:motion-assets` verifies that promoted frames
still match the accepted source package and that frame 00 matches the existing
static target sprite exactly.

## Runtime Contract

`EntityMotionScheduler` creates deterministic plans from scene entities and
motion profiles. It applies stable phase offsets, playback variation, animation
budgets, and offscreen policy before the Cocos adapter starts any animation.

`PortraitEntityMotion` supports three drivers:

- `tween`: low-cost bob, sway, scale, and rotation on a visual child.
- `spriteFrames`: Resources-loaded frames advanced by a cancellable Tween.
- `animationClip`: an external Resources clip plays through Cocos
  `AnimationState`; a frame-backed variant uses the same deterministic frame
  sequencer as `spriteFrames`. This avoids the Cocos 3.8.8 dynamic clip sampler
  overwriting a SpriteFrame after the gameplay adapter assigns it.

The visual child animates while its parent entity node remains stationary. This
keeps hit coordinates, hint coordinates, concealment metadata, and map bounds
stable.

## Cancellation And Reset

Each playback request receives an entity version and a scene generation. Async
frame or clip loads check both values before binding playback. Replay, mode
change, target completion, and scene reset invalidate pending loads, stop active
Tweens and Animation states, remove generated clips, and restore the resting
SpriteFrame and transform.

This prevents late asset loads from reviving an old scene and prevents the
previous Replay race where an entity could become visually absent while its hit
node remained active.

## Verification

The following acceptance was completed on the Web Mobile build at `390x844`:

- thief sprite-frame motion visibly advances and remains clickable;
- puppy frame-backed animation visibly advances with a stable footprint and no
  transparent-frame disappearance;
- target completion resets motion before presentation and settlement;
- Replay followed by an immediate thief tap completes normally;
- mode changes start only the selected mode's eligible motion plans;
- the full `npm run check:all` suite passes;
- the Cocos Creator Web Mobile build completes with the known success exit code
  36 and no TypeScript build errors.

The accepted puppy source package contains sparse overlay-only frames 01, 03,
and 05. They remain preserved for source audit but are excluded from playback;
the runtime uses the complete 00/02/04/02 sequence. Manifest validation now
checks runtime entity/profile ownership and rejects playback frames containing
less than 75 percent of the reference subject's visible pixels.

## Next Dependency

Stage 4E can use the current map and entities. It should introduce a pure focus
camera state machine and coordinate conversion service before binding zoom and
restore behavior to Cocos input.
