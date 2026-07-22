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

The first iPhone preview pass confirmed startup, rendering, target taps, and map
dragging. It also exposed two device-only usability problems: OGG feedback audio
was silent on iOS, and the original top/bottom HUD obscured search targets. Both
fixes are now in a new preview build. The next platform stage is:

1. Complete the pending physical-device acceptance pass when available.
2. Start Stage 4H region activation and diagnostics against the accepted dense
   lower-garden slice, then establish physical-device budgets.

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
- The release WeChat build uses the production AppID, a trimmed/mangled engine,
  and a `resources` subpackage. Its measured main package is `2.48 MiB`, below
  the `4 MiB` limit, and the DevTools simulator reports zero runtime errors.
- All five feedback clips use iOS-compatible MP3 files. The latest WeChat build
  contains five MP3 files and no OGG files; DevTools reports `Loaded 5/5 clips`.
- The search HUD is compact, the target strip can be collapsed, and map gestures
  temporarily fade the remaining HUD chrome. A `390x844` regression pass covered
  collapse, restore, and dragging with zero browser console errors.
- The scene selects the async `wx` storage adapter in WeChat and falls back to
  browser storage elsewhere. `findscape.localSave.v1` was read before and after
  a DevTools recompile with the same best-score and last-result payload. Full
  iPhone exit/re-entry restoration remains pending in Issue #65.
- Stage 4G is complete: the dense lower garden now contains four static clusters,
  two six-frame ambient actors, and target-linked puppy and gem occluders. Its
  intake, runtime mapping, tuning, and browser acceptance are recorded in
  `docs/41-dense-region-runtime.md`.
- Startup now opens the native mode selector. Each mode card shows its restored
  best score and star rating (`BEST --` for an unplayed mode); settlement shows
  `NEW BEST` only when the current result replaced the saved record. A lower
  follow-up score leaves the historical best unchanged.
- Stage 4B is complete: config v1 now supports scene entities, semantic layers,
  reusable motion profiles, target/entity links, concealment metadata, and
  deterministic validation while preserving legacy configs.
- Stage 4C is complete: a pure entity registry projects mode targets, the Cocos
  scene creates five semantic layer roots, missing nodes can load from Resources,
  and Replay/mode changes reset entity state through one path.
- Stage 4D is complete. Deterministic motion planning, a 24-animation default
  budget, stable phase offsets, offscreen policies, and Tween, sprite-frame, and
  AnimationClip drivers animate visual children without moving semantic hit
  nodes. The accepted Claude Design thief and puppy frame batch is preserved,
  promoted, validated, imported, and covered by Web Mobile regression checks.
- Stage 4D implementation and acceptance details are in
  `docs/37-ambient-motion-runtime.md`.
- Stage 4E is complete. Logical viewport state now drives map drag and
  magnifier focus, preserving the current region and exact restore viewport.
  Focus transitions are cancellable across settlement, Replay, and mode change;
  focused target taps and Stage 4D motion were verified at `390x844`.
- Stage 4E implementation and acceptance details are in
  `docs/38-focus-camera-runtime.md`.
- Stage 4F is complete. `tapToFind` targets lift and fly to a matching HUD slot
  through cancellable visual proxies. Counts update on arrival, collapsed HUD
  state is respected, concurrent flights are supported, and final settlement
  waits for all in-flight targets.
- Stage 4F implementation and acceptance details are in
  `docs/39-target-collection-presentation.md`.

## Files To Read First

- `docs/01-prd-summary.md`
- `docs/02-technical-direction.md`
- `docs/03-gameplay-foundation.md`
- `docs/04-demo-scope.md`
- `docs/30-cocos-creator-version-and-initialization.md`
- `docs/31-portrait-gameplay-contract.md`
- `docs/32-wechat-build-environment.md`
- `docs/33-scene-runtime-capability-plan.md`
- `docs/25-known-issues.md`
- `docs/08-work-loop.md`
- `design/claude-design/source/README.md`
- `references/original-prd.docx`

## Open Questions

- What is the final product/IP name?
- When should the verified Web Mobile demo move to WeChat device validation?
- Is the Demo app package actually required, or only WeChat scan-to-play?

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
as MP3 with stable runtime paths and typed `.meta` files. Scene creation, HUD binding,
visual feedback, the shared round loop, three modes, Web Mobile builds, browser
and WeChat persistence are complete. Runtime SFX preload and one-shot playback
are also bound. WeChat DevTools is installed, production AppID
`wx04421302f08791bc` is pinned, and the portrait `wechatgame` package builds and
runs in the DevTools simulator. Engine trimming, release mangling, and the
`resources` subpackage reduce the measured main package to `2.48 MiB`. The
remaining dependency chain is the second iPhone preview pass: audio confirmation,
HUD usability confirmation, and full exit/re-entry persistence confirmation on
the visible mode-card best scores.
