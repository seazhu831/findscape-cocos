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

Continue from the initialized Cocos Creator 3.8.8 project and build the first portrait scene from the migrated gameplay contract.

Recommended prompt:

> We are in `/Users/sea/WorkSpace/byxy/github/findscape-cocos`. Read `docs/05-handoff.md`, `docs/30-cocos-creator-version-and-initialization.md`, `docs/31-portrait-gameplay-contract.md`, and the design handoff. Create the first 1600x2400 portrait Cocos scene, bind the map and seven target sprites, and verify placement with screenshots before implementing HUD and feedback. Use granular issue-backed commits.

## Files To Read First

- `docs/01-prd-summary.md`
- `docs/02-technical-direction.md`
- `docs/03-gameplay-foundation.md`
- `docs/04-demo-scope.md`
- `docs/30-cocos-creator-version-and-initialization.md`
- `docs/31-portrait-gameplay-contract.md`
- `design/claude-design/source/README.md`
- `references/original-prd.docx`

## Open Questions

- What is the final product/IP name?
- Is the first demo required to publish to WeChat immediately, or is Web preview enough for initial validation?
- How many mode variants should appear in the first demo?
- Is the Demo app package actually required, or only WeChat scan-to-play?

## Suggested Initial Repo Structure

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

The `cocos/` directory is initialized and pinned to Cocos Creator 3.8.8. The first Claude Design asset batch is imported with stable runtime paths and typed `.meta` files. The gameplay contract now uses the accepted 1600x2400 map and portrait anchors. The next dependency chain is scene creation, HUD binding, feedback implementation, Web Mobile build, then WeChat validation.
