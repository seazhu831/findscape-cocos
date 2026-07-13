# Cocos Workspace

This folder is the Cocos Creator client project boundary.

The selected editor version is **Cocos Creator 3.8.8**. The repository does not include editor-generated Cocos metadata yet because the local machine does not currently expose a Cocos Creator installation or CLI. Install 3.8.8 through Cocos Dashboard, then import this existing folder and let that exact editor version generate compatible project files and `.meta` assets.

See `../docs/30-cocos-creator-version-and-initialization.md` for the decision, installation procedure, and first-open verification checklist.

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

After Cocos Creator 3.8.8 is installed:

1. Open this `cocos/` folder as a Cocos Creator project.
2. Let Creator generate required settings and metadata.
3. Keep generated cache folders such as `library/`, `local/`, `temp/`, and `build/` out of git.
4. Commit only project settings, scripts, scenes, prefabs, configs, and normalized runtime assets needed by the team.

## Static Web Preview

Before Cocos Creator metadata is available, a lightweight static preview exists under `web-preview/`.

From this folder:

```sh
npm run preview:web
```

Then open `http://127.0.0.1:4173/cocos/web-preview/`.
