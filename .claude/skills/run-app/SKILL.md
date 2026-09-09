---
name: run-app
description: Launch, typecheck, or bundle this Expo SDK 54 + TypeScript cinema app (CineReact). Use when asked to run/start the app, check it builds, or reproduce the dev setup. Captures the Node, OMDb key, and Expo Go facts specific to this machine and project.
---

# Running CineReact (Expo SDK 54 + TypeScript)

## Environment (check first)

- Node 24.14.0 is the default in both the PowerShell and Bash tools on this
  machine (installed at E:\nodejs, no nvm). Expo SDK 54 needs Node 20.19 or
  newer. Confirm with `node -v`; if it prints something older, stop and report
  it instead of working around it.
- `.env` must contain `EXPO_PUBLIC_OMDB_API_KEY` (copy `.env.example` and fill
  in a free key from https://www.omdbapi.com/apikey.aspx). The file is
  git-ignored and may be missing on a fresh checkout. Without it the app starts
  but the movie list shows the error state. Never print the key in output.
- If `node_modules` is missing, install from the lockfile with scripts off:

  ```powershell
  npm ci --ignore-scripts
  ```

  Do not add, bump, or "fix" packages here. See the dependency policy in
  AGENTS.md (exact pins, versions at least 10 days old, `--before`).

## Common tasks

Typecheck:

```powershell
npm run typecheck
```

Start the dev server. It is long-running, so start it in the background and
tell the user it is up:

```powershell
npm start
# or target a platform:
npm run android
npm run ios     # macOS only
npm run web
```

If `.env` changed while Metro was running, restart with `npx expo start -c`
so the new value is picked up.

Verify it bundles without a device (catches unresolved imports and syntax
errors, works offline, takes about a minute):

```powershell
$env:CI = "1"; npx expo export --platform android --output-dir dist-verify
Remove-Item -Recurse -Force dist-verify
```

Bash equivalent:

```bash
CI=1 npx expo export --platform android --output-dir dist-verify && rm -rf dist-verify
```

## Expo Go caveat

Expo Go from the App Store and Play Store tracks the latest SDK (57 as of
September 2026) and will not open an SDK 54 project. Options, in order of
preference:

1. Install the SDK 54 build of Expo Go from the version selector at
   https://expo.dev/go (Android APK, or the iOS simulator build).
2. Run on web with `npm run web`.
3. Upgrading the project to a newer SDK is a separate, deliberate task that
   the user has to ask for. Do not do it to make Expo Go work.

## Notes

- Dependencies are pinned to exact versions (`.npmrc` has `save-exact=true`).
- The app reads movies from OMDb, so the device or emulator needs network.
  Typecheck and the bundle check above work offline.
- `npx expo` and `npx tsc` resolve to the copies in `node_modules`. Do not run
  `npx expo-doctor` or other tools that are not in package.json; they fetch
  the latest version from the registry.
