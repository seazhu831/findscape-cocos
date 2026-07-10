# Round Controller

# Stage 5E Round Controller Facade

Issue: https://github.com/seazhu831/findscape-cocos/issues/16

This stage adds a pure controller facade that combines round state, tool state, view-model creation, and save-result creation.

## Files

- `cocos/assets/scripts/gameplay/round-controller.ts`: runtime TypeScript controller facade.
- `tools/content/fixtures/round-controller-cases.json`: deterministic controller fixtures.
- `tools/content/check-round-controller-fixtures.mjs`: Node check for controller fixture semantics.

## Responsibilities

The controller handles:

- Creating round state and tool state together.
- Applying map taps.
- Advancing round time and tool cooldowns.
- Using the hint tool.
- Producing updated round view models after each operation.
- Producing feedback plans from round and tool events.
- Producing a saveable round result once the round reaches settlement.

## Cocos Scene Usage

Future scene code should be able to keep one `RoundControllerState`, call controller helpers from touch/timer/tool-button events, then render the returned `RoundViewModel` and trigger effects from returned `feedbackPlans`.

## Validate Fixtures

From the repository root:

```sh
node tools/content/check-round-controller-fixtures.mjs
```

From `cocos/`:

```sh
npm run check:controller
```

Current limitation:

- This is a pure logic facade. It does not create Cocos nodes, subscribe to touch events, render UI, play audio, or call platform storage.
