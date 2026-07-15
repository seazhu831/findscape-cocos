# Feedback Runtime

# Stage 7E Feedback Runtime Plans

Issue: https://github.com/seazhu831/findscape-cocos/issues/28

This stage adds a pure feedback planning layer between gameplay events and Cocos scene effects.

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

## Runtime Playback

Issue #58 binds preset audio hooks to the portrait Cocos scene:

- `audio-feedback-runtime.ts` converts audible preset plans into one-shot commands.
- `portrait-audio-feedback.ts` preloads unique `AudioClip` resources and plays
  them through one dynamic `AudioSource`.
- Playback uses a 0.65 volume scale so short UI cues sit below the visual action.
- A missing clip logs a warning and does not block scene initialization.
- Settlement and presets without `soundAsset` remain silent.

## Validate Fixtures

From the repository root:

```sh
node tools/content/check-feedback-runtime-fixtures.mjs
```

From `cocos/`:

```sh
npm run check:feedback
npm run check:audio-feedback
```

Current boundaries:

- Feedback plans remain engine-independent.
- The portrait scene owns visual and audio adapters; settlement audio is not
  configured.
