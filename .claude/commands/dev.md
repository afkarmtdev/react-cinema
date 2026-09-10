---
description: Run this project's dev scripts (app, tests, lint, format) and report pass/fail
argument-hint: '[app | test | typecheck | lint | fix | format | all]'
---

The user wants to run a CineReact (Expo SDK 57 + TypeScript) dev task.
Requested target: "$ARGUMENTS" (if empty, default to starting the app).

## Environment (check first)

- Node 24.14.0 is the default in both the PowerShell and Bash tools on this
  machine. Expo SDK 57 needs Node 20.19.4 or newer. If `node -v` prints
  something older, stop and report it.
- If `node_modules` is missing, run `npm ci --ignore-scripts` before anything
  else. Do not add or bump packages (see the dependency policy in AGENTS.md).
- An OMDb key in `.env` is optional (it only enables the lookup button in
  the add form); the `run-app` skill has the details.

## Map the argument to a command

- empty, `app`, or `start`: `npm start` (Metro bundler plus QR code). This is
  long-running: start it in the background, then tell the user the dev server
  is up and they can press `a` (Android), `i` (iOS, macOS only), or `w` (web).
  The store version of Expo Go targets SDK 57, which matches this project;
  if the stores have moved on, the SDK 57 build is at https://expo.dev/go.
  Do not block waiting on the server.
- `test`: `npm test`
- `typecheck`: `npm run typecheck`
- `lint`: `npm run lint`
- `fix`: `npm run lint:fix` then `npm run format`
- `format`: `npm run format`
- `all` or `check`: run `npm run typecheck`, `npm run lint`, and `npm test` in
  sequence, then report a short pass/fail summary for each.

## Reporting

- Keep output concise: report what ran and whether it passed.
- If a check fails, show the relevant failing output (not the whole log) and
  suggest the likely fix.
- Never bump `jest` past 29 or change any pinned dependency version. The
  project pins exact versions that are at least 10 days old on purpose (see
  the dependency policy in AGENTS.md).
- `fix` and `format` rewrite files. Show `git status` afterwards, and do not
  commit: the user reviews and approves every commit (see CLAUDE.md).
