# Known Issues And Blockers

Issue: https://github.com/seazhu831/findscape-cocos/issues/33

This document keeps current blockers and non-blocking limitations in one place so future sessions can resume without re-discovering the same constraints.

## Hard Blockers

These require project owner input, tool access, or source material before the next dependent work can be completed safely.

- Cocos Creator version is not confirmed.
- Local Cocos Creator editor or CLI is not available in the current repo workflow.
- Editor-generated scene metadata should not be hand-authored until the target Cocos Creator version is known.
- Claude Design source exports are not present yet, so manifest entries remain `brief` and runtime art/audio files are still pending.

## Non-Blocking Limitations

These do not block pure runtime, config, fixture, or static preview work.

- Static Web preview is not a Cocos runtime replacement.
- Web preview uses canvas placeholders instead of final map and target art.
- Feedback plans are generated and displayed, but actual Cocos tweens, particles, and audio playback are not implemented yet.
- Storage is currently a pure local-save model and port abstraction; no platform adapter has been bound to WeChat or browser APIs yet.
- TypeScript/Cocos compilation is not run because the Cocos toolchain is not initialized.

## Verification Constraints

- `npm run check:all` is the current strongest local deterministic verification.
- Browser automation via Playwright could not launch on this machine because the Playwright browser executable is not installed.
- The local preview server can start with `npm run preview:web`, but full automated browser smoke should wait until browser tooling is installed or the in-app browser connector is available.

## Current Safe Work Areas

Until hard blockers are resolved, continue with:

- Data schemas and validation.
- Pure runtime helpers.
- Fixture coverage.
- Static Web preview behavior.
- Asset manifest and readiness tooling.
- Documentation that reduces integration ambiguity.
