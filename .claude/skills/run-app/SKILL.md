---
name: run-app
description: Launch, typecheck, or bundle this Expo + TypeScript cinema app (CineReact). Use when asked to run/start the app, check it builds, or reproduce the dev setup. Captures the node-version requirement specific to this machine.
---

# Running CineReact (Expo + TypeScript)

## Environment gotcha (important)

This machine's **default `node` is v14**, which is too old for Expo SDK 56.
A working **node v24** is installed via nvm. Run all npm/expo/node commands
through **PowerShell** (where `node` resolves to v24), not the Bash tool
(where it resolves to v14).

If a command reports an old node version, switch first:

```powershell
nvm use 24.14.0
node -v   # expect v24.x
```

## Common tasks

Install dependencies (scripts disabled for supply-chain safety):

```powershell
npm install --ignore-scripts
```

Typecheck:

```powershell
npm run typecheck
```

Start the dev server (scan the QR with Expo Go, or press a/i/w):

```powershell
npm start
# or target a platform:
npm run android
npm run ios     # macOS only
npm run web
```

Verify it bundles without a device (catches unresolved imports / syntax errors):

```powershell
$env:CI="1"; npx expo export --platform android --output-dir dist-verify
# then clean up:
Remove-Item -Recurse -Force dist-verify
```

## Notes

- Dependencies are pinned to exact versions (no `^`/`~`); `.npmrc` has
  `save-exact=true`. Prefer `npm ci --ignore-scripts` for reproducible installs.
- The app reads movies from FreeTestAPI; it needs network on the device/emulator,
  but the bundle/typecheck steps above work offline.
