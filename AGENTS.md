# CineReact: agent brief

CineReact is a small Letterboxd-style tracker built with Expo SDK 54 (managed
workflow), React Native 0.81, React 19.1, TypeScript, and React Navigation 7.
A signed-in user keeps a personal library of films, series, and books, typed
in by hand (title, year, director or author, cover link, description, tags,
status, a score from 1.0 to 10.0, notes), and finished entries appear in a
diary. Scoring a 10 triggers a warning by design (see src/lib/score.ts). Accounts and
the library live either on a PocketBase server (when EXPO_PUBLIC_POCKETBASE_URL
is set, so the library follows the user across devices) or on the device in
AsyncStorage. OMDb is only used, when a key is present, to prefill the add form
for a film or series.

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
- `.env` (copy `.env.example`, git-ignored) has two optional values.
  `EXPO_PUBLIC_POCKETBASE_URL` switches accounts and the library to a
  PocketBase server (setup in pocketbase/README.md); without it everything
  stays on the device. `EXPO_PUBLIC_OMDB_API_KEY` only enables the "Fill from
  OMDb" button in the add form.
- The PocketBase server is not part of npm. The binary and its pb_data folder
  live in pocketbase/ and are git-ignored; only the migration is committed.
- Expo Go from the app stores tracks the latest SDK (57), so it may refuse to
  open this SDK 54 project. Use the SDK 54 build from the version selector at
  https://expo.dev/go, or run on web with `npm run web`.

## Commands

```
npm run typecheck   TypeScript (tsc --noEmit)
npm run lint        ESLint (flat config: expo, prettier, unused-imports)
npm test            Jest, runs once (48 tests in 7 files)
npm run format      Prettier across the project
npm start           Metro dev server (Expo Go, emulator, or web)
```

Run typecheck, lint, and test before calling a change done.

## Layout

```
src/api          movies.ts: optional OMDb search and detail, used only to
                 prefill the add form when a key is configured
src/hooks        useDebouncedValue
src/context      AuthContext, LibraryContext, LanguageContext, and their tests
src/components   ItemCard, KindPicker, StatusPicker, TagInput, FilterSheet,
                 OmdbLookupSheet, SearchBar, BrandHeader, MultiProvider, and
                 ui/ primitives (Button, TextField, Chip, StarRating, ...)
src/screens      SplashScreen, auth/, library/ (Library, ItemDetail, ItemForm),
                 DiaryScreen, ProfileScreen
src/navigation   RootNavigator, AuthStack, MainTabs, LibraryStack, types
src/i18n         translations.ts (English and Malay), used through t()
src/lib          backend (picks PocketBase or local at startup), auth
                 (AuthBackend + local accounts), libraryStore (LibraryStore +
                 local entries), pocketbase (both, against the SDK), storage,
                 score (1 to 10 scale, the 10 rule), tags, labels, validation
pocketbase/      pb_migrations (creates the entries collection), README
src/theme        colour, spacing, radius, and typography tokens
src/types        library.ts (LibraryItem, ItemKind, ItemStatus), movie.ts
```

Contexts never touch storage directly. `src/lib/backend.ts` hands them a
`LibraryStore` (list, create, update, remove) and an `AuthBackend` (restore,
signup, login, logout); tests always get the local pair. The `pocketbase`
package is on the exact-pin, 10-day rule like everything else, and Jest maps
it to its ES build in jest.config.js because the default entry is .mjs.

Every user-facing string goes through `t()` from `LanguageContext`, so a new
string needs both an English and a Malay entry in `src/i18n/translations.ts`.
The status wording depends on the kind (watched vs read), see `statusKey` in
`src/lib/labels.ts`.
