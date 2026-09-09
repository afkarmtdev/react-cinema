const preset = require('jest-expo/jest-preset');

// jest-expo transforms a known list of React Native packages and leaves the
// rest of node_modules alone. The PocketBase SDK ships as ES modules with
// named exports, so it has to be added to that list to load under Jest.
const transformIgnorePatterns = preset.transformIgnorePatterns.map((pattern) =>
  pattern.replace('|native-base))', '|native-base|pocketbase))'),
);

module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // Only run our own tests, not anything inside dependencies.
  testPathIgnorePatterns: ['/node_modules/', '/dist-verify/'],
  transformIgnorePatterns,
  // Node resolution picks the SDK's .mjs entry, which Babel is not set up to
  // transform here; the .js ES build is the same code and transforms fine.
  moduleNameMapper: {
    '^pocketbase$': '<rootDir>/node_modules/pocketbase/dist/pocketbase.es.js',
  },
};
