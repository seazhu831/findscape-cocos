# Cocos Workspace

This folder is reserved for the Cocos Creator client project.

The current repository does not include editor-generated Cocos metadata yet because the local machine does not currently expose a Cocos Creator installation or `cocos` CLI. Keep this folder as a stable project boundary, then open it with the selected Cocos Creator version to let the editor generate compatible project files and `.meta` assets.

## Intended Targets

- Primary runtime: WeChat mini game.
- First preview target: Web preview, unless reprioritized.
- Long-term targets: WeChat, iOS, Android, Web.

## Directory Intent

- `assets/`: Cocos runtime assets and scripts.
- `assets/scripts/`: TypeScript gameplay and app modules.
- `assets/resources/config/`: JSON-like data for maps, targets, modes, scoring, and tools.
- `assets/resources/art/`: normalized runtime art assets.
- `settings/`: Cocos Creator project settings after the project is opened by the editor.

## Creator Handoff

After Cocos Creator is installed and the target version is chosen:

1. Open this `cocos/` folder as a Cocos Creator project.
2. Let Creator generate required settings and metadata.
3. Keep generated cache folders such as `library/`, `local/`, `temp/`, and `build/` out of git.
4. Commit only project settings, scripts, scenes, prefabs, configs, and normalized runtime assets needed by the team.
