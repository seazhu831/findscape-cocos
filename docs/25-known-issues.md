# Known Issues And Blockers

Issue: https://github.com/seazhu831/findscape-cocos/issues/33

This document keeps current blockers and non-blocking limitations in one place so future sessions can resume without re-discovering the same constraints.

## Hard Blockers

These require project owner input, tool access, or source material before the next dependent work can be completed safely.

- No owner-input blocker currently prevents the next implementation stage.
- WeChat device preview still depends on WeChat DevTools and a usable AppID, but it does not block Web Mobile scene integration.

## Non-Blocking Limitations

These do not block pure runtime, config, fixture, or static preview work.

- Static Web preview is not a Cocos runtime replacement.
- Web preview still uses canvas rendering rather than the final Creator scene.
- Feedback plans are generated and displayed, but actual Cocos tweens, particles, and audio playback are not implemented yet.
- Storage is currently a pure local-save model and port abstraction; no platform adapter has been bound to WeChat or browser APIs yet.
- Creator 3.8.8 can start the project AssetDB before its built-in `engine-extends` importer contribution is registered on this host. Without mitigation, Creator rewrites valid PNG, TypeScript, JSON, text, and directory metadata to the fallback `*` importer. The project extension at `cocos/extensions/findscape-asset-db-bootstrap/` restores the built-in handlers in `beforePreStart`; two cold starts and a delayed post-start check passed with 55 handlers, 93 resource records, zero fallback importers, and zero invalid resources.
- Creator 3.8.8 emits repeated editor gizmo/material warnings and an extension-manager `forceUpdate` response error on macOS 26.5.1. These remain non-blocking after the AssetDB bootstrap fix, but must be monitored during scene editing and builds.

## Verification Constraints

- `npm run check:all` is the current strongest local deterministic verification.
- Creator first-open import and target-plugin registration have been verified locally.
- The local preview server can start with `npm run preview:web`, but full automated browser smoke should wait until browser tooling is installed or the in-app browser connector is available.

## Current Safe Work Areas

The current safe work sequence is:

- Create and verify the first Cocos scene.
- Integrate HUD and feedback assets.
- Build Web Mobile before validating WeChat Mini Game.
