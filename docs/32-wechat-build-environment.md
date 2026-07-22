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

The Homebrew checksum matches the downloaded Tencent release archive, but
`codesign --verify --strict` currently reports that both the x64 and ARM64
stable release bundles have been modified after signing. macOS still launches
the x64 build through its normal application policy. No Gatekeeper bypass,
ad-hoc signing, or quarantine removal was applied. Treat this as an upstream
packaging defect and recheck before adopting a future DevTools update.

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
- `game.json` declares `subpackages/resources/`, which contains runtime art and
  all five MP3 feedback clips
- The checked-in WeChat build template adds
  `subpackages/resources/index.js`, which loads Creator's generated `game.js`
  and satisfies DevTools subpackage precompilation
- The dense Stage 4H build measures `2,642,808` bytes (`2.52 MiB`) in the main
  package and `4,821,466` bytes (`4.60 MiB`) in the resources subpackage
- WeChat DevTools accepts the package and renders the portrait scene in its
  iPhone simulator without a blocking compile error

The project owner confirmed `wx04421302f08791bc` as the Findscape Mini Program
AppID. The reproducible build options live in
`cocos/build-config/wechatgame.json`; platform-specific values are nested under
`packages.wechatgame` as required by Creator 3.8. Creator's stock
`wx6ac3f5090a6b99c5` remains test-only and must not be used for release.

Issue #60 reduced the build from approximately 13 MB by trimming unused engine
features, enabling release property mangling, and assigning the `resources`
Asset Bundle to a WeChat subpackage. `npm run check:wechat-build-output` now
enforces the 4 MiB main-package limit and verifies the generated subpackage.

As with Web Mobile builds on this host, Creator logs a successful completed
build and then exits with code 36.

Validate the tracked options and a generated package from `cocos/`:

```sh
npm run check:wechat-build
npm run check:wechat-build-output
```

## DevTools Verification

- The project owner completed WeChat quick login.
- The owner confirmed the production AppID as `wx04421302f08791bc`; it is now
  pinned in the checked-in build configuration and generated project output.
- The DevTools service port is enabled and CLI login returns `login: true`.
- `cocos/build/wechatgame/` opens as an existing game project; no new Mini Game
  template or random AppID is required.
- The simulator loads the main scene, portrait HUD, map, target art, and runtime
  diagnostics successfully.
- The subpackaged release build loads in the iPhone simulator with zero runtime
  errors; the latest scene load completed in approximately 176 ms. Three visible
  warnings are DevTools/base-library notices rather than project failures.
- The release scene logs `[FindscapeStorage] Using wechat storage`.
- `findscape.localSave.v1` returned the same versioned best-score and
  last-result payload before and after a DevTools recompile.

Remaining platform work is preview QR/device validation and physical-device
audio tuning.
