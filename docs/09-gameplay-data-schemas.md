# Gameplay Data Schemas

# Stage 3 Schema Baseline

Issue: https://github.com/seazhu831/findscape-cocos/issues/6

This stage makes the hidden-object foundation data-driven before runtime scene logic grows too large.

## Files

- `cocos/assets/scripts/config/gameplay-schema.ts`: TypeScript interfaces for gameplay config.
- `cocos/assets/resources/config/demo-gameplay.json`: demo map, targets, modes, scoring, tools, and feedback presets.
- `tools/content/validate-gameplay-config.mjs`: deterministic JSON/reference validator.

## Initial Config Shape

The first gameplay config includes:

- `maps`: large-map metadata, world size, camera, zoom bounds, and target point set reference.
- `targetTypes`: semantic target categories such as pineapple, balloon, thief, puppy, and gem.
- `targetPointSets`: positioned target points with hit shapes, visibility, trigger behavior, feedback, and rewards.
- `feedbackPresets`: reusable visual/audio feedback names for find, pop, catch, hint, and wrong tap.
- `scoringRules`: correct-hit score, wrong tap penalty, combo bonus, and remaining-time bonus.
- `tools`: hint and magnifier definitions.
- `gameModes`: Hidden Object, Balloon Blast, and Crime Hunt demo modes over the same target runtime.

## Coordinate Convention

The demo uses map-local coordinates:

- Origin: top-left of the full map image.
- `x`: increases to the right.
- `y`: increases downward.
- Target `position` is the center point for circle and rectangle hit shapes.
- Polygon hit shape points are local offsets from the target `position`.

This convention should be verified against Cocos scene coordinates once the Creator project is initialized.

## Asset Path Convention

Asset paths are runtime logical paths, not final Cocos UUIDs:

- Map backgrounds: `art/maps/...`
- Target icons: `art/icons/...`
- Target sprites: `art/targets/...`
- Tool icons: `art/icons/...`
- Audio: `audio/...`

Claude Design outputs should be normalized into these runtime paths before gameplay config references them.

## Validate Demo Config

From the repository root:

```sh
node tools/content/validate-gameplay-config.mjs cocos/assets/resources/config/demo-gameplay.json
```

The validator currently checks:

- Required top-level arrays.
- Duplicate IDs.
- Map, target type, target point set, feedback, scoring, and tool references.
- Basic positive numeric fields.
- Hit shape structure.
- Target selection rule references.

## Next Schema Work

- Split large config files when content volume grows.
- Add stricter runtime validation once TypeScript tooling is available.
- Add authoring/export format for spreadsheet or internal target editor workflows.
- Confirm coordinate conversion after Cocos Creator initialization.
