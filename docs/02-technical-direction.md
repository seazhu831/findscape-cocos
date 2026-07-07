# Technical Direction

# Cocos-first, Web-capable Architecture

The project should follow the PRD and use Cocos Creator as the main client technology. The goal is not to build a single hard-coded hidden-object game, but to build a reusable hidden-object gameplay foundation that can support multiple themes and interaction variants.

## Recommendation

Use Cocos Creator as the core game implementation.

Keep Web/H5 as an important output target and demo-friendly delivery channel, but avoid making the official product a pure WebView wrapper. The product needs stable game rendering, resource management, platform SDK integration, and future real-time modes. Cocos is a better fit for those long-term constraints.

## Why Cocos

- The PRD explicitly names Cocos Creator.
- It supports 2D game scenes, animation, input, physics, resource management, and multi-platform publishing.
- The same TypeScript gameplay logic can be reused across WeChat mini game, Web, iOS, and Android targets.
- It is a better long-term foundation for stacking, puzzle, timed challenges, social modes, and PK.

## Where Web Thinking Still Helps

- UI iteration speed.
- Operation pages and backend admin.
- Marketing pages and H5 previews.
- Share landing pages for overseas SNS and browser links.
- Demo preview builds for fast stakeholder review.

## Suggested Platform Strategy

- Demo target: WeChat mini game / mini program scan-to-play.
- Secondary demo target: Web build for quick browser review.
- App targets: native Cocos builds or a carefully designed shell around Cocos output, not a thin page wrapper.
- Backend/admin: conventional Web stack, separate from the game client.

## Major Engineering Risks

- Large map performance and memory usage.
- WeChat package size limits and resource loading strategy.
- Hit-area authoring and validation for many hidden points.
- Low-end phone frame stability.
- Touch gesture conflicts between map pan, zoom, target tap, and drag interactions.
- Platform-specific SDK code for login, sharing, payment, ads, analytics, and storage.
- Realtime state sync, disconnection handling, and anti-cheat for PvP.

## Initial Technical Shape

Client modules:

- Scene navigation and UI shell.
- Large map camera controller.
- Target registry and hit test system.
- Mode rule engine.
- Feedback/effects system.
- Timer, score, combo, and settlement.
- Hint and tool system.
- Local save adapter.
- Platform adapter layer.
- Resource loading and map bundle management.

Data-driven configuration:

- Maps.
- Levels.
- Target points.
- Target types.
- Game modes.
- Tool behavior.
- Scoring rules.
- UI text and localization-ready labels.

## Demo Implementation Bias

The Demo should prioritize a convincing core feel:

- Smooth pan and zoom.
- Clear target hit feedback.
- Readable bottom target list.
- 60-second challenge loop.
- At least one polished map slice or full map.
- 30-50 configured targets.
- 3-5 target categories.
- A few mode variants implemented through shared target logic.

Avoid over-investing in backend, monetization, or multiplayer before the core hidden-object interaction feels good.
