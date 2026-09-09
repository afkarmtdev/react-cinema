---
name: test
description: Run or extend the Jest unit tests for this Expo SDK 54 + TypeScript cinema app (CineReact). Use when asked to run tests, add a test, debug a failing test, or check coverage. Captures the jest-expo/Jest 29 pin and the layout of the existing tests.
---

# Testing CineReact

## Run the tests

Node 24 is the default in both PowerShell and Bash on this machine, so either
tool works:

```powershell
npm test                 # run everything once (29 tests in 5 files)
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
- `src/api/__tests__/movies.test.ts`: `fetch` is mocked. Checks the OMDb URL
  (search term, default query, `y=`, `type=`, `page=`), the mapping of search
  and detail records, "N/A" cleanup, the empty result for "Movie not found!",
  and that other OMDb errors throw.
- `src/hooks/__tests__/useMovies.switch.test.tsx`: `fetchMovies` is spied on
  with `jest.spyOn`. Checks that changing filters replaces the list, that a
  failed filter change clears the list and sets the error flag, and that a
  page request still in flight from the previous filter is dropped instead of
  appended.
- `src/context/__tests__/AuthContext.test.tsx`: signup, login, logout,
  duplicate email, short password, wrong password. Uses RNTL `renderHook`.
- `src/context/__tests__/ReviewsContext.test.tsx`: save, update, and remove a
  review (mounts Auth and Reviews together and signs a user in first).

## Setup files

- `jest.config.js`: `preset: 'jest-expo'`, points at `jest.setup.js`, ignores
  `node_modules` and `dist-verify`.
- `jest.setup.js`: mocks `@react-native-async-storage/async-storage` with a
  simple in-memory store; tests call `AsyncStorage.clear()` in `beforeEach`.
- `babel.config.js`: `babel-preset-expo` (needed by both Metro and Jest).
- `tsconfig.json` sets `"types": ["jest", "node"]` so `tsc --noEmit` sees the
  Jest globals in test files.

## Adding a test

Put it next to the code under a `__tests__` folder, named `*.test.ts` or
`*.test.tsx`. For anything that touches a context, wrap the hook in the
matching provider(s) and use `act` and `waitFor` from
`@testing-library/react-native`. For hooks that call the API, spy on the
function in `src/api/movies` rather than mocking `fetch`, as the useMovies
test does. When you add a test file, update the count in the README's Tests
section.
