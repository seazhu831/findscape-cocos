# Gameplay Foundation

# Reusable Hidden-object Core

The reference screenshots and PRD all point to one reusable foundation:

Large scene map + target definitions + player input + target trigger + visual/audio feedback + scoring/settlement.

Different game modes can be implemented as different configurations and trigger behaviors on top of the same foundation.

## Core Concepts

## Map

A map is a large hand-drawn scene. It may be a tall image, a wide image, a multi-screen canvas, or later a tiled/resource-bundled scene.

Suggested fields:

- `mapId`
- `name`
- `theme`
- `assetBundle`
- `backgroundAsset`
- `worldSize`
- `defaultCamera`
- `minZoom`
- `maxZoom`
- `targetPointSetId`

## Target Point

A target point is a configured interactive area on the map.

Suggested fields:

- `targetId`
- `mapId`
- `type`
- `x`
- `y`
- `hitShape`: circle, rectangle, polygon, or sprite bounds.
- `hitSize`
- `difficulty`
- `visibilityRule`
- `triggerBehavior`
- `feedbackPreset`
- `reward`
- `tags`

## Target Type

A target type is the semantic item being searched or triggered.

Examples:

- pineapple
- balloon
- thief
- puppy
- gem
- gift
- rabbit

Suggested fields:

- `typeId`
- `displayName`
- `iconAsset`
- `targetAsset`
- `defaultFeedback`
- `defaultScore`

## Game Mode

A game mode defines rules over maps and targets.

Examples:

- Find Items: find all requested objects.
- Balloon Blast: pop all balloons or a target number of balloons.
- Crime Hunt: identify and catch thief targets.
- Find Puppies: find hidden puppies.
- Gem Hunt: find all gems.
- Timed Challenge: find as many as possible within the countdown.

Suggested fields:

- `modeId`
- `name`
- `targetSelectionRule`
- `timeLimitSeconds`
- `scoreRule`
- `failureRule`
- `successRule`
- `toolRules`
- `feedbackOverrides`

## Shared Interaction Types

- Tap to find.
- Tap to pop.
- Tap to catch.
- Drag/circle to catch.
- Hint reveal.
- Magnifier zoom.
- Combo streak.
- Wrong tap warning or penalty.

The user-facing feeling changes, but the implementation can remain mostly shared.

## Suggested Demo Modes

For the first demo, build one core implementation and expose a few variants:

- Hidden Object: find 3 categories from the bottom target list.
- Balloon Blast: tap balloons and play pop feedback.
- Crime Hunt: tap or lasso a thief target and play catch feedback.

This demonstrates extensibility without building three separate games.

## Feedback Presets

Potential presets:

- `find_success`: green ring, sparkle, item fly-to-list, success sound.
- `pop_success`: balloon burst animation, particle puff, pop sound.
- `catch_success`: rope/lasso overlay or badge stamp, capture sound.
- `hint_reveal`: highlight pulse for 2 seconds.
- `wrong_tap`: small shake or dim ripple, optional no-score sound.

## Scoring Sketch

Base score:

- Correct hit: +100.
- Combo bonus: +10 to +50 based on streak.
- Remaining time bonus: applied at settlement.
- Wrong tap penalty: optional for harder levels.

Settlement:

- Found count.
- Accuracy.
- Time remaining.
- Score.
- Star rating.
- Rewards.

## Content Pipeline Concern

The hidden-object genre depends heavily on content tooling:

- Map image import.
- Target-point authoring.
- Hit-area editing.
- Preview and test mode.
- Export to JSON.
- Runtime validation.

Even a simple internal target editor or spreadsheet-to-JSON workflow will reduce future production cost significantly.
