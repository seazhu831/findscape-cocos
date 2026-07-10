# Mode Variants

Issue: https://github.com/seazhu831/findscape-cocos/issues/17

This stage records how the first three demo modes share one runtime foundation while still expressing different player verbs and feedback.

## Runtime Helper

`cocos/assets/scripts/config/mode-capabilities.ts` derives a `ModeVariantSummary` from `ModeRuntimeConfig`.

The summary includes:

- Selected target count and target type IDs.
- Target selection label for readable previews.
- Effective trigger behaviors after mode feedback overrides.
- Effective feedback preset IDs after mode feedback overrides.
- Enabled tools.
- Capability IDs for the UI/controller surface.
- Shared runtime blocks that should stay reusable across modes.

## Demo Modes

Hidden Object:

- Selects a mixed target list by category count.
- Uses `tapToFind` and `find_success`.
- Enables hint and magnifier.

Balloon Blast:

- Selects all balloon targets.
- Overrides the mode-specific verb to `tapToPop`.
- Uses `pop_success`.
- Enables hint.

Crime Hunt:

- Selects all thief targets.
- Overrides the mode-specific verb to `tapToCatch`.
- Uses `catch_success`.
- Enables hint.

## Shared Versus Mode-Specific

Shared runtime:

- Target selection.
- Hit testing.
- Round state.
- Scoring.
- Timer.
- Tools.
- View model.
- Storage.

Mode-specific expression:

- Target selection rule.
- Trigger behavior.
- Feedback preset.
- Enabled tools.
- Copy and art direction attached to mode and target type metadata.

## Verification

From `cocos/`:

```sh
npm run check:modes
npm run check:all
```

`tools/content/fixtures/mode-capabilities-cases.json` locks the current three mode summaries so future config, asset, or UI work can detect accidental regressions.
