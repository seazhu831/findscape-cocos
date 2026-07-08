# Round Runtime

# Stage 4C Round Runtime Core

Issue: https://github.com/seazhu831/findscape-cocos/issues/10

This stage adds the pure round-state logic needed before Cocos scene and UI wiring.

## Files

- `cocos/assets/scripts/gameplay/round-runtime.ts`: runtime TypeScript helper for hidden-object round state.
- `tools/content/fixtures/round-runtime-cases.json`: deterministic round fixtures.
- `tools/content/check-round-runtime-fixtures.mjs`: Node check for round runtime fixture semantics.

## Runtime Responsibilities

The round runtime handles:

- Creating a round from a mode runtime config.
- Tracking selected, found, and remaining targets.
- Handling correct hits, duplicate hits, and wrong taps.
- Advancing time and emitting expiration events.
- Maintaining score, combo streak, correct hit count, wrong tap count, elapsed time, and remaining time.
- Marking rounds as `playing`, `completed`, or `expired`.
- Emitting events for UI and feedback layers.

## Event Model

Round updates can emit:

- `correctHit`
- `duplicateHit`
- `wrongTap`
- `roundCompleted`
- `roundExpired`

The Cocos scene should use these events to trigger feedback presets, HUD updates, sounds, and settlement transitions.

## Validate Fixtures

From the repository root:

```sh
node tools/content/check-round-runtime-fixtures.mjs
```

From `cocos/`:

```sh
npm run check:round
```

Current limitation:

- TypeScript compilation is not run yet because the local TypeScript/Cocos toolchain is not initialized.
- UI state, animations, sounds, and settlement screens are still future Cocos scene work.
