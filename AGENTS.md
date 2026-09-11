# CineReact: agent brief

CineReact is a small Letterboxd-style tracker built with Expo SDK 57 (managed
workflow), React Native 0.86, React 19.2, TypeScript, and React Navigation 7.
A signed-in user keeps a personal library of films, series, and books, typed
in by hand (title, year, director or author, cover link, description, tags,
status, a score from 1.0 to 10.0, notes, and a started and a finished date
picked on the system calendar so old reads can be backlogged). Finished
entries appear in a diary that opens with this-month and this-year totals. Scoring a 10 triggers a warning by design (see src/lib/score.ts). Accounts and
the library live either on a PocketBase server (so the library follows the
user across devices) or on the device (the library in a SQLite file through
expo-sqlite, accounts and settings in AsyncStorage); the user picks in the
Storage setting at runtime, and EXPO_PUBLIC_POCKETBASE_URL only sets the
first-launch default. OMDb is only used, when a key is present, to prefill the add form
for a film or series.

## Expo is pinned to SDK 57

Expo changes a lot between SDK versions. Read the exact versioned docs at
https://docs.expo.dev/versions/v57.0.0/ before writing any code. Do not use
the unversioned "latest" docs, which move to the next SDK as soon as it
ships. Do not upgrade the SDK, React Native, or React as a side effect of
another task. If a task needs an upgrade, say so and stop.

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

- `jest` stays on the 29.x line. `jest-expo@57` still depends on the Jest 29
  packages, and mixing in Jest 30 crashes the runner.

## Environment

- Node 24.14.0 (installed at E:\nodejs) is the default in both PowerShell and
  the Bash tool on this machine. Expo SDK 57 needs Node 20.19.4 or newer. If
  `node -v` prints something older, stop and report it rather than working
  around it.
- `.env` (copy `.env.example`, git-ignored) has two optional values.
  `EXPO_PUBLIC_POCKETBASE_URL` makes a fresh install start on that
  PocketBase server (setup in pocketbase/README.md); without it the app starts
  on the device. The Storage setting in the app can switch either way later
  and its saved choice wins. `EXPO_PUBLIC_OMDB_API_KEY` only enables the "Fill from
  OMDb" button in the add form.
- The PocketBase server is not part of npm. The binary and its pb_data folder
  live in pocketbase/ and are git-ignored; only the migration is committed.
- Expo Go from the app stores tracks the latest SDK, which is 57 as of
  September 2026, so the store build opens this project. Once the stores move
  to SDK 58, the SDK 57 build from the version selector at
  https://expo.dev/go works on Android and the iOS simulator (a physical
  iPhone can only run the store build), or run on web with `npm run web`.

## Commands

```
npm run typecheck   TypeScript (tsc --noEmit)
npm run lint        ESLint (flat config: expo, prettier, unused-imports)
npm test            Jest, runs once (89 tests in 13 files)
npm run format      Prettier across the project
npm start           Metro dev server (Expo Go, emulator, or web)
```

Run typecheck, lint, and test before calling a change done.

## Layout

```
src/api          movies.ts: optional OMDb search and detail, used only to
                 prefill the add form when a key is configured
src/hooks        useDebouncedValue
src/context      StorageContext, AuthContext, LibraryContext, LanguageContext,
                 ThemeContext, and their tests
src/components   ItemCard, KindPicker, StatusPicker, DateField, TagInput, FilterSheet,
                 OmdbLookupSheet, SearchBar, SwipePager, BrandHeader, StorageSettings,
                 MultiProvider, and ui/ primitives (Button, TextField, Chip, Sheet,
                 StarRating, ...)
src/screens      SplashScreen, auth/, library/ (Library, ItemDetail, ItemForm),
                 DiaryScreen, ProfileScreen
src/navigation   RootNavigator, AuthStack, MainTabs, LibraryStack, types
src/i18n         translations.ts (English and Malay), used through t()
src/lib          backend (builds the PocketBase or local pair), auth
                 (AuthBackend + local accounts), libraryStore (the LibraryStore
                 interface + the AsyncStorage entries store, used on web and
                 for the one-off import), sqliteStore (the device entries
                 store, expo-sqlite), pocketbase (both, against the SDK),
                 summary (month and year totals for the Diary), storage,
                 score (1 to 10 scale, the 10 rule), tags, labels, validation
pocketbase/      pb_migrations (creates the entries collection), README
src/theme        three colour themes (cinema, paperback, viceCity) as
                 ThemeColors, plus spacing, radius, typography, and motion
                 (Liquid Glass springs) tokens
src/types        library.ts (LibraryItem, ItemKind, ItemStatus), movie.ts
```

Contexts never touch storage directly. `StorageContext` owns the saved
Storage setting and has `src/lib/backend.ts` build a `LibraryStore` (list,
create, update, remove) and an `AuthBackend` (restore, signup, login, logout)
for it; AuthProvider and LibraryProvider read that pair, and fall back to the
local pair outside a StorageProvider, which is what the tests get. Changing
the setting swaps the pair and both contexts start over (the user is signed
out first). The `pocketbase`
package is on the exact-pin, 10-day rule like everything else, and Jest maps
it to its ES build in jest.config.js because the default entry is .mjs.

Colours are never imported statically. A component defines a module-level
`makeStyles = (colors: ThemeColors) => StyleSheet.create({...})` and calls
`useThemedStyles(makeStyles)`; anything that needs a colour outside the
styles reads `const { colors } = useTheme()`. Adding a theme means adding a
`ThemeColors` object to `src/theme/index.ts`, listing it in `THEME_NAMES`,
and adding a `theme<Name>` string in both languages.

Every user-facing string goes through `t()` from `LanguageContext`, so a new
string needs both an English and a Malay entry in `src/i18n/translations.ts`.
The status wording depends on the kind (watched vs read), see `statusKey` in
`src/lib/labels.ts`.
