import { ClientResponseError, type RecordModel } from 'pocketbase';
import { createAuthBackend, toUser, type Client } from '../pocketbase';
import type { User } from '../auth';

const ali: User = { id: 'u1', name: 'Ali', email: 'a@b.com' };

const userRecord = (overrides: Partial<RecordModel> = {}): RecordModel => ({
  id: 'u1',
  collectionId: 'c0',
  collectionName: 'users',
  name: 'Ali',
  email: 'a@b.com',
  avatar: '',
  favourites: null,
  ...overrides,
});

function fakeClient() {
  const collection = { update: jest.fn() };
  const files = { getURL: jest.fn(() => 'http://pb/api/files/u1/avatar.jpg') };
  const client = {
    collection: jest.fn(() => collection),
    authStore: { isValid: false, record: null, clear: jest.fn() },
    files,
  } as unknown as Client;
  return { client, collection, files };
}

describe('pocketbase users mapping', () => {
  it('maps an avatar to a thumbnail URL and a missing one to undefined', () => {
    const { client, files } = fakeClient();
    expect(toUser(client, userRecord()).avatar).toBeUndefined();
    const withPhoto = toUser(client, userRecord({ avatar: 'avatar.jpg' }));
    expect(withPhoto.avatar).toBe('http://pb/api/files/u1/avatar.jpg');
    expect(files.getURL).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'u1' }),
      'avatar.jpg',
      { thumb: '256x256' },
    );
  });

  it('reads the favourites list, empty when the field is unset', () => {
    const { client } = fakeClient();
    expect(toUser(client, userRecord()).favourites).toEqual([]);
    expect(
      toUser(client, userRecord({ favourites: ['i1', 'i2'] })).favourites,
    ).toEqual(['i1', 'i2']);
  });
});

describe('pocketbase updateProfile', () => {
  it('sends the name and favourites as plain fields', async () => {
    const { client, collection } = fakeClient();
    collection.update.mockResolvedValue(
      userRecord({ name: 'Ali B', favourites: ['i1'] }),
    );
    const user = await createAuthBackend(client).updateProfile(ali, {
      name: 'Ali B',
      favourites: ['i1'],
    });
    expect(collection.update).toHaveBeenCalledWith('u1', {
      name: 'Ali B',
      favourites: ['i1'],
    });
    expect(user).toMatchObject({ name: 'Ali B', favourites: ['i1'] });
  });

  it('uploads a picked picture as form data', async () => {
    const { client, collection } = fakeClient();
    collection.update.mockResolvedValue(userRecord({ avatar: 'avatar.jpg' }));
    const user = await createAuthBackend(client).updateProfile(ali, {
      avatar: { uri: 'file:///tmp/x.jpg', mimeType: 'image/jpeg' },
    });
    expect(collection.update).toHaveBeenCalledTimes(1);
    const [id, body] = collection.update.mock.calls[0];
    expect(id).toBe('u1');
    expect(body).toBeInstanceOf(FormData);
    expect(user.avatar).toBe('http://pb/api/files/u1/avatar.jpg');
  });

  it('clears the picture with an empty file field', async () => {
    const { client, collection } = fakeClient();
    collection.update.mockResolvedValue(userRecord());
    await createAuthBackend(client).updateProfile(ali, { avatar: null });
    expect(collection.update).toHaveBeenCalledWith('u1', { avatar: null });
  });

  it('returns the user unchanged when there is nothing to send', async () => {
    const { client, collection } = fakeClient();
    const user = await createAuthBackend(client).updateProfile(ali, {});
    expect(collection.update).not.toHaveBeenCalled();
    expect(user).toBe(ali);
  });

  it('turns a server failure into the profile error key', async () => {
    const { client, collection } = fakeClient();
    collection.update.mockRejectedValue(
      new ClientResponseError({ status: 400, response: { data: {} } }),
    );
    await expect(
      createAuthBackend(client).updateProfile(ali, { name: 'x' }),
    ).rejects.toThrow('errProfileSave');
  });
});
