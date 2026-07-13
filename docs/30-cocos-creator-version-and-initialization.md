# Cocos Creator Version And Initialization

Issue: https://github.com/seazhu831/findscape-cocos/issues/39

Decision date: 2026-07-13

## Version Decision

Use **Cocos Creator 3.8.8** for the Findscape demo.

Do not open or upgrade this project with another Creator version unless the version decision is intentionally revisited and recorded first.

## Why 3.8.8

- Cocos marks the 3.8 line as LTS in the official 3.8 manual.
- Cocos recommends Creator 3.x for new projects; Creator 2.x updates ended in 2023 and its APIs are not compatible with 3.x.
- 3.8.8 is the latest published 3.8 patch on the official Creator download page as of the decision date.
- The official 3.8 workflow supports Web and WeChat Mini Game publishing, including portrait orientation, engine configuration, resource caching, and mini-game packaging.
- The project is a new 2D implementation with no legacy Creator metadata or 2.x API dependency to preserve.
- Existing pure TypeScript gameplay modules do not import `cc` yet, so they can be wrapped by 3.8 components without a migration layer.

Official references:

- 3.8 LTS manual: https://docs.cocos.com/creator/3.8/manual/en/index.html
- 3.8.8 release/download page: https://www.cocos.com/creator-download
- Install and launch: https://docs.cocos.com/creator/3.8/manual/en/getting-started/install/index.html
- Project structure: https://docs.cocos.com/creator/3.8/manual/en/getting-started/project-structure/index.html
- WeChat Mini Game publishing: https://docs.cocos.com/creator/3.8/manual/zh/editor/publish/publish-wechatgame.html

## Local Environment Audit

- Host architecture: Apple Silicon (`arm64`).
- Host operating system at decision time: macOS 26.5.1.
- No Cocos Dashboard, Cocos Creator application, or Creator CLI is currently visible under `/Applications` or the shell path.
- The repository already contains `cocos/package.json` and `cocos/assets/`, which are the project boundary expected by Creator 3.x.

The current macOS version is newer than the environments explicitly discussed in much of the 3.8 documentation. Editor launch, asset import, preview, and build must therefore be verified on this machine rather than assumed.

## Installation Step Requiring Owner Access

1. Download and install Cocos Dashboard for macOS from the official Creator download page.
2. Launch Dashboard and sign in with a Cocos developer account.
3. In Dashboard, install the exact editor version `3.8.8`.
4. Import the existing project directory:

```text
/Users/sea/WorkSpace/byxy/github/findscape-cocos/cocos
```

5. Open it with 3.8.8 and allow the editor to complete its first asset import.

Do not create a separate empty project and copy this repository into it. Import the existing `cocos/` directory so generated metadata is attached to the committed assets and scripts.

## First-Open Repository Rules

After the editor finishes importing:

- Commit generated `.meta` files under `cocos/assets/`.
- Commit project settings under `cocos/settings/` and any editor-maintained project configuration required by 3.8.8.
- Do not commit `cocos/library/`, `cocos/local/`, `cocos/temp/`, `cocos/build/`, or `cocos/profiles/`.
- Inspect editor changes before committing; do not accept unrelated asset renames or path migration.
- Keep semantic runtime paths from `design/claude-design/asset-manifest.json` stable.

## Initialization Verification

The version blocker is resolved only after all of these pass:

- Creator 3.8.8 opens the existing project without project-version migration errors.
- All runtime PNGs import without missing or broken texture warnings.
- TypeScript compilation completes without errors.
- A minimal 2D scene can be created, saved, and reopened.
- Browser preview launches successfully.
- A Web Mobile portrait build completes.
- WeChat Mini Game appears as a build target and accepts portrait orientation.
- `npm run check:all` still passes outside the editor.

Actual WeChat device preview can remain a later validation step if WeChat DevTools or an AppID is not yet available.

## Immediate Post-Initialization Work

Once 3.8.8 is installed and the first-open verification passes:

1. Commit editor-generated project metadata as its own granular stage.
2. Migrate gameplay config from the landscape placeholder contract to the accepted 1600x2400 portrait map.
3. Create the map scene, camera/viewport binding, and seven target sprite nodes.
4. Rebuild the HUD from the accepted 1080x1920 reference and design tokens.
5. Slice or reconstruct feedback sheets and bind tweens/particles to feedback plans.
6. Verify Web Mobile first, then WeChat Mini Game.
