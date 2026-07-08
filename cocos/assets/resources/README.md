# Resources

Use this folder for runtime-loadable resources.

- `config/`: map, target, mode, scoring, tool, and feedback data.
- `art/`: normalized runtime art assets.
- `audio/`: sound assets.

Raw design exports should not be mixed directly with runtime assets unless they are already normalized, named, and sized for the game client.

Current demo config:

- `config/demo-gameplay.json`

Validate from the repository root:

```sh
node tools/content/validate-gameplay-config.mjs cocos/assets/resources/config/demo-gameplay.json
node tools/content/preview-gameplay-modes.mjs cocos/assets/resources/config/demo-gameplay.json
```
