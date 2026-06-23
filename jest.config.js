module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // Only run our own tests, not anything inside dependencies.
  testPathIgnorePatterns: ['/node_modules/', '/dist-verify/'],
};
