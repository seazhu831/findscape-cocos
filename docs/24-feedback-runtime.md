# Feedback Runtime

# Stage 7E Feedback Runtime Plans

Issue: https://github.com/seazhu831/findscape-cocos/issues/28

This stage adds a pure feedback planning layer between gameplay events and future Cocos scene effects.

## Files

- `cocos/assets/scripts/feedback/feedback-runtime.ts`: TypeScript feedback plan helper.
- `tools/content/fixtures/feedback-runtime-cases.json`: deterministic feedback fixtures.
- `tools/content/check-feedback-runtime-fixtures.mjs`: Node check for feedback semantics.

## Responsibilities

The feedback runtime converts round and tool events into render/playback plans:

- `correctHit`: use the target feedback preset, including mode feedback overrides.
- `duplicateHit`: use the `wrong_tap` preset as a light negative response.
- `wrongTap`: use the `wrong_tap` preset.
- `hintReveal`: use the `hint_reveal` preset and the tool event duration.
- `roundCompleted`: emit a settlement plan with the final score.
- `roundExpired`: emit a settlement plan with the final score.

Preset plans include:

- Feedback preset ID.
- Visual names from config.
- Optional sound asset hook from config.
- Duration in milliseconds.
- Optional target, tool, score, or final score metadata.

Settlement plans intentionally do not invent art or audio. The future Cocos scene can use them to open settlement UI, play native transitions, or trigger a later configured preset.

## Validate Fixtures

From the repository root:

```sh
node tools/content/check-feedback-runtime-fixtures.mjs
```

From `cocos/`:

```sh
npm run check:feedback
```

Current limitation:

- This does not instantiate Cocos nodes, particles, tweens, or audio sources.
- Actual visual/audio playback remains a scene adapter task after runtime assets exist.
