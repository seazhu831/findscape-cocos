# Tool Runtime

# Stage 5D Hint Tool Runtime

Issue: https://github.com/seazhu831/findscape-cocos/issues/15

This stage adds pure runtime logic for the first tool behavior: hint reveal.

## Files

- `cocos/assets/scripts/gameplay/tool-runtime.ts`: runtime TypeScript helper for tool state and hint usage.
- `tools/content/fixtures/tool-runtime-cases.json`: deterministic tool fixtures.
- `tools/content/check-tool-runtime-fixtures.mjs`: Node check for tool fixture semantics.

## Responsibilities

The tool runtime handles:

- Creating per-round tool state from mode tool config.
- Tracking uses remaining.
- Tracking cooldown remaining.
- Advancing cooldowns.
- Selecting the first not-yet-found selected target for hint reveal.
- Emitting `hintReveal` or `toolUnavailable` events.

## Hint Behavior

`useHintTool` returns:

- `used`: hint consumed one use and selected a target.
- `unavailable`: tool does not exist or has no uses remaining.
- `coolingDown`: tool is still cooling down.
- `noTargets`: all selected targets have already been found.

The Cocos layer should turn `hintReveal` into a highlight pulse using the configured duration.

## Validate Fixtures

From the repository root:

```sh
node tools/content/check-tool-runtime-fixtures.mjs
```

From `cocos/`:

```sh
npm run check:tools
```

Current limitation:

- This does not render the hint highlight. It only emits the target and duration needed by a future feedback layer.
