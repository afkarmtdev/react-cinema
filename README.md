# pocketJing3

> **pocket·jing3** &nbsp; /ˈpɒk.ɪt jɪŋ˧/ &nbsp; _noun_ &nbsp;·&nbsp; **pocket** + **jing3** (應), the "respond" half of the Cantonese 反應 (faan2 jing3, "reaction")
>
> 1. A React Native app for keeping a diary of the films, series, and books you get through.
> 2. _jing3_: to respond to something, here with a score out of ten and a few honest words.
>
> _The 3 is the Cantonese tone, said level at mid pitch. Built with React · powered by your reactions._

pocketJing3 is a small Letterboxd-style tracker built with React Native (Expo +
TypeScript). It keeps a personal library of films, series, and books: what you
want to get to, what you are in the middle of, and what you have finished, with
a rating, your notes, tags, and the director or author on each entry. Finished
entries roll into a diary grouped by month.

There is no catalogue API behind it. You type entries in yourself (title,
year, who made it, a cover image link, a description) so it works just as well
for a novel as for a film. The add form can also look an entry up on a free
source and prefill those fields for you: TVmaze for series, Open Library or
Google Books for books, and TMDB or OMDb for films and series if you add a
free key. It is optional either way.

It started as two separate take-home briefs (a movie list fed by an API, and a
login flow built on React's Context API), then grew into this. The look is
borrowed from the Golden Screen Cinemas (GSC) app: a dark background with
yellow accents.

## What it does

**Accounts.** Sign up, log in, and log out, all handled by a single
`AuthContext`. The forms validate the way you'd expect: no empty fields, a
valid email, a password of at least six characters, no duplicate accounts, and
the right credentials to log in. Your session is saved on the device, so you
stay logged in after closing the app, and each account has its own library.

**Library.** The home tab is a poster grid of everything you have added. Tabs
along the top split it into films, series, and books; the search box matches
titles, directors, authors, years, and tags as you type; a row of chips under
the tabs narrows by status (want to, in progress, finished, worded for the tab
you are on, so Watching on Films and Reading on Books); and the filter button
narrows by any combination of your tags. A yellow button in the corner adds a
new entry.

**Entries.** Every entry has a type, a title, a year, a director or author, a
cover image link (with a live preview), a description, tags, a status, a
score from 1.0 to 10.0 with one decimal, and free-text notes. The status wording follows the
type: watchlist, watching, watched for films and series; to read, reading, read
for books. Tags are free text and the form suggests ones you have used before.
The detail screen shows all of it and lets you change the status or rating in
place. An entry also carries a Started date and a Finished date, picked on the
system calendar. Marking something finished proposes today, and the form lets
you move it back, so a book you read last winter lands in the right month of
the diary instead of this one.

**Rewatches, runtimes, and quotes.** A finished entry can log a rewatch or
reread from its page, or in the form, where each one is a date you can move
or clear. Every one of them is its own line in the diary and counts in that
month's totals. Films and series carry a runtime in minutes (a series counts
all its episodes) and books a page count; the web lookup fills these in when
the source has them. Books also keep quotes: a passage and, if you like, the
page, added and edited from the book's page.

**Moods.** Any entry can say how it made you feel: joy, cried, mad, scared,
moved, or bored, as many as fit. Pick them in the form or tap them on the
entry's page, and filter the library by them from the filter sheet.

**Scores, not stars.** Ratings run from 1.0 to 10.0 in tenths, pizza-review
style, picked from a whole-number row and a tenths row. Tapping 10 brings up a
warning: a 10 means you have found the one, which is impossible, so the app
offers 9.9 instead. There is one exception, and the button for it says so.
Old five-star reviews from the previous version are mapped onto the new
scale, with five stars landing on 9.9.

**Diary.** The second tab opens with two cards, This month and This year,
that total what you have finished, split into films, series, and books, with
the average score and the hours watched and pages read. Below them is
everything you have finished, newest first, grouped by month, with the day,
your score, and a snippet of your notes. A rewatch or reread gets a line of its
own in the month it happened.

**Settings.** The Me tab shows how many films, series, and books you have
finished and your average score, then a Settings group. Appearance picks one
of three themes: Cinema (the dark GSC look, the default), Paperback (warm
paper with a brick-red accent, the light one), and Vice City (violet night,
hot pink, cyan on the active tab). Language switches the whole interface
between English and Bahasa Melayu. Both choices are remembered on the device.

## Tech stack

| Concern     | Choice                                                                        |
| ----------- | ----------------------------------------------------------------------------- |
| Framework   | Expo SDK 57 (managed) + TypeScript                                            |
| Navigation  | React Navigation 7 (native-stack + bottom-tabs)                               |
| State       | React Context API + hooks (`useState`, `useEffect`, `useMemo`, `useCallback`) |
| i18n        | A small `LanguageContext` + `t()` dictionary (English / Malay)                |
| Theming     | `ThemeContext` + `useThemedStyles()`; three palettes in `src/theme`           |
| Persistence | PocketBase (`pocketbase` SDK) or SQLite (`expo-sqlite`), one store interface  |
| Web         | `react-native-web` through Expo Metro web, exported as a static PWA           |
| Testing     | Jest + `jest-expo` + React Native Testing Library                             |
| Icons       | `@expo/vector-icons` (Ionicons)                                               |
| Lookup      | `fetch` against TMDB, OMDb, TVmaze, Open Library, or Google Books             |

## Project structure

```
src/
├─ api/            lookup/ (the prefill sources), http.ts (shared fetch helpers)
├─ components/
│  ├─ ui/          Button, TextField, Chip, Sheet, Screen, StarRating, Skeleton, StateViews
│  ├─ BrandHeader, SearchBar, ItemCard, KindPicker, StatusPicker, DateField, TagInput,
│  │  FilterSheet, LookupSheet, QuoteSheet
├─ context/        AuthContext, LibraryContext, LanguageContext, ThemeContext
│  └─ __tests__/   tests for the auth and library contexts
├─ i18n/           translations.ts (English / Malay dictionaries)
├─ hooks/          useDebouncedValue
├─ lib/            backend (builds PocketBase or device), auth, sqliteStore,
│                  libraryStore, pocketbase, storage, summary, tags, labels,
│                  validation
├─ navigation/     RootNavigator, AuthStack, MainTabs, LibraryStack, types
├─ screens/        SplashScreen, auth/(Login, Signup),
│                  library/(Library, ItemDetail, ItemForm), DiaryScreen,
│                  ProfileScreen
├─ theme/          three colour themes (cinema, paperback, viceCity), spacing, type
└─ types/          library.ts (the entry model), lookup.ts (lookup results)
pocketbase/
├─ pb_migrations/  creates the entries collection with per-user access rules
└─ README.md       how to run the server and point the app at it
```

## Getting started

You'll need Node.js 20.19.4 or newer (the minimum for Expo SDK 57; I built
this on Node 24) and the Expo Go app on your phone, or an Android emulator /
iOS simulator. One thing to know about Expo Go: the version in the app stores
only runs the latest SDK. This project is on SDK 57, which is the current one,
so the store build opens it. If the stores have moved on by the time you read
this, pick SDK 57 from the version selector at https://expo.dev/go (Android
and iOS simulator builds) or use the web target below.

Copy `.env.example` to `.env`. Every value in it is optional:

```bash
cp .env.example .env
# EXPO_PUBLIC_POCKETBASE_URL: a PocketBase server to start on (optional, see below)
#   (see pocketbase/README.md). Leave empty to keep everything on the device.
# EXPO_PUBLIC_TMDB_API_KEY: adds TMDB to the lookup in the add form. Free at
#   https://www.themoviedb.org/settings/api (non-commercial use).
# EXPO_PUBLIC_OMDB_API_KEY: adds OMDb to the lookup. Free at
#   https://www.omdbapi.com/apikey.aspx (1,000 requests/day).
# EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY: only raises the Google Books quota.
```

Then install and run:

```bash
npm ci --ignore-scripts
npm start          # then scan the QR code with Expo Go
# or target a platform directly:
npm run android
npm run ios        # macOS only
npm run web
```

If you change `.env` while the server is running, restart it with `npx expo
start -c` so the new value is picked up.

Other useful scripts:

```bash
npm run typecheck     # TypeScript, no output
npm test              # the unit tests
npm run lint          # ESLint
npm run lint:fix      # ESLint with auto-fix (also drops unused imports)
npm run format        # Prettier across the whole project
```

Prettier, ESLint, and EditorConfig are set up so the code stays formatted the
same way for everyone, and VS Code applies it on save (see `.vscode/`).

### Running it as a website (and installing it as a PWA)

The same code runs in the browser through `react-native-web`. `npm run web`
serves it from Metro for development, and

```bash
npm run export:web    # writes a static site to dist/
```

produces a plain static site you can put on any static host (Netlify,
Cloudflare Pages, GitHub Pages, and so on). There is no server-side part; the
app talks to PocketBase or to the browser's local storage directly. The
layout stays phone-shaped on a wide screen, which is intended: the point of
the web build is the phone.

The web build is a progressive web app. On a phone, "Add to Home Screen" (iOS
Safari) or "Install app" (Android Chrome) puts a pocketJing3 icon on the home
screen that opens without the browser bars. The pieces live in `public/`
and are copied into the export as they are:

- `manifest.json`: name, icons, colours, and `display: standalone`.
- `index.html`: the page template with the manifest link and the Apple
  meta tags, and a script that registers the service worker.
- `sw.js`: a small service worker that caches the app shell (page, bundle,
  fonts, icons) so the site opens offline. Requests to PocketBase, the lookup
  sources, and cover images always go to the network. It only registers over https, so
  the Metro dev server is never cached. Bump `CACHE` in it when you change it.
- `icon-192.png`, `icon-512.png`, `favicon.png`: resized from `assets/icon.png`.

The host must serve the site over https for the install prompt and the
service worker to work (every host listed above does).

## Dependencies

The install command above is `npm ci --ignore-scripts` rather than a plain
`npm install` on purpose. After the Shai-Hulud worm and similar npm
supply-chain attacks, this project is careful about what it pulls in:

- Every dependency is pinned to an exact version (`.npmrc` sets
  `save-exact=true`), and `npm ci` installs exactly what the lockfile says.
- Lifecycle scripts are disabled on install. Nothing here needs them.
- Nothing is ever bumped to "latest". When a package is added or updated, the
  version has to be at least 10 days old, which gives the ecosystem time to
  catch a compromised release. The `--before` flag makes npm enforce that:

  ```bash
  npm install <pkg>@<version> --ignore-scripts --before=$(date -d '10 days ago' +%F)
  ```

- The project stays on Expo SDK 57 deliberately. Upgrading the SDK is a
  separate job, not something to do while fixing a bug.

## Where the data lives

There are two modes, and the app switches between them at runtime from the
Storage setting: under Settings, Advanced on the Me tab, or behind the
"Advanced" link on the Login screen so a fresh install can point at a server
before signing in. Pick "This device" or "PocketBase server", type the
server address, and use "Test connection" (it calls the server's
`/api/health` endpoint) before switching. Switching signs you out, because
accounts and entries stay in the store they were made in; nothing is deleted,
and switching back brings the old side back. The choice is saved on the
device. `EXPO_PUBLIC_POCKETBASE_URL` in `.env` only sets the first-launch
default; once a choice has been saved it wins.

**PocketBase (sync across devices).** Accounts live in PocketBase's `users`
collection and the library in an `entries` collection, so signing in on
another phone shows the same library. PocketBase is a single binary with
SQLite inside. Setup takes a few minutes and is written up in
[pocketbase/README.md](pocketbase/README.md): download the binary, run it,
let the included migration create the collection, and enter the server's LAN
address in the Storage setting. The session token is cached on the device so the app
opens straight into your library, and if the server is unreachable you stay
signed in and see an error with a retry.

**On the device (no server).** In device mode nothing leaves the phone. The
library is a SQLite file (`cinereact.db`, kept from the old CineReact name,
through `expo-sqlite`) in the app's
private sandbox, one row per entry with an index on the owning account, so a
change writes one row instead of rewriting the whole library. Accounts, the
session, and the language choice stay in AsyncStorage. The first time this
version runs on a device that used an earlier one, whatever AsyncStorage held
(the JSON library, or reviews from the OMDb-only app, carried over as
"watched" film entries) is copied into the table and removed from
AsyncStorage. On web, where `expo-sqlite` is still alpha, the library stays in
AsyncStorage.

Either way `LibraryContext` and `AuthContext` do not know which mode is on.
`StorageContext` reads the saved choice and asks `src/lib/backend.ts` for a
`LibraryStore` (list, create, update, remove) and an `AuthBackend` (restore,
signup, login, logout) to match; the device versions are in `sqliteStore.ts`
(with the AsyncStorage fallback in `libraryStore.ts`) and `auth.ts`, the
server versions in `pocketbase.ts`. When the choice changes, both contexts
start over against the new pair.

## The optional lookup

The add form has a "Fill from the web" button that opens a search sheet.
Picking a result fetches the full record and fills in the title, year,
director or author, description, cover, and genre tags. Everything stays
editable afterwards. The sheet has a chip for each source that covers the
entry's kind, and it remembers the last one picked for each kind.

| Source       | Kinds         | Key                        |
| ------------ | ------------- | -------------------------- |
| TMDB         | films, series | `EXPO_PUBLIC_TMDB_API_KEY` |
| OMDb         | films, series | `EXPO_PUBLIC_OMDB_API_KEY` |
| TVmaze       | series        | none                       |
| Open Library | books         | none                       |
| Google Books | books         | optional, raises the quota |

All of them are free. TMDB is the most current for new releases, and its
terms (like TVmaze's licence) ask for a credit line, which the sheet shows
under the results. A source that needs a key only appears once the key is
set, so with no keys at all the button shows for series and books but not
for films.

Each source lives in `src/api/lookup/` behind the same small interface
(`search` and `details`), so adding another means one file and one line in
`lookup/index.ts`. Search is debounced, and the request layer has a
timeout, so a hung connection fails into an error message instead of loading
forever.

The keys are `EXPO_PUBLIC_` values, which means they are built into the app
and readable by anyone who opens the web build. That is fine for free
personal keys; do not put a paid key there.

## A note on the authentication

In device-only mode there is no backend: accounts and sessions are kept in
AsyncStorage purely to show the Context-API auth flow working end to end, and
passwords are not hashed, so do not reuse a real one. With PocketBase the
password goes to your own server, which hashes it; use https before exposing
that server beyond your Wi-Fi.

## Tests

`npm test` runs 181 tests across 27 files, including:

| File                     | What it checks                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| `lib/validation`         | the email and password rules                                                             |
| `lib/tags`               | trimming, case-insensitive dedupe, and splitting comma-separated input                   |
| `lib/moods`              | dropping unknown moods, the fixed order, toggling                                        |
| `lib/score`              | clamping to one decimal, formatting, splitting for the picker, stars to score            |
| `api/http`               | the query string builder, year parsing, and HTML-to-text cleanup                         |
| `api/lookup/*`           | each source's URLs and key handling, the mapping to form fields, empty and error cases   |
| `api/lookup/index`       | which sources each kind gets with and without keys, and the saved-source fallback        |
| `components/LookupSheet` | source chips, searching again on a switch, remembering the source, picking a result      |
| `lib/pocketbase`         | record mapping both ways, the store's calls, and auth error mapping (fake client)        |
| `lib/sqliteStore`        | row mapping both ways, per-owner list and order, and the one-off AsyncStorage import     |
| `lib/summary`            | month and year ranges, counts per kind (rewatches too), average score, time and pages    |
| `lib/labels`             | runtime and page formatting in both languages, rewatch and reread wording                |
| `context/AuthContext`    | signup, login, logout, duplicate email, short password, wrong password                   |
| `context/LibraryContext` | add, validate, update, finish dates, rewatches, length, quotes, moods, remove, migration |
| `context/ThemeContext`   | default theme, switching and persisting, restoring a saved theme, memoised styles        |
| `context/StorageContext` | device default, switching to a server and persisting, bad saved values, health check     |

One thing to know if you touch the test setup: `jest-expo@57` still targets the
Jest 29 line, so `jest` is pinned to `29.7.0`; pulling in Jest 30 crashes the
runner.
AsyncStorage is swapped for a small in-memory mock in `jest.setup.js`, and
`expo-sqlite` (native, so it cannot load under Node) for the in-memory fake in
`__mocks__/expo-sqlite.ts`, which only understands the statements the store
issues.

## Screenshots

A mockup of the earlier movie-only screens lives in
[preview/screens.png](preview/screens.png) (rendered from `preview/mock.html`).
It predates the library revamp, so treat it as a design reference for the look
rather than the current layout.
