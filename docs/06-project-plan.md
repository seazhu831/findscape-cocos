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

Stage completion is not a pause signal. After closing one issue, immediately start the next unblocked issue unless a blocker requires project owner input.

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

- Cocos Creator 3.8.8, selected in issue #39.
- Local Cocos Creator installation and first project import.

Current constraint:

- Resolved on 2026-07-13. Dashboard 2.2.1 and Creator 3.8.8 are installed, the existing `cocos/` directory has completed its first import, and editor-generated metadata is committed.

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

Related static web preview issue: https://github.com/seazhu831/findscape-cocos/issues/22

Related web preview model issue: https://github.com/seazhu831/findscape-cocos/issues/25

Related web preview feedback issue: https://github.com/seazhu831/findscape-cocos/issues/30

Related web preview local best score issue: https://github.com/seazhu831/findscape-cocos/issues/36

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

Related storage port issue: https://github.com/seazhu831/findscape-cocos/issues/14

Related browser storage adapter issue: https://github.com/seazhu831/findscape-cocos/issues/34

Related WeChat storage adapter issue: https://github.com/seazhu831/findscape-cocos/issues/35

Related tool runtime issue: https://github.com/seazhu831/findscape-cocos/issues/15

Related round controller issue: https://github.com/seazhu831/findscape-cocos/issues/16

Related demo session issue: https://github.com/seazhu831/findscape-cocos/issues/18

Related demo session feedback assertion issue: https://github.com/seazhu831/findscape-cocos/issues/31

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

Related mode variant issue: https://github.com/seazhu831/findscape-cocos/issues/17

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

Related asset readiness issue: https://github.com/seazhu831/findscape-cocos/issues/27

Related feedback runtime issue: https://github.com/seazhu831/findscape-cocos/issues/28

Related controller feedback integration issue: https://github.com/seazhu831/findscape-cocos/issues/29

Related web preview loading/error states issue: https://github.com/seazhu831/findscape-cocos/issues/32

Related visible best-score issue: https://github.com/seazhu831/findscape-cocos/issues/67

Related asset manifest issue: https://github.com/seazhu831/findscape-cocos/issues/19

Related source intake issue: https://github.com/seazhu831/findscape-cocos/issues/21

Related Claude Design production handoff issue: https://github.com/seazhu831/findscape-cocos/issues/37

Related Claude Design production asset intake issue: https://github.com/seazhu831/findscape-cocos/issues/38

Related known issues issue: https://github.com/seazhu831/findscape-cocos/issues/33

Dependencies:

- Accepted Claude Design visual direction.
- Working Web preview build.

## Stage 8: Layered Scene Runtime

Architecture plan: `docs/33-scene-runtime-capability-plan.md`

Related planning issue: https://github.com/seazhu831/findscape-cocos/issues/68

Goal:

- Upgrade the demo from a background image with target nodes into a reusable,
  data-driven scene of static decoration, ambient actors, interactive entities,
  foreground occluders, and explicit render layers.

Execution stages:

- Stage 4B: backward-compatible scene entity schema and validation.
- Stage 4C: layered entity registry and mode target projection.
- Stage 4D: budgeted ambient motion runtime.
- Stage 4E: focused camera state machine and region magnifier.
- Stage 4F: target lift, fly-to-HUD, counter pulse, and settlement barrier.
- Stage 4G: authored dense scene slice and concealment metadata.
- Stage 4H: region activation, diagnostics, pooling, and device budgets.

Dependencies:

- Current portrait gameplay loop and config v1.
- Claude Design asset production after the Stage 4B contract is stable.

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

- Which first dense region and actor set Claude Design should produce after the
  Stage 4B schema is stable.
- Whether the first actor-motion asset batch should use sprite frames or Cocos
  AnimationClip-compatible parts; skeletal animation remains optional.
- Physical-device node, animation, texture-memory, and frame-time budgets for the
  representative dense scene.
