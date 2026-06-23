---
name: test
description: Run or extend the Jest unit tests for this Expo + TypeScript cinema app (CineReact). Use when asked to run tests, add a test, debug a failing test, or check coverage. Captures the jest-version constraint that this project depends on.
---

# Testing CineReact

## Run the tests

Use **PowerShell** (node v24, see the `run-app` skill for why):

```powershell
npm test                 # run everything once
npx jest --watch         # watch mode
npx jest path/to/file    # a single file
npx jest -t "duplicate"  # tests matching a name
```

## Stack (and a version constraint that matters)

- **jest-expo** is the preset (handles the Expo/RN transform + mocks).
- **`jest-expo@56` is built for the jest 29 line**, so `jest` is pinned to
  `29.7.0`. Do NOT bump jest to 30; `jest-expo@56` pulls jest-29 environment
  packages, and mixing in jest-30's runtime crashes with
  `this._moduleMocker.clearMocksOnScope is not a function`.
- `@testing-library/react-native@13.2.0` (jest-29 + React-19 compatible) with
  `react-test-renderer@19.2.3`.
- All test deps are pinned to exact versions ≥7 days old, like the rest of the
  project.

## How the tests are organised

- `src/lib/__tests__/validation.test.ts`: pure helpers (email/password).
- `src/api/__tests__/movies.test.ts`: `fetch` is mocked; checks URL building,
  the non-array normalisation, and error throwing.
- `src/context/__tests__/AuthContext.test.tsx`: signup/login/logout, duplicate
  email, short password, wrong password. Uses RNTL `renderHook`.
- `src/context/__tests__/ReviewsContext.test.tsx`: save/update/remove a review
  (mounts Auth + Reviews together and signs a user in first).

## Setup files

- `jest.config.js`: `preset: 'jest-expo'`, points at `jest.setup.js`.
- `jest.setup.js`: mocks `@react-native-async-storage/async-storage` with a
  simple in-memory store; tests call `AsyncStorage.clear()` in `beforeEach`.
- `babel.config.js`: `babel-preset-expo` (needed by both Metro and jest).
- `tsconfig.json` sets `"types": ["jest", "node"]` so `tsc --noEmit` sees the
  jest globals in test files.

## Adding a test

Put it next to the code under a `__tests__` folder, named `*.test.ts(x)`.
For anything that touches a context, wrap the hook in the matching provider(s)
and use `act`/`waitFor` from `@testing-library/react-native`.
