import AsyncStorage from '@react-native-async-storage/async-storage';
import { avatarUri, localAuthBackend } from '../auth';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('local auth backend profile', () => {
  it('changes the name and keeps it for the next login', async () => {
    const user = await localAuthBackend.signup('Ali', 'a@b.com', 'secret');
    const updated = await localAuthBackend.updateProfile(user, {
      name: 'Ali Baba',
    });
    expect(updated.name).toBe('Ali Baba');
    expect(await localAuthBackend.restore()).toMatchObject({
      name: 'Ali Baba',
    });
    await localAuthBackend.logout();
    expect(await localAuthBackend.login('a@b.com', 'secret')).toMatchObject({
      name: 'Ali Baba',
    });
  });

  it('keeps the picked picture as a data URI and can remove it', async () => {
    const user = await localAuthBackend.signup('Ali', 'a@b.com', 'secret');
    const withPhoto = await localAuthBackend.updateProfile(user, {
      avatar: {
        uri: 'file:///tmp/x.jpg',
        base64: 'AAAA',
        mimeType: 'image/png',
      },
    });
    expect(withPhoto.avatar).toBe('data:image/png;base64,AAAA');
    const without = await localAuthBackend.updateProfile(withPhoto, {
      avatar: null,
    });
    expect(without.avatar).toBeUndefined();
  });

  it('falls back to the file path when the picker gave no bytes', () => {
    expect(avatarUri({ uri: 'file:///tmp/x.jpg' })).toBe('file:///tmp/x.jpg');
  });

  it('stores the top four in order', async () => {
    const user = await localAuthBackend.signup('Ali', 'a@b.com', 'secret');
    const updated = await localAuthBackend.updateProfile(user, {
      favourites: ['i2', 'i1'],
    });
    expect(updated.favourites).toEqual(['i2', 'i1']);
    expect(await localAuthBackend.restore()).toMatchObject({
      favourites: ['i2', 'i1'],
    });
  });

  it('leaves untouched fields alone', async () => {
    const user = await localAuthBackend.signup('Ali', 'a@b.com', 'secret');
    const withPhoto = await localAuthBackend.updateProfile(user, {
      avatar: { uri: 'file:///tmp/x.jpg', base64: 'AAAA' },
      favourites: ['i1'],
    });
    const renamed = await localAuthBackend.updateProfile(withPhoto, {
      name: 'Ali B',
    });
    expect(renamed).toMatchObject({
      name: 'Ali B',
      email: 'a@b.com',
      avatar: 'data:image/jpeg;base64,AAAA',
      favourites: ['i1'],
    });
  });
});
