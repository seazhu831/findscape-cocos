# Known Issues And Blockers

Issue: https://github.com/seazhu831/findscape-cocos/issues/33

This document keeps current blockers and non-blocking limitations in one place so future sessions can resume without re-discovering the same constraints.

## Hard Blockers

These require project owner input, tool access, or source material before the next dependent work can be completed safely.

- Cocos Creator 3.8.8 is selected, but Cocos Dashboard, the editor, and Creator CLI are not installed or visible on this machine yet.
- Editor-generated scene metadata must wait for the first project import with Creator 3.8.8.
- The accepted portrait map and runtime art are present, but scene placement, HUD construction, and feedback animation remain blocked on editor initialization.

## Non-Blocking Limitations

These do not block pure runtime, config, fixture, or static preview work.

- Static Web preview is not a Cocos runtime replacement.
- Web preview still uses canvas rendering rather than the final Creator scene.
- Feedback plans are generated and displayed, but actual Cocos tweens, particles, and audio playback are not implemented yet.
- Storage is currently a pure local-save model and port abstraction; no platform adapter has been bound to WeChat or browser APIs yet.
- TypeScript/Cocos compilation is not run because Creator 3.8.8 is not installed and initialized.

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
