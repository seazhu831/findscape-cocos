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
