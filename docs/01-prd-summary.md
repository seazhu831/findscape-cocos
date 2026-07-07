# PRD Summary

# findscape-cocos

This repository is intended to become the Cocos Creator implementation and reusable reference case for a cozy hidden-object mini game family.

The original project PRD describes a WeChat Mini Program / mini game that starts with a playable demo, then grows into a full hidden-object product with mini games, social features, ranking, monetization, backend operations, and later multi-platform expansion.

## Product Positioning

- Genre: cozy casual hidden-object game.
- Primary platform: WeChat Mini Program / WeChat mini game.
- Long-term platform direction: WeChat, iOS, Android, Web, and possible overseas distribution.
- Target audience: 15-35 year old users who enjoy lightweight, low-pressure, hand-drawn casual games.
- Session style: short, interruptible play sessions for commuting, lunch breaks, bedtime, and social sharing.

## Main Gameplay Pillars

- Hidden-object scene exploration.
- Tap-to-find target interactions.
- Time-limited challenge rounds.
- Hint and magnifier tools.
- Score, combo, remaining-time bonus, and settlement.
- Reusable target-trigger logic for variants such as find pineapple, balloon popping, catch thief, find puppies, find gems, and similar modes.

## Planned Game Modes

- Hidden object: core map-based search gameplay.
- Stacking mini game: physics-based drag, stack, balance, fail on top boundary.
- Puzzle mini game: 3x3, 4x4, and 5x5 difficulties.
- Hide and seek: one player hides objects, the other searches within a time limit.
- Multiplayer PK: random match or friend room, shared map, time-limited race, ranking by found count and time.

## Milestones From PRD

### Prototype / Demo

Target: playable demo for presentation and first acceptance.

Scope:

- 1 custom hand-drawn multi-screen map.
- 50 object types.
- Random hidden-object positions.
- Tap interaction with sound and animation feedback.
- 60-second challenge mode.
- Basic timer, score, and hint.
- Stacking mini game prototype.
- Home page and profile page.
- Local offline storage for scores and basic user data.
- WeChat scan-to-play build and Demo app package.
- Source code, assets, docs, and test report.

### Alpha

Scope:

- Complete hidden-object system.
- New game scene map and progressive level unlock.
- Full tool system: hint, magnifier, time extension.
- Level progress, star rating, and persisted play data.
- Stacking full version.
- Puzzle mode.
- Social share and ranking.
- Asynchronous helper share flow for WeChat and overseas SNS/link sharing.
- Cloud storage, achievements, collection system, avatars, titles, monthly card.

### Beta

Scope:

- 4 additional scene maps.
- Two-player hide-and-seek.
- Co-op / PvP / 2v2.
- Shop and item system.
- Payment UI and SDK integration.
- User analytics, anti-cheat, operation logs.
- Basic admin backend.

### Launch Version

Scope:

- Ad SDK and platform SDK integration.
- Full WeChat platform compliance.
- Full admin backend, user management, dashboards, item config, feature switches.
- 6 months free support and warranty, then paid maintenance.

## Art Direction

- Cozy hand-drawn visual style.
- Soft lines, warm colors, no sharp aggressive shapes.
- Cute simplified IP character.
- PNG transparent assets at 2x resolution.
- MP3 sound assets.
- Layered UI source files and standardized sliced assets.

## Technical Requirements From PRD

- Client: Cocos Creator.
- Backend: PHP 8.1 + ThinkPHP.
- Database: MySQL 8 and Redis.
- Realtime: WebSocket for PK.
- Auth: JWT.
- Resource delivery: Tencent COS + CDN.
- Source management in the original PRD: Gitee. This repository uses GitHub.

## Acceptance Highlights

Demo:

- Hidden-object and stacking game loops run normally.
- No crash, freeze, or major stutter in demo play.
- Basic pages are accessible.
- WeChat scan-to-play or APK install works.
- Source, docs, assets, and test report are complete.

Full versions:

- Full business flow is closed.
- No serious bugs or missing core features.
- Compatible with iOS, Android, WeChat, and other planned platforms.
- First load time target: <= 3 seconds.
- Stable under multi-user concurrent access.
- WeChat compliance and review pass.

## Ambiguities To Confirm

- Project name and IP name are still placeholders: `XXXX`.
- Some PRD quantities use `?00` and need clarification.
- The PRD says the overall cycle starts on 2026-05-26, while the Prototype section says 2026-05-20.
- It mentions both WeChat Mini Program and Demo app package; confirm whether APK is required for Demo acceptance.
- The acceptance section mentions Steam, which is outside the earlier platform scope and should be confirmed.
