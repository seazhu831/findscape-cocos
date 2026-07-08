# Work Loop

# Autonomous Work Loop

Issue: https://github.com/seazhu831/findscape-cocos/issues/5

This document defines the default loop for ongoing autonomous work in this repository.

The goal is to keep progress continuous, traceable, and easy to resume: every meaningful step should have an issue record, a small commit, and a short progress note.

## Loop Overview

Repeat this loop until blocked by a decision, missing access, missing source material, or a task that requires the project owner.

1. Select the next stage or smallest useful task from `docs/06-project-plan.md`.
2. Create or reuse a GitHub issue for that stage.
3. Record the goal, scope, dependencies, current risks, and done criteria in the issue.
4. Inspect the current workspace and relevant docs before editing.
5. Make the smallest coherent change that advances the stage.
6. Verify the change with the available local tools.
7. Commit the change with granular scope and a reference to the issue.
8. Update the issue with progress, problems, decisions, and commit IDs.
9. Push to `origin/main`.
10. Close the issue when the done criteria are met, or leave it open with clear next actions.
11. Move to the next useful task and repeat.

## Default Task Selection

Prefer work in this order:

- Unblocked stage work in `docs/06-project-plan.md`.
- Documentation that removes ambiguity for the next implementation step.
- Data schemas, sample configs, validation tools, and content pipeline foundations.
- Runtime implementation that can be verified locally.
- Design pipeline artifacts that unblock Claude Design asset production.
- Polish and integration only after core behavior exists.

Defer work that expands scope before the core hidden-object loop feels good:

- Backend.
- Login.
- Cloud sync.
- Payment.
- Ads.
- Monthly card.
- PvP, 2v2, realtime sync.
- Admin backend.

## Issue Policy

Each stage or coherent task should have one issue.

Issue updates should include:

- What changed.
- What was verified.
- What is still open.
- What decisions were made.
- What dependencies remain.
- Commit IDs or links.

Close an issue only when its done criteria are satisfied and the relevant commits are pushed.

## Commit Policy

Follow the commit granularity rules in `docs/06-project-plan.md`.

Default shape:

```text
Short imperative summary

- What changed.
- Why it matters.
- Issue: #N
```

Never combine unrelated concerns just to reduce commit count.

## Verification Policy

Use the strongest available local verification for the current artifact:

- Documentation: read the rendered source, check links and issue references, inspect `git diff`.
- JSON/config: validate syntax and references with deterministic scripts where possible.
- TypeScript: run the relevant compiler, linter, or lightweight type checks once available.
- Cocos runtime: use Cocos Creator preview/build when installed; use Web preview as the first practical runtime target.
- Assets: verify dimensions, file names, manifest references, and runtime import paths.

If verification is not possible, record why in the issue and final report.

## User Intervention Triggers

Continue autonomously unless one of these is true:

- A product decision would materially change the direction or cost.
- Required credentials, paid services, or private accounts are missing.
- A destructive action is needed.
- A dependency installation or network operation fails and cannot continue without approval.
- Cocos Creator version or editor-generated project files are required to proceed safely.
- Claude Design output is needed and cannot be generated or inferred locally.

When blocked, leave the issue updated with the exact blocker and the smallest question needed to unblock.

## Reporting Rhythm

During active work:

- Send concise progress updates when starting a stage, before file edits, after verification, and after pushing.
- Keep final reports focused on commits, issues, verification, and next step.
- Do not stop after a report if the next task is clearly unblocked.

## Current Next Step

After this loop is committed, continue to Stage 3:

- Define gameplay data schemas.
- Add demo config samples.
- Add lightweight validation or content-check notes.
