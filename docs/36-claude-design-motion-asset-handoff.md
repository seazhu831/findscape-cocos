# Claude Design Motion Asset Handoff

Issue: https://github.com/seazhu831/findscape-cocos/issues/71

This is the first asset checkpoint after the layered scene and Tween motion
foundation. Keep this batch deliberately small. Its purpose is to validate the
`spriteFrames` and Cocos `AnimationClip` adapters before the dense-scene batch.

## Prompt For Claude Design

Create two seamless idle animation frame sets for the existing Findscape
portrait demo. Preserve the cozy hand-drawn style, silhouette, palette, line
weight, and native scale of the supplied static target references.

### Set A: Thief Idle

- Runtime entity: `entity_demo_thief_001`
- Reference: existing `target_thief.png`
- Motion: subtle breathing and a small left/right glance; feet stay planted.
- Frames: 6 transparent PNG files.
- Playback: designed for 8 fps, seamless loop.
- Canvas: 512x512 pixels for every frame.
- Anchor: normalized `{ "x": 0.5, "y": 0.5 }`.
- Keep the visual center and foot baseline stable across frames.
- Do not add translation, camera motion, shadows outside the existing style, or
  a success/caught reaction.

### Set B: Puppy Idle

- Runtime entity: `entity_demo_puppy_001`
- Reference: existing `target_puppy.png`.
- Motion: gentle tail wag plus one subtle blink; body stays planted.
- Frames: 6 transparent PNG files.
- Playback: designed for 8 fps, seamless loop.
- Canvas: 512x512 pixels for every frame.
- Anchor: normalized `{ "x": 0.5, "y": 0.5 }`.
- Keep the visual center and paw baseline stable across frames.
- Do not add translation, camera motion, a find reaction, or extra props.

## Required Package Layout

```text
findscape_motion_batch_v1/
  README.md
  manifest.json
  contact_sheet.png
  thief_idle/
    reference_static.png
    frame_00.png
    frame_01.png
    frame_02.png
    frame_03.png
    frame_04.png
    frame_05.png
  puppy_idle/
    reference_static.png
    frame_00.png
    frame_01.png
    frame_02.png
    frame_03.png
    frame_04.png
    frame_05.png
```

`frame_00.png` should match the supplied static reference closely enough that
switching from static to animated rendering does not visibly jump.

## Manifest Contract

```json
{
  "version": 1,
  "sets": [
    {
      "motionAssetId": "thief_idle_v1",
      "entityId": "entity_demo_thief_001",
      "runtimeDirectory": "art/motion/thief_idle",
      "driver": "spriteFrames",
      "frameFiles": [
        "frame_00.png",
        "frame_01.png",
        "frame_02.png",
        "frame_03.png",
        "frame_04.png",
        "frame_05.png"
      ],
      "canvasSize": { "width": 512, "height": 512 },
      "anchor": { "x": 0.5, "y": 0.5 },
      "framesPerSecond": 8,
      "loop": true,
      "stableBaselineY": 0,
      "notes": ""
    }
  ]
}
```

Include the same object for `puppy_idle_v1`. `stableBaselineY` may be a measured
pixel coordinate instead of `0`; it must be consistent across that set.

## Acceptance Checks

- Every frame is exactly 512x512 RGBA PNG with a transparent background.
- File names and manifest order match exactly.
- No frame is cropped, shifted to another canvas origin, or scaled differently.
- The first/last transition loops without a pose or baseline jump.
- Contact sheet shows both loops in frame order at native aspect ratio.
- Static references are included so import review can detect style drift.

## Explicitly Out Of Scope

- No new map background, dense clutter, foreground occluders, HUD, icons, audio,
  hit boxes, success reactions, or additional characters.
- Do not pack a texture atlas. Cocos import normalization will create the
  production atlas after individual frames pass validation.
- Do not create a Cocos `.anim` file. The project will author an AnimationClip
  from the accepted puppy frames to validate that adapter independently.

## Delivery

Place the downloaded folder under `~/Downloads/findscape_motion_batch_v1` and
notify Codex. The repository intake step will validate dimensions, alpha,
manifest references, and frame stability before copying normalized assets into
`cocos/assets/resources/art/motion/`.
