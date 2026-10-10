/**
 * Jest stand-in for expo-image-picker, picked up through
 * jest.mock('expo-image-picker') in jest.setup.js. Permission is granted and
 * the picker is always cancelled; a test that needs a picked image can
 * override launchImageLibraryAsync with jest.spyOn.
 */

export const requestMediaLibraryPermissionsAsync = async () => ({
  granted: true,
  status: 'granted',
  canAskAgain: true,
  expires: 'never',
});

export const launchImageLibraryAsync = async () => ({
  canceled: true,
  assets: null,
});
