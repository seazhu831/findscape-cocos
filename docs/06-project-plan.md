# Project Plan

# Capability-first Project Plan

This plan intentionally ignores calendar scheduling. Work should move by validated capability stages: each stage should leave a clear artifact, a GitHub issue record, and a decision trail for the next stage.

## Updated Design Direction

Design assets should be produced through Claude Design instead of waiting for a traditional full art package.

Claude Design should be used for:

- Early map concepts and polished placeholder map slices.
- Target item icons and simple hidden-object sprites.
- UI mood boards and screen mockups.
- Feedback effect references such as ring, pulse, sparkle, pop, and catch states.
- Share image and lightweight promotional art drafts.

Cocos should remain the implementation source of truth. Generated design output should be treated as project assets, then normalized into the repo with consistent naming, dimensions, and manifests.

## Operating Rules

Each stage should create one GitHub issue before or during the work. The issue is the stage log and should include:

- Goal.
- Scope.
- Progress.
- Problems and decisions.
- Dependencies.
- Done criteria.
- Links to commits, docs, builds, screenshots, or assets.

Ongoing work should follow the autonomous loop in `docs/08-work-loop.md`: select the next unblocked stage, record it in an issue, make a granular change, verify, commit, update the issue, push, and continue.

## Commit Granularity

Commits should stay small enough to explain one stage, one coherent capability, or one isolated fix.

Use granular commits so the project history can answer three questions clearly:

- What changed?
- Why did it change?
- Which issue or stage does it belong to?

Commit rules:

- Keep unrelated concerns in separate commits.
- Separate documentation, scaffold setup, gameplay logic, asset imports, and generated content when they are not part of one atomic change.
- Prefer one commit per stage output when the stage is small.
- Split larger stages into capability commits such as schema, runtime logic, UI wiring, asset manifest, and docs.
- Do not mix formatting-only changes with behavior changes unless the formatter is required for the touched files.
- Do not include temporary debug files, local editor state, build output, or unrelated workspace changes.
- Mention the stage issue in the commit body when the commit is part of an open stage.

Suggested commit message shape:

```text
Short imperative summary

- What changed.
- Why it matters.
- Issue: #N
```

## Stage 0: Project Asset Baseline

Status: done.

Issue: https://github.com/seazhu831/findscape-cocos/issues/1

Outputs:

- README expanded with project direction.
- PRD summary, technical direction, gameplay foundation, demo scope, and handoff docs added.
- Original PRD preserved under `references/original-prd.docx`.

Dependencies:

- None.

## Stage 1: Planning And Design Pipeline

Related detail issue: https://github.com/seazhu831/findscape-cocos/issues/7

Goal:

- Establish the working plan and Claude Design asset pipeline.

Scope:

- Add this project plan.
- Define asset categories, naming conventions, and target dimensions.
- Define a reusable Claude Design brief format for maps, items, UI, and feedback effects.
- Decide where generated raw assets and normalized runtime assets should live.

Outputs:

- Project plan.
- Design asset pipeline document.
- First Claude Design prompts or briefs.
- Stage issue with open decisions.

Dependencies:

- Claude Design access and preferred export workflow.
- Cocos Creator version decision.
- Confirmation of first demo art fidelity: rough placeholder, polished placeholder, or near-final.

## Stage 2: Cocos Project Scaffold

Issue: https://github.com/seazhu831/findscape-cocos/issues/4

Goal:

- Create a Cocos Creator project structure suitable for Web preview and later WeChat mini game publishing.

Scope:

- Initialize the Cocos project folder.
- Define module directories for gameplay, config, UI, platform adapters, saves, and tools.
- Add basic TypeScript conventions.
- Document how to open, preview, and build.

Outputs:

- Cocos project skeleton.
- Basic scene and module layout.
- Updated setup documentation.

Dependencies:

- Chosen Cocos Creator version.
- Local Cocos Creator installation or agreed generated structure.

Current constraint:

- The local machine does not currently expose `cocos` CLI or a visible Cocos Creator app, so the repo scaffold should avoid hand-authoring editor-generated metadata until the selected Creator version can generate it.

## Stage 3: Gameplay Data Schemas

Issue: https://github.com/seazhu831/findscape-cocos/issues/6

Goal:

- Make the hidden-object foundation data-driven before building too much scene logic.

Scope:

- Define schemas for maps, target points, target types, game modes, scoring, feedback presets, and tools.
- Add demo JSON data.
- Add validation or lightweight content checks.

Outputs:

- TypeScript interfaces or schema definitions.
- Demo map and target config.
- Content authoring notes.

Dependencies:

- Initial map size and coordinate convention.
- Asset naming convention from the design pipeline.

## Stage 4: Minimal Map Interaction Prototype

Related prework issue: https://github.com/seazhu831/findscape-cocos/issues/8

Related viewport issue: https://github.com/seazhu831/findscape-cocos/issues/9

Related round runtime issue: https://github.com/seazhu831/findscape-cocos/issues/10

Goal:

- Prove the core feel of exploring a large map.

Scope:

- Render one large map or placeholder map.
- Implement pan and zoom.
- Implement target hit testing.
- Show simple correct-hit feedback.

Outputs:

- Playable Web preview scene.
- Target hit test implementation.
- Recorded notes on performance and touch feel.

Dependencies:

- Placeholder or Claude Design map asset.
- Demo target config.

## Stage 5: Core Round Loop

Related view model issue: https://github.com/seazhu831/findscape-cocos/issues/12

Related local save issue: https://github.com/seazhu831/findscape-cocos/issues/13

Goal:

- Turn the prototype into a complete hidden-object round.

Scope:

- Bottom target list.
- Timer.
- Score and combo.
- Hint behavior.
- Settlement screen.
- Local best score or last result save.

Outputs:

- Playable 60-second challenge loop.
- Local persistence adapter.
- Stage issue with UX and logic decisions.

Dependencies:

- Stable target runtime from Stage 4.
- UI placeholder assets or Cocos-native temporary UI.

## Stage 6: Mode Variants

Goal:

- Demonstrate that the system is reusable across multiple hidden-object-like modes.

Scope:

- Hidden Object mode.
- Balloon Blast mode.
- Crime Hunt or Find Puppies mode.
- Feedback preset overrides per mode.

Outputs:

- Shared target system used by multiple modes.
- Mode config examples.
- Notes on what is truly shared versus mode-specific.

Dependencies:

- Core round loop.
- Target category assets and feedback references.

## Stage 7: Asset Pass And Demo Polish

Goal:

- Make the demo presentable without expanding product scope.

Scope:

- Replace rough placeholders with Claude Design generated assets where useful.
- Add basic audio hooks.
- Improve feedback timing.
- Add loading and fallback states.
- Capture screenshots or short demo notes.

Outputs:

- Polished playable demo.
- Asset manifest.
- Known issue list.

Dependencies:

- Accepted Claude Design visual direction.
- Working Web preview build.

## Deferred Scope

These should remain out of the first implementation path unless explicitly reprioritized:

- Backend.
- Login and account binding.
- Cloud sync.
- Payment.
- Ads.
- Monthly card.
- PvP, 2v2, and realtime sync.
- Admin backend.
- Large-scale production content tooling.

## Open Decisions

- Cocos Creator version.
- First preview target: Web-only first, or WeChat mini game immediately.
- Exact Claude Design export format and handoff process.
- Whether raw generated assets should be committed, or only normalized runtime assets.
- Initial art fidelity target.
- First mode set: one core mode only, or three variants from the beginning.
