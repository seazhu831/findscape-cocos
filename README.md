# findscape-cocos

Cocos Creator implementation and reusable reference project for a cozy hidden-object mini game family.

The project starts from a PRD for a WeChat mini game and is intended to evolve from demo, to prototype, to full product. It should also serve as a reusable technical and product pattern for future "find it" games with different themes and modes.

## Current Direction

- Main client technology: Cocos Creator.
- Primary demo target: WeChat mini game / mini program.
- Secondary preview target: Web.
- Long-term targets: WeChat, iOS, Android, Web, and possible overseas distribution.

## Core Idea

Build a reusable hidden-object gameplay foundation:

- Large hand-drawn maps.
- Configurable target points and hit areas.
- Mode-specific target selection and scoring.
- Touch interactions such as tap, pop, catch, drag, hint, and magnifier.
- Visual/audio feedback presets.
- Local progress and later cloud sync.

## Start Here

Read these documents first:

- `docs/01-prd-summary.md`
- `docs/02-technical-direction.md`
- `docs/03-gameplay-foundation.md`
- `docs/04-demo-scope.md`
- `docs/05-handoff.md`
- `docs/06-project-plan.md`
- `docs/07-cocos-scaffold.md`
- `docs/08-work-loop.md`
- `docs/09-gameplay-data-schemas.md`
- `docs/10-claude-design-asset-pipeline.md`
- `docs/11-hit-testing.md`
- `docs/12-map-viewport.md`
- `docs/13-round-runtime.md`
- `docs/14-round-view-model.md`
- `docs/15-local-save.md`
- `docs/16-storage-port.md`
- `docs/17-tool-runtime.md`
- `docs/18-round-controller.md`
- `docs/19-mode-variants.md`
- `docs/20-demo-session-flow.md`
- `docs/21-claude-design-asset-manifest.md`
- `docs/22-claude-design-source-intake.md`

The original PRD is preserved at:

- `references/original-prd.docx`

## Initial Build Bias

The first build should prove the core feel:

- Smooth pan and zoom on a large map.
- Reliable target hit testing.
- Bottom target list and count progress.
- 60-second challenge loop.
- Score, combo, hint, and settlement.
- A few mode variants implemented through shared target logic.

Backend, monetization, PvP, monthly card, ads, and admin should wait until the core gameplay feels good.
