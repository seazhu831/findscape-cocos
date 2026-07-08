# Round View Model

# Stage 5A HUD And Settlement View Models

Issue: https://github.com/seazhu831/findscape-cocos/issues/12

This stage adds pure view-model helpers for the future Cocos HUD, bottom target list, timer, and settlement screen.

## Files

- `cocos/assets/scripts/ui/round-view-model.ts`: runtime TypeScript helper that converts mode runtime config and round state into UI-friendly structures.
- `tools/content/fixtures/round-view-model-cases.json`: deterministic HUD and settlement fixtures.
- `tools/content/check-round-view-model-fixtures.mjs`: Node check for view-model fixture semantics.

## View Models

The helper produces:

- `RoundHudViewModel`: mode, status, score, combo, progress, timer, and target list.
- `TargetListItemViewModel`: target type, icon, found count, required count, and completion state.
- `TimerViewModel`: remaining seconds, formatted label, urgency, and progress.
- `SettlementViewModel`: title, found count, score, accuracy, time remaining, and star rating.

## Timer Urgency

- `normal`: more than 15 seconds remaining.
- `warning`: 6 to 15 seconds remaining.
- `critical`: 0 to 5 seconds remaining.

## Settlement Rules

Initial star rating rules:

- 3 stars: completed and accuracy is at least 90%.
- 2 stars: at least 75% completion and accuracy is at least 70%.
- 1 star: at least 40% completion.
- 0 stars: below those thresholds or no progress.

These are intentionally simple and should be tuned after real playtests.

## Validate Fixtures

From the repository root:

```sh
node tools/content/check-round-view-model-fixtures.mjs
```

From `cocos/`:

```sh
npm run check:view-model
```

Current limitation:

- This verifies view-model semantics only. Actual Cocos nodes, layout, animations, and responsive text still require scene implementation and visual QA.
