# Known Issues And Blockers

Issue: https://github.com/seazhu831/findscape-cocos/issues/33

This document keeps current blockers and non-blocking limitations in one place so future sessions can resume without re-discovering the same constraints.

## Hard Blockers

No owner-input blocker is currently active. Device preview will require the
owner's phone when the package is small enough to generate and scan a preview
QR code.

## Non-Blocking Limitations

These do not block pure runtime, config, fixture, or static preview work.

- Five CC0 feedback clips are imported, preloaded, and played from configured
  feedback plans. Final perceived-volume tuning still needs a physical-device pass.
- Browser local storage is bound to the Cocos round flow. The WeChat storage
  adapter has deterministic fixtures but is not yet bound to a built WeChat
  Mini Game runtime.
- The generated WeChat package is approximately 13 MB, while the main-package
  limit is 4 MB. The 6.4 MB engine bundle is the largest single artifact;
  engine feature trimming and resource packaging must be addressed before
  upload or device preview.
- The official WeChat DevTools 2.01.2510290 x64 and ARM64 stable archives fail
  strict code-signature verification despite matching the official release and
  Homebrew checksum. The x64 build runs under normal macOS policy without a
  security bypass; re-audit when upgrading the tool.
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
  and WeChat Mini Game builds have been verified locally.
- The Cocos Web Mobile build has been exercised at `390x844` through the in-app
  browser, including targets, feedback, tools, mode switching, settlement,
  replay, map dragging, timer urgency, startup fallback states, and SFX loading
  and triggering.

## Current Safe Work Areas

The current dependency sequence is:

- Reduce the WeChat main package below 4 MB and repeat simulator validation.
- Bind the WeChat storage adapter, then run preview QR/device validation.
- Continue Web Mobile regression checks whenever shared scene behavior changes.
