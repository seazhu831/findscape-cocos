# Cocos Workspace

This folder is the Cocos Creator client project boundary.

The selected editor version is **Cocos Creator 3.8.8**. This folder has completed its first import with that exact version and includes the generated project settings and `.meta` assets required for stable team imports.

Creator 3.8.8 showed an AssetDB startup race on this host. Keep `extensions/findscape-asset-db-bootstrap/` enabled while the project remains on 3.8.8; its README records the failure mode, verification, and removal condition.

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

1. Open this `cocos/` folder with Cocos Creator 3.8.8.
2. Allow asset refresh to finish before editing scenes or committing metadata.
3. Confirm the console contains no `[Findscape] Cocos Creator asset handlers were not available` error.
4. Keep generated cache folders such as `library/`, `local/`, `temp/`, and `build/` out of git.
5. Commit only project settings, scripts, scenes, prefabs, configs, normalized runtime assets, and their `.meta` files.

## Static Web Preview

Before Cocos Creator metadata is available, a lightweight static preview exists under `web-preview/`.

From this folder:

```sh
npm run preview:web
```

Then open `http://127.0.0.1:4173/cocos/web-preview/`.
