# Handoff

# Context For Next Session

Repository: `findscape-cocos`

Purpose: build a Cocos Creator hidden-object mini game foundation that can become both a playable demo and a reusable reference case for future "find it" style games.

## What Happened Before This Repo

The original working folder contained a PRD Word document for a cozy hidden-object WeChat Mini Program game. The PRD was read and summarized. The technical direction was discussed.

Key decision:

- Use Cocos Creator, following the PRD.
- Do not build a pure WebView wrapper as the main product path.
- Keep Web/H5 output useful for preview and possible future distribution.
- Treat the game as a reusable hidden-object framework, not a one-off hard-coded mini game.

## Important Product Interpretation

The game can support several reference modes:

- Find pineapple / find item.
- Balloon pop.
- Catch thief.
- Find puppies.
- Find gems.

These should share the same underlying target system:

- Large map.
- Target points.
- Hit areas.
- Target categories.
- Trigger behavior.
- Feedback preset.
- Scoring and settlement.

The apparent differences are mostly in UI copy, target selection rules, touch behavior, and animation/audio feedback.

## Suggested Next Step

The portrait Cocos demo is playable and verified. The remaining
external-dependency stage is:

1. Open the project in WeChat DevTools with a usable AppID, build the Mini Game,
   bind the WeChat storage adapter, and validate on device.

Recommended prompt:

> We are in `/Users/sea/WorkSpace/byxy/github/findscape-cocos`. Read
> `docs/05-handoff.md`, `docs/25-known-issues.md`, and `docs/08-work-loop.md`.
> Continue from the verified portrait Cocos demo. Use one issue per stage,
> granular commits, Web Mobile regression checks, and keep working until a real
> owner-input or external-tool blocker is reached.

## Current Verified State

- Cocos Creator is pinned to `3.8.8`; normalized Claude Design assets and typed
  metadata are committed.
- The `1600x2400` portrait map contains seven independent target nodes and
  supports bounded single-touch dragging.
- Hidden Object, Balloon Blast, and Crime Hunt share the round controller and
  can be selected from the native mode panel.
- Timer, score, combo, target list, tools, cooldowns, visual feedback,
  settlement, replay, browser persistence, loading, and startup error fallback
  are connected to the Cocos scene.
- The strongest deterministic check is `cd cocos && npm run check:all`.
- Web Mobile has been repeatedly built and exercised at `390x844`; Creator CLI
  success currently returns the known non-zero exit code 36.

## Files To Read First

- `docs/01-prd-summary.md`
- `docs/02-technical-direction.md`
- `docs/03-gameplay-foundation.md`
- `docs/04-demo-scope.md`
- `docs/30-cocos-creator-version-and-initialization.md`
- `docs/31-portrait-gameplay-contract.md`
- `docs/25-known-issues.md`
- `docs/08-work-loop.md`
- `design/claude-design/source/README.md`
- `references/original-prd.docx`

## Open Questions

- What is the final product/IP name?
- When should the verified Web Mobile demo move to WeChat device validation?
- Is the Demo app package actually required, or only WeChat scan-to-play?
- Who will provide or approve the five short feedback SFX files?

## Repository Shape

```text
findscape-cocos/
  docs/
    01-prd-summary.md
    02-technical-direction.md
    03-gameplay-foundation.md
    04-demo-scope.md
    05-handoff.md
  references/
    original-prd.docx
  cocos/
    assets/
    settings/
    package.json
  tools/
    content/
  README.md
```

The `cocos/` directory is initialized and pinned to Cocos Creator 3.8.8. The
first Claude Design asset batch and five Kenney CC0 feedback clips are imported
with stable runtime paths and typed `.meta` files. Scene creation, HUD binding,
visual feedback, the shared round loop, three modes, Web Mobile builds, and
browser persistence are complete. Runtime SFX preload and one-shot playback are
also bound. The remaining dependency chain is WeChat DevTools/AppID validation.
