# WeChat Mini Game Build Environment

Issue: https://github.com/seazhu831/findscape-cocos/issues/59

Audit date: 2026-07-15

## Installed Tooling

- WeChat DevTools: `2.01.2510290` (`4240.111`)
- Install path: `/Applications/wechatwebdevtools.app`
- Install source: Homebrew cask `wechatwebdevtools`
- Upstream download: Tencent `dldir1.qq.com` release archive referenced by the
  cask
- Architecture: x86_64; Rosetta translation is available on this Apple Silicon
  host
- CLI: `/Applications/wechatwebdevtools.app/Contents/MacOS/cli`

The main executable carries a notarized Tencent Developer ID signature and
passes Gatekeeper assessment. A deep bundle verification reports a modified
nested resource, while direct verification of the signed executable succeeds.
Treat this as an upstream packaging observation and recheck after DevTools
updates.

## Cocos Build Verification

Cocos Creator 3.8.8 completed a WeChat Mini Game build with:

```sh
/Applications/Cocos/Creator/3.8.8/CocosCreator.app/Contents/MacOS/CocosCreator \
  --project /Users/sea/WorkSpace/byxy/github/findscape-cocos/cocos \
  --build "platform=wechatgame;debug=true;md5Cache=false;buildPath=/Users/sea/WorkSpace/byxy/github/findscape-cocos/cocos/build;orientation=portrait"
```

The checked-in command-line configuration is used with:

```sh
/Applications/Cocos/Creator/3.8.8/CocosCreator.app/Contents/MacOS/CocosCreator \
  --project /Users/sea/WorkSpace/byxy/github/findscape-cocos/cocos \
  --build "configPath=/Users/sea/WorkSpace/byxy/github/findscape-cocos/cocos/build-config/wechatgame.json"
```

Verified generated properties:

- Output directory: `cocos/build/wechatgame/` (ignored by Git)
- `project.config.json` uses `compileType: game`
- `game.json` uses `deviceOrientation: portrait`
- The generated package contains the scene, scripts, runtime art, and five OGG
  feedback clips
- Uncompressed output size is approximately 13 MB

The project owner confirmed `wx04421302f08791bc` as the Findscape Mini Program
AppID. The reproducible build options live in
`cocos/build-config/wechatgame.json`; platform-specific values are nested under
`packages.wechatgame` as required by Creator 3.8. Creator's stock
`wx6ac3f5090a6b99c5` remains test-only and must not be used for release.

The current uncompressed output is approximately 13 MB. Cocos documentation
states that the WeChat Mini Game main package may not exceed 4 MB. Engine feature
trimming, subpackages, or remote assets are required before upload.

As with Web Mobile builds on this host, Creator logs a successful completed
build and then exits with code 36.

Validate the tracked options and a generated package from `cocos/`:

```sh
npm run check:wechat-build
npm run check:wechat-build-output
```

## Owner Action Required

The first DevTools launch is waiting for two owner-controlled actions:

1. Choose whether to allow the macOS local-network permission requested by
   WeChat DevTools. Device discovery and physical-device debugging normally need
   this permission.
2. Complete WeChat quick login and confirm that the logged-in developer has
   access to AppID `wx04421302f08791bc`.

After those actions, enable the DevTools service port if it is still disabled,
open `cocos/build/wechatgame/`, and validate compile, simulator, preview QR code,
storage, audio, and portrait behavior.
