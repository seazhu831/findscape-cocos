# Cocos Scaffold

# Stage 2 Scaffold Notes

Issue: https://github.com/seazhu831/findscape-cocos/issues/4

This stage created the repository-level Cocos workspace boundary. It was initialized by Cocos Creator 3.8.8 on 2026-07-13.

## Initialization Status

- Cocos Dashboard 2.2.1 and Cocos Creator 3.8.8 are installed.
- Creator opened the existing `cocos/` directory and generated project identity, package settings, and asset metadata.
- Generated cache and local-state directories remain ignored.

## Version Stance

The project is pinned to Cocos Creator 3.8.8. Do not open it with another Creator version unless that decision is recorded first.

## Created Structure

```text
cocos/
  README.md
  package.json
  assets/
    README.md
    scripts/
      README.md
      app/
      config/
      feedback/
      gameplay/
      platform/
      storage/
      ui/
    resources/
      README.md
      art/
      audio/
      config/
  settings/
    README.md
tools/
  content/
    README.md
```

## Module Boundaries

- `app`: boot, scene flow, and orchestration.
- `gameplay`: map viewport, targets, modes, scoring, timer, tools, and settlement.
- `config`: typed config loading and validation adapters.
- `ui`: HUD, target list, settlement, and navigation UI.
- `feedback`: visual/audio feedback presets.
- `platform`: WeChat, Web, native, sharing, SDK, and platform storage adapters.
- `storage`: local save now, cloud sync boundary later.

## Git Hygiene

The root `.gitignore` excludes Cocos-generated cache/build folders:

- `cocos/library/`
- `cocos/local/`
- `cocos/temp/`
- `cocos/build/`
- `cocos/profiles/`

Commit project settings, source, scenes, prefabs, configs, and normalized runtime assets. Do not commit generated caches or local editor state.

## Next Step

Migrate the gameplay config and viewport fixtures to the accepted 1600x2400 portrait map, then create the first 2D scene and bind the imported runtime assets.
