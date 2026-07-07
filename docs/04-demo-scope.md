# Demo Scope

# Recommended First Build

The first implementation should prove the reusable game foundation, not the whole PRD.

## Demo Goal

Deliver a polished, playable Cocos demo that shows:

- The core hidden-object interaction works.
- The architecture can support multiple themes and mode variants.
- The visual direction can match the cozy hand-drawn reference.
- The project can later publish to WeChat mini game and Web.

## Proposed Demo Features

- Home screen.
- Mode or challenge selection.
- One large hand-drawn map scene, placeholder art acceptable at first if custom art is not ready.
- Pan and pinch zoom.
- 30-50 configured target points.
- 3-5 target categories.
- Bottom target list with icons and found counts.
- 60-second timer.
- Score and combo.
- Hint/magnifier tool with limited uses.
- Success feedback: ring, pulse, particles, sound hook.
- Settlement screen.
- Local save for best score and last result.

## Optional Demo Variants

Implement these only if the core loop is already smooth:

- Balloon Blast: same target system with pop feedback.
- Crime Hunt: same target system with catch feedback.
- Find Puppies / Find Gems: same target system with different icons and copy.

## Defer Until Later

- Full backend.
- Login and cloud account binding.
- Payment.
- Monthly card.
- Ad SDK.
- PvP and 2v2.
- Admin backend.
- Large-scale 1000-point content authoring.
- Full art resource volume from the PRD.

## Demo Acceptance Criteria

- User can enter a map, pan/zoom, find targets, and complete or fail a timed round.
- Correct target hits are reliable and feel responsive.
- UI state stays consistent with target state.
- Timer and scoring are deterministic.
- Local result persists after restart.
- Build can run on local Web preview.
- Project structure is ready for WeChat mini game publishing.

## First Engineering Tasks

- Initialize Cocos Creator project.
- Define directory convention.
- Create gameplay data schemas.
- Build map viewport/camera controller.
- Build target point runtime and hit testing.
- Build target list UI.
- Build mode rule controller.
- Add demo level data.
- Add basic feedback effects.
- Add local save adapter.
- Document how to add a new target and map.
