# Claude Design Asset Production Handoff

Issue: https://github.com/seazhu831/findscape-cocos/issues/37

Version: 1.0

Project: Findscape Cocos demo

## How To Use This Handoff

Give this document to Claude Design and ask it to produce Batch A first. Review Batch A before generating Batch B or C. Return every accepted output as a separate file using the exact filenames in this document.

The immediate goal is to replace placeholder visuals in a reusable Cocos Creator hidden-object demo. This is a production asset request, not a marketing page request.

## Master Prompt For Claude Design

```text
You are the visual design and asset production partner for Findscape, a cozy mobile hidden-object game built with Cocos Creator.

Read the full attached handoff before producing anything. Work in three reviewable batches and begin with Batch A only. Maintain one cohesive visual language across all outputs: cozy hand-drawn casual game art, soft rounded lines, friendly multicolor palette, clean silhouettes, gentle texture, and strong readability on a phone. The audience is 15-35 and the experience should feel calm, playful, polished, and low-pressure.

The game map is the main playable surface. Do not bake HUD, labels, target objects, watermarks, signatures, or generated text into the clean map background. Target sprites must be separate transparent PNG assets so the runtime can position and animate them. UI mockups are implementation references; export their reusable visual components separately whenever possible.

Follow the exact canvas sizes, transparency requirements, filenames, and safe-area rules in this handoff. Do not combine multiple requested runtime assets into one image unless the item is explicitly called a reference sheet. Avoid photorealism, 3D rendering, heavy gradients, muddy monochrome color grading, harsh black outlines, sharp aggressive forms, visual noise, illegible micro-detail, and copyrighted characters or brand marks.

For each batch, first show a cohesive contact sheet for review. After approval, export each deliverable separately at the specified dimensions. Include a short note listing any deviations or design decisions. Start now with Batch A: World and Core Targets.
```

## Product And Runtime Context

Findscape is a reusable hidden-object game foundation. The first demo uses one large town map and supports five object categories:

- Pineapple: classic hidden-object find.
- Balloon: visible tap-to-pop variant.
- Thief: cute tap-to-catch character variant.
- Puppy: friendly hidden-object variant.
- Gem: higher-difficulty hidden treasure.

The same map and target framework will power several modes, so assets must stay modular. A target may be placed, hidden, highlighted, removed, animated, or flown toward the target list by the runtime.

Primary presentation is portrait mobile. The map itself is landscape and can be panned and zoomed behind a compact HUD.

## Visual System

### Desired qualities

- Cozy hand-drawn illustration with soft, confident linework.
- Warm and friendly, but not dominated by beige, orange, brown, or one hue.
- Balanced palette using leafy green, sky blue, coral, sunny yellow, berry red, lavender accents, and warm neutrals.
- Rounded, simplified forms with enough texture to feel authored.
- Clear object silhouettes at 48-96 px display size.
- Gentle lighting with readable local contrast and no crushed shadows.
- Whimsical everyday town details rather than fantasy spectacle.

### Avoid

- Photorealistic, glossy 3D, anime character rendering, pixel art, or flat corporate vector style.
- Dark mood, horror, weapons, threatening crime imagery, or an aggressive thief.
- Heavy gradients, neon glow, excessive bloom, hard black outlines, or sharp jewel realism.
- Baked text, logos, UI chrome, watermarks, signatures, or fake language glyphs.
- Important objects within 80 px of the map edge.
- Tiny detail that disappears at mobile zoom or texture that obscures tappable targets.

## Batch A - World And Core Targets

Batch A is the blocking production batch. Generate and review this batch first.

### A1. Clean Demo Cozy Town Map

Filename: `source_map_demo_cozy_town_placeholder_YYYYMMDD_01.png`

Canvas: 2400 x 1600 px, opaque PNG, landscape.

Create a clean background illustration for a cozy town park and street market. Include a readable left-to-right composition with distinct regions: produce market and cafe frontage, central square or fountain, park and picnic area, small shopfronts, trees and planters, benches, baskets, awnings, windows, signs without text, blankets, crates, and small props. Provide at least 30 plausible hiding places distributed across the full map. Keep navigable visual paths and avoid concentrating all interest in the center.

Important: do not include the five gameplay targets in the clean map. No pineapple, free-floating balloon, sneaky thief, hidden puppy, or loose gem should accidentally read as a target. Decorative motifs that could be confused with them should be omitted.

Composition anchors for current runtime test points, using top-left image coordinates:

| Runtime point | Coordinate | Provide nearby context |
| --- | ---: | --- |
| Pineapple 1 | 420, 980 | Produce stall, picnic basket, or patterned market props |
| Puppy | 720, 1340 | Bench, blanket, planter, or low garden area |
| Balloon 1 | 980, 360 | Open sky gap, awning edge, or festival string area |
| Thief | 1320, 840 | Kiosk, alley entrance, stack of crates, or central crowd gap |
| Pineapple 2 | 1670, 1160 | Cafe table, fruit display, or shopfront props |
| Gem | 1880, 1380 | Fountain edge, flower bed, drain, or decorative stonework |
| Balloon 2 | 2040, 520 | Tree canopy gap, shop awning, or lamp-post area |

These are composition guides, not instructions to paint the targets into the map.

Map acceptance:

- Readable both as a whole and at 2x zoom.
- At least 30 credible hiding positions across all quadrants.
- Clear depth without blurred foreground overlays.
- No baked UI, text, watermark, or gameplay target.
- No critical feature clipped at the map edge.

### A2. Five Target Sprites

Export each as a separate 512 x 512 px transparent PNG. Center the object with moderate transparent padding. Keep line weight, lighting, and texture consistent with the map. Each sprite must remain recognizable at roughly 64 px.

| Filename | Design direction |
| --- | --- |
| `source_target_pineapple_YYYYMMDD_01.png` | Cheerful natural pineapple, leafy crown, warm yellow-green contrast; suitable near produce or picnic props |
| `source_target_balloon_YYYYMMDD_01.png` | Rounded coral or berry balloon with short soft string; readable and playful, not glossy 3D |
| `source_target_thief_YYYYMMDD_01.png` | Small cute sneaky character with rounded cap or eye mask and compact satchel; mischievous, harmless, no weapon |
| `source_target_puppy_YYYYMMDD_01.png` | Friendly small puppy in a crouched or peeking pose; simple ears and face, cozy coloring |
| `source_target_gem_YYYYMMDD_01.png` | Rounded faceted gem with soft friendly sparkle; teal, berry, or violet; avoid sharp realism |

Target acceptance:

- True transparent background with no checkerboard baked in.
- No floor patch, square tile, frame, shadow rectangle, text, or watermark.
- Complete silhouette is inside the canvas and not clipped.
- Targets look native to the map when composited at expected scale.
- Different categories are distinguishable by silhouette, not color alone.

### Batch A Review Preview

Alongside separate files, provide one review composite showing all five targets placed at the seven listed map anchors. This composite is review-only and must not replace the clean map export.

## Batch B - Target List And Tool Icons

After Batch A approval, create seven separate 256 x 256 px transparent PNG icons. Icons should be simplified close relatives of the target sprites, centered with consistent optical scale and safe padding. Do not include button backgrounds; Cocos will provide button states and containers.

| Filename | Content |
| --- | --- |
| `source_icon_pineapple_YYYYMMDD_01.png` | Simplified pineapple target-list icon |
| `source_icon_balloon_YYYYMMDD_01.png` | Simplified balloon target-list icon |
| `source_icon_thief_YYYYMMDD_01.png` | Simplified cute thief portrait or silhouette |
| `source_icon_puppy_YYYYMMDD_01.png` | Simplified puppy portrait or silhouette |
| `source_icon_gem_YYYYMMDD_01.png` | Simplified gem icon |
| `source_tool_hint_YYYYMMDD_01.png` | Universal hint symbol, preferably a warm lightbulb or gentle sparkle beacon; no text |
| `source_tool_magnifier_YYYYMMDD_01.png` | Clear magnifying glass silhouette; no text |

Batch B acceptance:

- Readable at 32-48 px.
- Consistent visual weight and padding across the set.
- Transparent backgrounds and no baked circular buttons.
- Hint and magnifier remain distinguishable without labels.

## Batch C - HUD And Feedback References

Batch C is a visual implementation reference. The final HUD will be built from Cocos-native components.

### C1. Portrait HUD Reference

Filename: `source_ui_hud_reference_YYYYMMDD_01.png`

Canvas: 1080 x 1920 px, opaque PNG.

Show the Cozy Town map as the dominant full-screen play surface. Use a compact safe-area-aware top HUD for time, score, and combo. Use a compact bottom target list with icons and remaining counts. Place small hint and magnifier controls near the lower corners without obstructing the map. Keep tap targets at least 88 source pixels. Use numeric placeholder text only where needed to demonstrate hierarchy; do not invent a logo or marketing copy.

Provide a practical implementation reference, not a landing page, phone mockup, decorative poster, or card-heavy concept board. Avoid cards nested inside cards. The map should remain visibly playable.

### C2-C6. Feedback Reference Sheets

Export each as a separate 1024 x 1024 px transparent PNG reference sheet. Arrange 3-5 clearly separated key states without labels baked into the artwork. Keep effects localized around a target and feasible with sprites, particles, scale, opacity, and simple tweens.

| Filename | States and tone |
| --- | --- |
| `source_feedback_find_success_YYYYMMDD_01.png` | Soft success ring, small sparkles, target lift/fly cue; 700 ms feel |
| `source_feedback_pop_success_YYYYMMDD_01.png` | Rounded burst and soft puff; playful rather than explosive; 500 ms feel |
| `source_feedback_catch_success_YYYYMMDD_01.png` | Friendly capture stamp shape and sparkle, no police aggression or text; 800 ms feel |
| `source_feedback_hint_reveal_YYYYMMDD_01.png` | Expanding pulse or spotlight ring that does not cover the target; 2000 ms feel |
| `source_feedback_wrong_tap_YYYYMMDD_01.png` | Subtle ripple or wobble marks, low-friction and not harsh red; 300 ms feel |

## Export Package Contract

Return selected outputs in three folders:

```text
batch_a_world_targets/
batch_b_icons_tools/
batch_c_ui_feedback/
```

Use the exact filenames above, replacing `YYYYMMDD` with the export date. Use `_01`, `_02`, and so on only for deliberate alternatives. Do not use names such as `final`, `new`, `copy`, or `v2`.

For each delivered batch include:

- Separate PNG file for every requested asset.
- A contact sheet or review composite.
- A short plain-text decision note listing palette, line treatment, and deviations.
- No PSD or layered source is required for the first review, but layered source is welcome if Claude Design can export it reliably.

## Final Production Checklist

Before handing files back, confirm:

- All requested files exist and use exact names.
- Dimensions match exactly.
- Transparent assets have real alpha transparency.
- The clean map contains no gameplay targets or HUD.
- No image contains a watermark, signature, brand, generated nonsense text, or copyrighted character.
- No target silhouette is clipped.
- Assets form one coherent visual family.
- Icons remain legible at mobile size.
- UI controls respect portrait safe areas and do not cover the core play space.
- Contact sheets are clearly marked as review-only in the delivery note, not in baked image text.

## Repository Intake Notes

The development team will preserve selected Claude Design exports under:

```text
design/claude-design/source/{assetId}/
```

They will then normalize approved runtime files into Cocos paths such as:

```text
cocos/assets/resources/art/maps/demo_cozy_town_placeholder.png
cocos/assets/resources/art/targets/target_pineapple.png
cocos/assets/resources/art/icons/icon_pineapple.png
```

Do not rename semantic asset IDs. Runtime configuration already references these stable names.
