// Replace AsyncStorage with a simple in-memory store so the auth and reviews
// tests can run without a device. Each test file gets its own store; call
// AsyncStorage.clear() in beforeEach to reset between tests.
jest.mock('@react-native-async-storage/async-storage', () => {
  let store = {};
  return {
    setItem: jest.fn((key, value) => {
      store[key] = value;
      return Promise.resolve();
    }),
    getItem: jest.fn((key) =>
      Promise.resolve(key in store ? store[key] : null),
    ),
    removeItem: jest.fn((key) => {
      delete store[key];
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      store = {};
      return Promise.resolve();
    }),
  };
});
