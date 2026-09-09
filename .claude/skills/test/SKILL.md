---
name: test
description: Run or extend the Jest unit tests for this Expo SDK 54 + TypeScript library tracker (CineReact). Use when asked to run tests, add a test, debug a failing test, or check coverage. Captures the jest-expo/Jest 29 pin and the layout of the existing tests.
---

# Testing CineReact

## Run the tests

Node 24 is the default in both PowerShell and Bash on this machine, so either
tool works:

```powershell
npm test                 # run everything once (60 tests in 9 files)
npx jest --watch         # watch mode
npx jest path/to/file    # a single file
npx jest -t "duplicate"  # tests matching a name
npx jest --coverage      # coverage table
```

The OMDb client logs each request with `console.log`, so expect a few
`[movies] GET ...` lines in the test output. That is normal, not a failure.

## Stack (and a version constraint that matters)

- `jest-expo@54.0.17` is the preset (Expo/RN transform and mocks).
- `jest-expo@54` is built for the Jest 29 line, so `jest` is pinned to
  `29.7.0`. Do not bump jest to 30: `jest-expo@54` pulls Jest 29 environment
  packages, and mixing in Jest 30's runtime crashes with
  `this._moduleMocker.clearMocksOnScope is not a function`.
- `@testing-library/react-native@13.2.0` (Jest 29 and React 19 compatible) with
  `react-test-renderer@19.1.0`.
- Like everything else in the project, test dependencies are pinned exactly
  and must be at least 10 days old when added. See the dependency policy in
  AGENTS.md before touching any of them.

## How the tests are organised

- `src/lib/__tests__/validation.test.ts`: pure helpers (email and password).
- `src/lib/__tests__/tags.test.ts`: tag trimming, case-insensitive dedupe,
  and splitting comma-separated input.
- `src/api/__tests__/movies.test.ts`: `fetch` is mocked. Checks the OMDb URL
  (search term, default query, `y=`, `type=`, `page=`), the mapping of search
  and detail records, "N/A" cleanup, the empty result for "Movie not found!",
  and that other OMDb errors throw.
- `src/lib/__tests__/score.test.ts`: the 1.0 to 10.0 score helpers, including
  the rule that migrated five-star ratings become 9.9, never 10.
- `src/lib/__tests__/pocketbase.test.ts`: a fake client object (duck-typed
  to the SDK's `collection()` and `authStore`) checks record mapping in both
  directions, which collection calls the store makes, and how SDK errors map
  to AuthError codes (duplicate email, wrong password, no connection).
- `src/context/__tests__/ThemeContext.test.tsx`: default theme, switching
  and persisting, restoring a saved (or unknown) value, and that
  `useThemedStyles` only rebuilds when the theme changes.
- `src/context/__tests__/StorageContext.test.tsx`: the Storage setting.
  Device default with the local pair, switching to a server (persisted,
  address cleaned, invalid address falls back to device), restoring a saved
  or malformed value, the local fallback outside a provider, that a change
  signs the user out, and `testConnection` with `fetch` mocked.
- `src/context/__tests__/AuthContext.test.tsx`: signup, login, logout,
  duplicate email, short password, wrong password. Uses RNTL `renderHook`.
- `src/context/__tests__/LibraryContext.test.tsx`: add, title validation,
  field trimming and tag dedupe, finish date on status changes, remove, tag
  ordering, per-user separation, and the one-off migration of old reviews
  (mounts Auth and Library together and signs a user in first).

## Setup files

- `jest.config.js`: `preset: 'jest-expo'`, points at `jest.setup.js`, ignores
  `node_modules` and `dist-verify`. It also adds `pocketbase` to jest-expo's
  transform allowlist and maps the package to `dist/pocketbase.es.js`,
  because the SDK's default entry is an .mjs file Jest will not transform
  and its CJS build has no named exports.
- `jest.setup.js`: mocks `@react-native-async-storage/async-storage` with a
  simple in-memory store; tests call `AsyncStorage.clear()` in `beforeEach`.
- `babel.config.js`: `babel-preset-expo` (needed by both Metro and Jest).
- `tsconfig.json` sets `"types": ["jest", "node"]` so `tsc --noEmit` sees the
  Jest globals in test files.

## Adding a test

Put it next to the code under a `__tests__` folder, named `*.test.ts` or
`*.test.tsx`. For anything that touches a context, wrap the hook in the
matching provider(s) and use `act` and `waitFor` from
`@testing-library/react-native`. For anything that calls OMDb, spy on the
function in `src/api/movies` with `jest.spyOn` rather than mocking `fetch`. When you add a test file, update the count in the README's Tests
section.
