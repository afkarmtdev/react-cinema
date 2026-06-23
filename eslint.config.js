// Flat ESLint config (Expo preset + Prettier compatibility).
// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintConfigPrettier = require('eslint-config-prettier');
const unusedImports = require('eslint-plugin-unused-imports');

module.exports = defineConfig([
  expoConfig,
  // Turns off ESLint rules that would conflict with Prettier formatting.
  eslintConfigPrettier,
  {
    // The TS parser assumes JSX references `React` (jsxPragma) by default, which
    // hides unused `import React`. We use the automatic runtime, so clear it.
    languageOptions: {
      parserOptions: { jsxPragma: null },
    },
    plugins: { 'unused-imports': unusedImports },
    rules: {
      // Unused-imports owns dead imports/vars (it can auto-remove imports on
      // --fix); turn off the overlapping core rules to avoid double reporting.
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      // We use the automatic JSX runtime (babel-preset-expo), so JSX does NOT
      // need React in scope. Turning these off lets the unused-imports rule
      // catch a stray `import React` that's only there for legacy JSX.
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      // This React-Compiler rule flags the standard "set loading/error before a
      // fetch" effect as a false positive; the rest of react-hooks stays on.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    // Make Jest globals available in test files.
    files: ['**/__tests__/**', '**/*.test.{ts,tsx}', 'jest.setup.js'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        global: 'readonly',
      },
    },
  },
  {
    ignores: ['dist/**', 'dist-verify/**', 'coverage/**', '.expo/**'],
  },
]);
