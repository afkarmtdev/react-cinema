# Code Walkthrough (for explaining the app)

This is a cheat-sheet for talking through the project. It maps each file to
**what it does** and **why**, and lists likely interview questions with answers.

---

## 1. The big picture (say this first)

> "It's an Expo + TypeScript app. There are two Contexts, one for auth and one
> for reviews, wrapped around the whole app. Navigation shows either the login flow
> or the main tabs depending on whether someone is logged in. The movie data
> comes from a public REST API; reviews are stored on the device with
> AsyncStorage."

**Data flow:**

```
App.tsx
 └─ SafeAreaProvider
     └─ AuthProvider          ← who is logged in (Context)
         └─ ReviewsProvider   ← saved ratings/reviews (Context)
             └─ RootNavigator ← splash → (logged in? tabs : login/signup)
```

Movies: `screen → useMovies() hook → api/movies.ts → fetch() → FreeTestAPI`.

---

## 2. File-by-file

### Entry & navigation

| File                           | What it does                                                                                                            |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `App.tsx`                      | Wraps the app in the providers and renders the navigator.                                                               |
| `navigation/RootNavigator.tsx` | Shows the splash while the saved session loads, then shows the tabs if `user` exists, otherwise the login/signup stack. |
| `navigation/AuthStack.tsx`     | Native stack: Login → Signup.                                                                                           |
| `navigation/MainTabs.tsx`      | Bottom tabs: Movies, Reviews, Me.                                                                                       |
| `navigation/MoviesStack.tsx`   | Native stack inside the Movies tab: list → detail.                                                                      |
| `navigation/types.ts`          | TypeScript param lists so `navigation.navigate` is type-checked.                                                        |

### State (Context API)

| File                          | What it does                                                                                                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `context/AuthContext.tsx`     | Holds `user`; exposes `login`, `signup`, `logout`. Validates input, checks credentials against accounts saved in AsyncStorage, and restores the session on launch.              |
| `context/ReviewsContext.tsx`  | Holds all reviews; exposes helpers to get a movie's reviews, get my review, save (create/update), and delete. Persists to AsyncStorage.                                         |
| `context/LanguageContext.tsx` | Holds the current language and a `t(key)` helper that looks text up in `i18n/translations.ts`. Defaults to English, persists the choice, and updates the whole UI when changed. |

### Data fetching

| File                         | What it does                                                                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `api/movies.ts`              | Two functions: `fetchMovies(search?)` and `fetchMovieById(id)`. Builds the URL (adds `?search=`), checks the response, returns typed data. |
| `hooks/useMovies.ts`         | Runs `fetchMovies` in `useEffect`, tracks `loading`/`error`, and ignores stale results when the search changes.                            |
| `hooks/useMovieDetail.ts`    | Same pattern for one movie.                                                                                                                |
| `hooks/useDebouncedValue.ts` | Waits until typing pauses (350ms) before returning the value, which stops a request on every keystroke.                                    |

### Screens

| File                                   | What it does                                                                           |
| -------------------------------------- | -------------------------------------------------------------------------------------- |
| `screens/auth/LoginScreen.tsx`         | Email + password, calls `login`, shows errors.                                         |
| `screens/auth/SignupScreen.tsx`        | Name + email + password, calls `signup`, shows errors.                                 |
| `screens/movies/MoviesListScreen.tsx`  | Search bar + 2-column `FlatList` of movies. Loading skeleton, error, and empty states. |
| `screens/movies/MovieDetailScreen.tsx` | Movie info + the rating/review form + the list of reviews.                             |
| `screens/ReviewsScreen.tsx`            | The current user's reviews; tap one to open that movie.                                |
| `screens/ProfileScreen.tsx`            | Name/email, a couple of stats, and Log out.                                            |
| `screens/SplashScreen.tsx`             | The branded "Almost showtime…" loading screen.                                         |

### Reusable components

`components/ui/` holds the small building blocks: `Button`, `TextField`
(with the password eye toggle), `Screen` (safe-area wrapper), `StarRating`,
`Skeleton`, and the `Loading`/`ErrorView`/`EmptyView` state views.
`components/` holds the feature pieces: `SearchBar`, `MovieCard`,
`ReviewItem`, `ReviewComposer`, `BrandHeader`.

### Helpers

| File                | What it does                                                                                 |
| ------------------- | -------------------------------------------------------------------------------------------- |
| `lib/storage.ts`    | A small wrapper that JSON-encodes values in/out of AsyncStorage, plus the storage key names. |
| `lib/validation.ts` | Email regex + the minimum password length.                                                   |
| `theme/index.ts`    | Colors, spacing, radius, and font sizes used everywhere.                                     |
| `types/movie.ts`    | The `Movie` type returned by the API.                                                        |

---

## 3. Why I made these choices (the "why" questions)

- **Why Context API and not Redux?** The app only has two pieces of shared
  state (the user and the reviews). Context is the right size; Redux would be
  overkill. The brief also asked for Context.

- **Why custom hooks (`useMovies`)?** It keeps the fetching logic out of the
  screen so the screen just deals with UI. It also means the loading/error
  pattern is written once and reused for the detail screen.

- **Why the `ignore` flag in the effect?** If you type fast, several requests
  are in flight. The flag makes sure that if the search term changed, an old
  (slow) response doesn't overwrite the newer results. The cleanup function
  sets `ignore = true` when the effect re-runs or the screen unmounts.

- **Why debounce the search?** Without it, every keystroke fires an API call.
  Debouncing waits for a 350ms pause, so "toy" sends one request, not three.

- **Why `useMemo` in the list?** The list is sorted and capped to 20 items.
  `useMemo` avoids redoing that work on every re-render, only when the data or
  the selected segment changes.

- **Is the list paginated? (No, it's a 20-item cap.)** I fetch the whole list
  in one call, then `.slice(0, 20)` for display. That's a cap, not pagination.
  The reason is the API itself: FreeTestAPI returns one small fixed dataset in a
  single response, so there's no page 2 to fetch. If the API supported paging
  (or the dataset were large), I'd add `FlatList`'s `onEndReached` to load the
  next batch instead of capping.

- **Why AsyncStorage and not a database?** There's no backend in the brief, so
  AsyncStorage is the standard way to persist small data on the device. It's
  how the "stay logged in" and saved-reviews features work.

- **How does the language switch work?** All text lives in one dictionary
  (`i18n/translations.ts`) keyed by short names, with an `en` and `ms` version.
  `LanguageContext` keeps the current language and a `t(key)` function; every
  screen calls `t('someKey')` instead of hard-coding text. Changing the language
  updates the context, so every screen re-renders with the other language. I
  kept it as a small dictionary rather than a library like i18next because the
  app only has two languages and a fixed set of strings.

- **Why one review per user per movie?** `saveReview` updates the existing
  review if there is one, otherwise creates a new one, so a user's rating is a
  single, editable opinion rather than duplicates.

- **Why is the search bar kept outside the loading swap?** So the keyboard
  doesn't close mid-search. Only the content area below it switches between
  skeleton / list / empty.

---

## 4. Likely interview questions

**Q: Walk me through what happens when I search "batman".**
A: Each keystroke updates `query`. `useDebouncedValue` waits 350ms after I stop
typing, then `debouncedQuery` changes. `useMovies` sees the new term, sets
loading, and calls `fetchMovies("batman")`, which requests
`/movies?search=batman`. When it resolves, the list updates. If I keep typing,
the older request is ignored by the `ignore` flag.

**Q: How does login persist across app restarts?**
A: On `login`/`signup` I save the user to AsyncStorage under a "session" key.
On launch, `AuthProvider` reads that key in a `useEffect`; if it finds a user,
it sets it in state, so the navigator goes straight to the tabs.

**Q: Where do reviews live and how are they tied to a user?**
A: In `ReviewsContext`, persisted as one array in AsyncStorage. Each review
stores the `userId` and `movieId`, so I can filter by movie (detail screen) or
by user (My Reviews tab).

**Q: How do you handle a failed request or no results?**
A: The hook catches the error and sets an `error` string; the screen shows an
`ErrorView` with a retry button. If the request succeeds but the list is empty,
`FlatList`'s `ListEmptyComponent` shows an `EmptyView`.

**Q: How did you add multi-language support?**
A: A `LanguageContext` holds the current language and a `t(key)` helper. Text is
stored in one dictionary file with an English and a Bahasa Melayu version, and
screens look strings up by key. The default is English; the user switches from
the Me tab and the choice is saved to AsyncStorage. Validation/auth errors are
thrown as keys (like `errIncorrect`) so they translate too.

**Q: What did you test, and how?**
A: 20 unit tests with Jest (the `jest-expo` preset) and React Native Testing
Library. I focused on logic, not pixels: the validation helpers, the API layer
(with `fetch` mocked, checking the URL, the `?search=` encoding, the non-array
guard, and error throwing), and the two contexts (signup/login/logout, duplicate
email, and that saving a review updates instead of duplicating). For the contexts
I render the hook inside its provider with `renderHook` and drive it with `act`.
AsyncStorage is swapped for a small in-memory mock. One gotcha: `jest-expo@56`
targets jest 29, so jest is pinned to 29.7.0; jest 30 crashes the runner.

**Q: What would you add with more time?**
A: Real backend auth with hashed passwords, pull-to-refresh, pagination, unit
tests for the validation and the reviews reducer logic, and caching the movie
list so it loads instantly on return.

**Q: Any trade-offs you're aware of?**
A: Auth is local/demo only (passwords aren't hashed, and I note that in the
README). Search relies on the API's own filtering. The "Advance Sales" segment
is a client-side re-sort, not real showtime data.
