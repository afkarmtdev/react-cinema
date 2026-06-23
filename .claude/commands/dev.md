---
description: Run this project's dev scripts (app, tests, lint, format) with the correct Node version
argument-hint: '[app | test | typecheck | lint | fix | format | all]'
---

The user wants to run a CineReact (Expo + TypeScript) dev task.
Requested target: **"$ARGUMENTS"** (if empty, default to starting the app).

## Environment (important, do this first)

- This machine's default `node` is **v14**, which is too old for Expo SDK 56.
  A working **node v24** is installed via nvm.
- Run all npm / expo / node commands through the **PowerShell** tool (where
  `node` resolves to v24), NOT the Bash tool (v14). If a command reports an old
  Node version, run `nvm use 24.14.0` first and confirm with `node -v`.
- If `node_modules` is missing, run `npm install --ignore-scripts` before
  anything else.

## Map the argument to a command

- empty / `app` / `start` → `npm start` (Metro bundler + QR code for Expo Go).
  This is long-running: start it in the background, then tell the user the dev
  server is up and they can scan the QR with Expo Go, or press `a` (Android),
  `i` (iOS, macOS only), or `w` (web). Do not block waiting on it.
- `test` → `npm test`
- `typecheck` → `npm run typecheck`
- `lint` → `npm run lint`
- `fix` → `npm run lint:fix` then `npm run format`
- `format` → `npm run format`
- `all` / `check` → run `npm run typecheck`, `npm run lint`, and `npm test` in
  sequence, then report a short pass/fail summary for each.

## Reporting

- Keep output concise: report what ran and whether it passed.
- If a check fails, show the relevant failing output (not the whole log) and
  suggest the likely fix.
- Never bump `jest` past 29 or change pinned dependency versions; the project
  pins exact, aged versions on purpose (see README » Supply-chain hardening).
