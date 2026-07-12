# Demo Session Flow

Issue: https://github.com/seazhu831/findscape-cocos/issues/18

This stage adds a pure app-level flow for the future Cocos scenes. It keeps scene orchestration outside editor-generated metadata while still proving the demo path end to end.

## Runtime Helper

`cocos/assets/scripts/app/demo-session.ts` exposes:

- `createDemoSessionContext`: builds config indexes and mode summaries.
- `createInitialDemoSessionState`: starts from Home with optional save data.
- `showModeSelect`: moves to Mode Select and clears active round data.
- `startDemoRound`: creates round controller state for a selected mode.
- `applyDemoSessionTap`: routes map taps into the active round.
- `applyDemoSessionTick`: advances timer and tool cooldowns.
- `applyDemoSessionHint`: uses the hint tool.
- `returnToModeSelect`: exits settlement or round state back to selection.

Session updates expose round events, tool events, and feedback plans so a future Cocos scene can render HUD changes and play effects from one app-level result.

## State Flow

```text
home
  -> modeSelect
  -> round
  -> settlement
  -> modeSelect
```

When a round reaches settlement, the session creates a `RoundResultRecord` and applies it to `LocalSaveData`.

## Cocos Binding Notes

The future Cocos scene can bind this module as a small state machine:

- Home buttons call `showModeSelect`.
- Mode cards use `context.modeSummaries`.
- Map taps call `applyDemoSessionTap`.
- The frame loop calls `applyDemoSessionTick`.
- Hint UI calls `applyDemoSessionHint`.
- Settlement actions call `returnToModeSelect`.

Storage IO remains outside this helper. A Cocos adapter should load `LocalSaveData` before creating state and persist `state.saveData` after settlement.

## Verification

From `cocos/`:

```sh
npm run check:session
npm run check:all
```

`tools/content/fixtures/demo-session-cases.json` covers mode selection, starting rounds, hint usage, completion save updates, expiration save updates, and returning to mode select.
