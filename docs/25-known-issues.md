# Known Issues And Blockers

Issue: https://github.com/seazhu831/findscape-cocos/issues/33

This document keeps current blockers and non-blocking limitations in one place so future sessions can resume without re-discovering the same constraints.

## Hard Blockers

These require project owner input, tool access, or source material before the next dependent work can be completed safely.

- WeChat device preview depends on WeChat DevTools and a usable AppID. It does
  not block continued Web Mobile regression work.

## Non-Blocking Limitations

These do not block pure runtime, config, fixture, or static preview work.

- Five CC0 feedback clips are imported, preloaded, and played from configured
  feedback plans. Final perceived-volume tuning still needs a physical-device pass.
- Browser local storage is bound to the Cocos round flow. The WeChat storage
  adapter has deterministic fixtures but is not yet bound to a built WeChat
  Mini Game runtime.
- Creator 3.8.8 can start the project AssetDB before its built-in `engine-extends` importer contribution is registered on this host. Without mitigation, Creator rewrites valid PNG, TypeScript, JSON, text, and directory metadata to the fallback `*` importer. The project extension at `cocos/extensions/findscape-asset-db-bootstrap/` restores the built-in handlers in `beforePreStart`; two cold starts and a delayed post-start check passed with 55 handlers, 93 resource records, zero fallback importers, and zero invalid resources.
- Creator 3.8.8 emits repeated editor gizmo/material warnings and an extension-manager `forceUpdate` response error on macOS 26.5.1. These remain non-blocking after the AssetDB bootstrap fix, but must be monitored during scene editing and builds.
- Creator 3.8.8 Web Mobile CLI builds finish successfully and emit complete
  output, but the macOS command exits with code 36 after completion.
- Automated WebGL screenshots occasionally contain transient black regions.
  A subsequent stable frame and browser console inspection are required before
  treating this as a runtime rendering failure.

## Verification Constraints

- `npm run check:all` is the current strongest local deterministic verification.
- Creator first-open import, target-plugin registration, and repeated Web Mobile
  builds have been verified locally.
- The Cocos Web Mobile build has been exercised at `390x844` through the in-app
  browser, including targets, feedback, tools, mode switching, settlement,
  replay, map dragging, timer urgency, startup fallback states, and SFX loading
  and triggering.

## Current Safe Work Areas

The current dependency sequence is:

- Install/open WeChat DevTools and provide a usable AppID for Mini Game build
  and device validation.
- Continue Web Mobile regression checks whenever shared scene behavior changes.
