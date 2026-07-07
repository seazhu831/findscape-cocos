# Cocos Scaffold

# Stage 2 Scaffold Notes

Issue: https://github.com/seazhu831/findscape-cocos/issues/4

This stage creates a repository-level Cocos workspace boundary without pretending that the full Cocos Creator project has already been generated.

## Current Constraint

The local machine does not currently expose:

- `cocos` CLI.
- A visible Cocos Creator application under `/Applications`.

Because of that, the scaffold intentionally avoids hand-authoring editor-generated metadata that can vary by Cocos Creator version.

## Version Stance

Cocos Creator version is still an open decision.

Until confirmed, this repo should treat the `cocos/` folder as a Creator-ready workspace and keep implementation code in stable TypeScript/script and config boundaries. Once the version is chosen, open `cocos/` in Cocos Creator and let the editor generate compatible project metadata.

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

Proceed to Stage 3 after one of these happens:

- Cocos Creator version is confirmed and the editor project is initialized.
- Or, if implementation must continue before editor setup, define gameplay data schemas and sample config under `cocos/assets/resources/config/` with TypeScript interfaces under `cocos/assets/scripts/config/`.
