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
first-launch default. The add form can prefill an entry from a free lookup
source: TMDB or OMDb (films and series, each needs a key), TVmaze (series),
or Open Library and Google Books (books), picked in the lookup sheet.

The app also ships as a website. `react-native-web`, `react-dom`, and
`@expo/metro-runtime` are installed for that, and `npm run export:web`
writes a static progressive web app (manifest, service worker, icons from
`public/`) that can be installed to a phone's home screen. The web layout is
deliberately phone-shaped; do not add desktop-specific layouts unless asked.

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
  and its saved choice wins. `EXPO_PUBLIC_TMDB_API_KEY` and
  `EXPO_PUBLIC_OMDB_API_KEY` add those sources to the "Fill from the web"
  lookup in the add form (films need one of them; series and books work
  without a key). `EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY` is optional and only
  raises the Google Books quota.
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
npm test            Jest, runs once (157 tests in 25 files)
npm run format      Prettier across the project
npm start           Metro dev server (Expo Go, emulator, or web)
npm run export:web  Static web build (a PWA) in dist/, ready for any host
```

Run typecheck, lint, and test before calling a change done.

## Layout

```
src/api          lookup/: the prefill sources (tmdb, omdb, tvmaze, openLibrary,
                 googleBooks) behind one LookupSource interface, and
                 sourcesFor(kind) in lookup/index.ts; http.ts: the shared
                 fetch with timeout, query string, and HTML-to-text helpers
src/hooks        useDebouncedValue
src/context      StorageContext, AuthContext, LibraryContext, LanguageContext,
                 ThemeContext, and their tests
src/components   ItemCard (four sizes, one per zoom level), TimelineGrid (the
                 pinch-zoomed, month-sectioned library grid), KindPicker,
                 StatusPicker, DateField, TagInput, FilterSheet, LookupInline,
                 EditProfileSheet (name and picture, expo-image-picker),
                 SearchBar, SwipePager, BrandHeader, StorageSettings,
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
                 store, expo-sqlite), deviceStore (SQLite on a phone,
                 AsyncStorage on web through deviceStore.web.ts, so the web
                 bundle never loads expo-sqlite), pocketbase (both, against
                 the SDK),
                 summary (month and year totals for the Diary), timeline (the
                 zoom ladder, pinch steps, and month or year grouping behind
                 the library grid), favourites (the top four shelf, max four),
                 haptics (expo-haptics behind a no-throw wrapper), storage,
                 score (1 to 10 scale, the 10 rule), tags, labels, validation
pocketbase/      pb_migrations (creates the entries collection), README
public/          web only: index.html template, manifest.json, sw.js, and
                 the PWA icons. Copied verbatim into the web export.
src/theme        three colour themes (cinema, paperback, viceCity) as
                 ThemeColors, plus spacing, radius, typography, and motion
                 (Liquid Glass springs) tokens
src/types        library.ts (LibraryItem, ItemKind, ItemStatus), lookup.ts
                 (LookupResult, LookupSource)
```

Contexts never touch storage directly. `StorageContext` owns the saved
Storage setting and has `src/lib/backend.ts` build a `LibraryStore` (list,
create, update, remove) and an `AuthBackend` (restore, signup, login, logout,
updateProfile: name, picture, and the top four favourites, which live on the
user rather than on the entries) for it; AuthProvider and LibraryProvider read that pair, and fall back to the
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
