# CineReact

> **Cine·React** &nbsp; /ˌsɪn.iˈrækt/ &nbsp; _noun_ &nbsp;·&nbsp; a blend of **ciné** (cinema) + **react**
>
> 1. A React Native app for browsing, searching, and reviewing movies.
> 2. _to react_: to respond to a film with a star rating and a few honest words.
>
> _Built with React · powered by your reactions._

CineReact is a small movie-review app built with React Native (Expo +
TypeScript). You can browse and search movies, open any of them to read the
details, and, once you're signed in, leave a star rating and a short review.

It started as two separate take-home briefs: one for listing and searching
movies from an API, and one for a login/signup flow built on React's Context
API. I merged them into a single app and added the reviews feature so that
signing in actually does something. The look is borrowed from the Golden Screen
Cinemas (GSC) app: a dark background with yellow accents.

## What it does

**Accounts.** Sign up, log in, and log out, all handled by a single
`AuthContext`. The forms validate the way you'd expect: no empty fields, a valid
email, a password of at least six characters, no duplicate accounts, and the
right credentials to log in. When something's off, you get a clear message
instead of a silent failure. The password field has a show/hide toggle, and your
session is saved on the device, so you stay logged in after closing the app.
While that saved session loads at startup, there's a short branded splash screen.

**Movies.** The home screen pulls a movie list from OMDb and lays it out as a
poster grid that pages in more as you scroll (OMDb returns 10 per page, and the
list requests the next page when you near the bottom). Each card shows the title
and year (OMDb's search
results are lightweight, so the rating and director come from the detail screen).
The search box filters by title and updates as you type, and the filter button
next to it opens a sheet to narrow results by year or type (movie/series), which
map to OMDb's own `y=` and `type=` parameters. Tapping a movie opens a detail
screen with the rating, director, synopsis, cast, and runtime. Anywhere the app
fetches data it handles the three states you'd want: a loading placeholder, an
error state with a retry button, and an empty state.

**Reviews.** This is the part that ties the two halves together. A signed-in user
can rate a movie one to five stars and write a short review. Everyone gets one
review per movie, which they can edit or delete later. The detail screen shows
the average rating alongside everyone's reviews, and the "My Reviews" tab gathers
yours in one place.

**Two languages.** The whole interface is available in English (the default) and
Bahasa Melayu, switchable from the profile tab. Your choice is remembered between
launches.

## Tech stack

| Concern     | Choice                                                                        |
| ----------- | ----------------------------------------------------------------------------- |
| Framework   | Expo SDK 54 (managed) + TypeScript                                            |
| Navigation  | React Navigation 7 (native-stack + bottom-tabs)                               |
| State       | React Context API + hooks (`useState`, `useEffect`, `useMemo`, `useCallback`) |
| i18n        | A small `LanguageContext` + `t()` dictionary (English / Malay)                |
| Persistence | `@react-native-async-storage/async-storage`                                   |
| Testing     | Jest + `jest-expo` + React Native Testing Library                             |
| Icons       | `@expo/vector-icons` (Ionicons)                                               |
| Networking  | `fetch`, with a guard that ignores out-of-date search responses               |

## Project structure

```
src/
├─ api/            movies.ts (fetch the list, search, and a single movie)
├─ components/
│  ├─ ui/          Button, TextField, Screen, StarRating, Skeleton, StateViews
│  ├─ BrandHeader, SearchBar, MovieCard, ReviewItem, ReviewComposer
├─ context/        AuthContext, ReviewsContext, LanguageContext
│  └─ __tests__/   tests for the auth and reviews contexts
├─ i18n/           translations.ts (English / Malay dictionaries)
├─ hooks/          useMovies, useMovieDetail, useDebouncedValue
├─ lib/            storage (AsyncStorage wrapper), validation
├─ navigation/     RootNavigator, AuthStack, MainTabs, MoviesStack, types
├─ screens/        SplashScreen, auth/(Login, Signup), movies/(List, Detail),
│                  ReviewsScreen, ProfileScreen
├─ theme/          colours, spacing, and type tokens
└─ types/          movie.ts
```

## Getting started

You'll need Node.js 18 or newer (I built this on Node 24) and the Expo Go app on
your phone, or an Android emulator / iOS simulator.

The app reads movie data from OMDb, which needs a free API key. Grab one (1,000
requests/day) at https://www.omdbapi.com/apikey.aspx, then put it in a `.env`
file:

```bash
cp .env.example .env
# open .env and set EXPO_PUBLIC_OMDB_API_KEY=your_key
```

Then install and run:

```bash
npm install
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

## How the API calls work

The data comes from the OMDb API over https:

| Use    | Request                                |
| ------ | -------------------------------------- |
| Search | `GET ?apikey=KEY&type=movie&s=<query>` |
| Detail | `GET ?apikey=KEY&i=<imdbID>&plot=full` |

A few things worth knowing about OMDb:

- It only searches by a term, so the home screen seeds the list with a default
  query when the search box is empty.
- Search results are lightweight (title, year, poster, imdb id). The **rating,
  director, cast, and plot come from the detail endpoint**, so they show on the
  movie's detail screen rather than on the list cards. The id is OMDb's
  `imdbID`, which is why movie ids are strings.

Search is debounced so it isn't firing on every keystroke. Because a few
requests can be in flight at once when you type quickly, the hook ignores any
response that's no longer the most recent one, so the list never flickers back to
stale results. The request layer also has a timeout, so a hung connection fails
into the error state instead of loading forever.

## A note on the authentication

There's no backend. Accounts and sessions are kept on the device with
AsyncStorage purely to show the Context-API auth flow working end to end.
Passwords aren't hashed and never leave the phone, so please don't reuse a real
one.

## Tests

`npm test` runs 23 tests across four files:

| File                     | What it checks                                                               |
| ------------------------ | ---------------------------------------------------------------------------- |
| `lib/validation`         | the email and password rules                                                 |
| `api/movies`             | the URL it builds, search encoding, odd responses, and errors (fetch mocked) |
| `context/AuthContext`    | signup, login, logout, duplicate email, short password, wrong password       |
| `context/ReviewsContext` | creating, updating (not duplicating), and deleting a review                  |

One thing to know if you touch the test setup: `jest-expo@54` targets the Jest 29
line, so `jest` is pinned to `29.7.0`; pulling in Jest 30 crashes the runner.
AsyncStorage is swapped for a small in-memory mock in `jest.setup.js`.

## Screenshots

A mockup of the main screens lives in [preview/screens.png](preview/screens.png)
(rendered from `preview/mock.html`). It's a design reference, not a live capture.
I'll swap in real Expo Go screenshots (or a short screen recording) of the flow:
splash, login/signup, the movie list and search, a detail screen with a review,
My Reviews, and the profile/logout.

## What the briefs asked for

Movie app:

- [x] Movie list with `FlatList` + infinite scroll (paginated)
- [x] Title, year, and director on each item
- [x] Search by title, updating live
- [x] Filter results by year and type (movie/series)
- [x] Detail screen for the selected movie
- [x] Loading, error, and empty states
- [x] Built on `useState` / `useEffect` / `useMemo`
- [x] React Navigation, with reusable components

Authentication app:

- [x] `AuthContext` with `login`, `signup`, `logout`, and `user`
- [x] Validation and error messages on both forms
- [x] Home/profile screen showing the user, with logout
- [x] Session persistence via AsyncStorage (optional)
- [x] React Navigation between screens
- [x] Password visibility toggle (bonus)
