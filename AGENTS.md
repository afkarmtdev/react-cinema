# CineReact: agent brief

CineReact is a small movie-review app built with Expo SDK 54 (managed
workflow), React Native 0.81, React 19.1, TypeScript, and React Navigation 7.
It lists and searches movies from the OMDb API and lets a signed-in user rate
and review them. Accounts, sessions, and reviews live on the device in
AsyncStorage. There is no backend.

## Expo is pinned to SDK 54

Expo changes a lot between SDK versions. Read the exact versioned docs at
https://docs.expo.dev/versions/v54.0.0/ before writing any code. Do not use
the "latest" docs (SDK 57 as of September 2026). Do not upgrade the SDK,
React Native, or React as a side effect of another task. If a task needs an
upgrade, say so and stop.

## Dependency policy (read before touching package.json)

This project is deliberately hardened against npm supply-chain attacks such
as the Shai-Hulud worm. The rules:

- Never update a package to its latest version. Only install versions that
  were published at least 10 days before today. Pass `--before` so npm cannot
  pick anything newer, and check dates with `npm view <pkg> time --json`.

  PowerShell:

  ```powershell
  npm install <pkg>@<version> --ignore-scripts --before=$((Get-Date).AddDays(-10).ToString('yyyy-MM-dd'))
  ```

  Bash:

  ```bash
  npm install <pkg>@<version> --ignore-scripts --before=$(date -d '10 days ago' +%F)
  ```

- Every version is pinned exactly (`.npmrc` has `save-exact=true`). Never add
  `^` or `~` ranges.
- Always install with `--ignore-scripts`. Use `npm ci --ignore-scripts` for a
  reproducible install from the lockfile.
- Do not run `npm update`, `npm audit fix`, `npx expo install --fix`, or
  `npx expo-doctor`. They all pull newer versions or fetch tools from the
  registry at latest. `npx expo`, `npx jest`, `npx tsc`, `npx eslint`, and
  `npx prettier` are fine because they resolve to the copies in node_modules.
- For a new Expo or React Native package, the SDK-compatible version range is
  listed in `node_modules/expo/bundledNativeModules.json`. Either install the
  version from that table with the `--before` command above, or let Expo pick
  the range while npm enforces the date:

  ```bash
  npx expo install <pkg> -- --ignore-scripts --before=$(date -d '10 days ago' +%F)
  ```

- `jest` stays on the 29.x line. `jest-expo@54` is built for Jest 29 and
  Jest 30 crashes the runner.

## Environment

- Node 24.14.0 (installed at E:\nodejs) is the default in both PowerShell and
  the Bash tool on this machine. Expo SDK 54 needs Node 20.19 or newer. If
  `node -v` prints something older, stop and report it rather than working
  around it.
- The movie list needs an OMDb key in `.env` (copy `.env.example`). Without it
  the app still runs but the list shows the error state. `.env` is
  git-ignored, so a fresh clone will not have one.
- Expo Go from the app stores tracks the latest SDK (57), so it may refuse to
  open this SDK 54 project. Use the SDK 54 build from the version selector at
  https://expo.dev/go, or run on web with `npm run web`.

## Commands

```
npm run typecheck   TypeScript (tsc --noEmit)
npm run lint        ESLint (flat config: expo, prettier, unused-imports)
npm test            Jest, runs once (29 tests in 5 files)
npm run format      Prettier across the project
npm start           Metro dev server (Expo Go, emulator, or web)
```

Run typecheck, lint, and test before calling a change done.

## Layout

```
src/api          movies.ts: OMDb search (paged, year and type filters) and detail
src/hooks        useMovies (paging plus a stale-response guard), useMovieDetail,
                 useDebouncedValue
src/context      AuthContext, ReviewsContext, LanguageContext, and their tests
src/components   SearchBar, MovieCard, FilterSheet, ReviewComposer, ReviewItem,
                 BrandHeader, MultiProvider, and ui/ primitives
src/screens      SplashScreen, auth/, movies/, ReviewsScreen, ProfileScreen
src/navigation   RootNavigator, AuthStack, MainTabs, MoviesStack, types
src/i18n         translations.ts (English and Malay), used through t()
src/lib          storage (AsyncStorage wrapper), validation
src/theme        colour, spacing, radius, and typography tokens
src/types        movie.ts
```

Every user-facing string goes through `t()` from `LanguageContext`, so a new
string needs both an English and a Malay entry in `src/i18n/translations.ts`.
