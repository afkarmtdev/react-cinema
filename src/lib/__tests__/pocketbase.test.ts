import { ClientResponseError, type RecordModel } from 'pocketbase';
import { AuthError } from '../auth';
import {
  createAuthBackend,
  createLibraryStore,
  toItem,
  toRecord,
  type Client,
} from '../pocketbase';
import type { LibraryItem } from '../../types/library';

const dune: LibraryItem = {
  id: 'abc123',
  ownerId: 'user1',
  kind: 'book',
  title: 'Dune',
  year: 1965,
  creator: 'Frank Herbert',
  tags: ['sci-fi'],
  status: 'done',
  rating: 5,
  review: 'Great',
  createdAt: Date.parse('2026-09-01T10:00:00.000Z'),
  updatedAt: Date.parse('2026-09-02T10:00:00.000Z'),
  finishedAt: Date.parse('2026-09-02T09:00:00.000Z'),
};

const record = (overrides: Partial<RecordModel> = {}): RecordModel => ({
  id: 'abc123',
  collectionId: 'c1',
  collectionName: 'entries',
  owner: 'user1',
  kind: 'book',
  title: 'Dune',
  year: 1965,
  creator: 'Frank Herbert',
  description: '',
  poster: '',
  tags: ['sci-fi'],
  status: 'done',
  rating: 5,
  review: 'Great',
  finishedAt: '2026-09-02 09:00:00.000Z',
  created: '2026-09-01 10:00:00.000Z',
  updated: '2026-09-02 10:00:00.000Z',
  ...overrides,
});

/** A stand-in for the SDK client: one collection object with jest mocks. */
function fakeClient() {
  const collection = {
    getFullList: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    authWithPassword: jest.fn(),
    authRefresh: jest.fn(),
  };
  const authStore = { isValid: false, record: null, clear: jest.fn() };
  const client = {
    collection: jest.fn(() => collection),
    authStore,
    files: { getURL: jest.fn(() => '') },
  } as unknown as Client;
  return { client, collection, authStore };
}

const responseError = (status: number, data: unknown = {}) =>
  new ClientResponseError({ status, response: { data } });

describe('pocketbase mapping', () => {
  it('maps a record to an entry, treating empty values as unset', () => {
    const item = toItem(record({ year: 0, rating: 0, finishedAt: '' }));
    expect(item).toMatchObject({
      id: 'abc123',
      ownerId: 'user1',
      kind: 'book',
      title: 'Dune',
      creator: 'Frank Herbert',
      tags: ['sci-fi'],
      review: 'Great',
    });
    expect(item.year).toBeUndefined();
    expect(item.rating).toBeUndefined();
    expect(item.description).toBeUndefined();
    expect(item.finishedAt).toBeUndefined();
    expect(item.createdAt).toBe(dune.createdAt);
  });

  it('round-trips an entry through a record', () => {
    expect(toItem(record())).toEqual(dune);
    expect(toRecord(dune)).toEqual({
      owner: 'user1',
      kind: 'book',
      title: 'Dune',
      year: 1965,
      creator: 'Frank Herbert',
      description: '',
      poster: '',
      tags: ['sci-fi'],
      status: 'done',
      rating: 5,
      review: 'Great',
      startedAt: '',
      finishedAt: '2026-09-02T09:00:00.000Z',
    });
  });

  it('carries the start date both ways', () => {
    const started = Date.parse('2026-08-20T00:00:00.000Z');
    expect(
      toItem(record({ startedAt: '2026-08-20 00:00:00.000Z' })).startedAt,
    ).toBe(started);
    expect(toRecord({ ...dune, startedAt: started }).startedAt).toBe(
      '2026-08-20T00:00:00.000Z',
    );
  });
});

describe('pocketbase library store', () => {
  it('lists, creates, updates, and removes through the entries collection', async () => {
    const { client, collection } = fakeClient();
    collection.getFullList.mockResolvedValue([record()]);
    collection.create.mockResolvedValue(record({ id: 'server1' }));
    collection.update.mockResolvedValue(record({ title: 'Dune Messiah' }));
    collection.delete.mockResolvedValue(true);
    const store = createLibraryStore(client);

    expect(await store.list('user1')).toEqual([dune]);
    expect((await store.create(dune)).id).toBe('server1');
    expect(collection.create).toHaveBeenCalledWith(toRecord(dune));
    expect((await store.update(dune)).title).toBe('Dune Messiah');
    expect(collection.update).toHaveBeenCalledWith('abc123', toRecord(dune));
    await store.remove('abc123');
    expect(collection.delete).toHaveBeenCalledWith('abc123');
    expect(client.collection).toHaveBeenCalledWith('entries');
  });
});

describe('pocketbase auth backend', () => {
  const user = record({ id: 'u1', name: 'Ali', email: 'ali@example.com' });

  it('signs up then logs in, returning the user', async () => {
    const { client, collection } = fakeClient();
    collection.create.mockResolvedValue(user);
    collection.authWithPassword.mockResolvedValue({ record: user });
    const auth = createAuthBackend(client);

    const result = await auth.signup('Ali', 'ali@example.com', 'secret');
    expect(result).toMatchObject({
      id: 'u1',
      name: 'Ali',
      email: 'ali@example.com',
    });
    expect(collection.create).toHaveBeenCalledWith({
      name: 'Ali',
      email: 'ali@example.com',
      password: 'secret',
      passwordConfirm: 'secret',
    });
  });

  it('maps a duplicate email to errEmailExists', async () => {
    const { client, collection } = fakeClient();
    collection.create.mockRejectedValue(
      responseError(400, { email: { code: 'validation_not_unique' } }),
    );
    const auth = createAuthBackend(client);
    await expect(
      auth.signup('Ali', 'ali@example.com', 'secret'),
    ).rejects.toThrow(new AuthError('errEmailExists'));
  });

  it('maps a rejected login to errIncorrect and no connection to errNetwork', async () => {
    const { client, collection } = fakeClient();
    const auth = createAuthBackend(client);

    collection.authWithPassword.mockRejectedValue(responseError(400));
    await expect(auth.login('ali@example.com', 'wrong')).rejects.toThrow(
      new AuthError('errIncorrect'),
    );

    collection.authWithPassword.mockRejectedValue(responseError(0));
    await expect(auth.login('ali@example.com', 'secret')).rejects.toThrow(
      new AuthError('errNetwork'),
    );
  });

  it('restores nothing without a saved session and clears a rejected one', async () => {
    const { client, collection, authStore } = fakeClient();
    const auth = createAuthBackend(client);
    expect(await auth.restore()).toBeNull();

    authStore.isValid = true;
    (authStore as { record: unknown }).record = user;
    collection.authRefresh.mockRejectedValue(responseError(401));
    expect(await auth.restore()).toBeNull();
    expect(authStore.clear).toHaveBeenCalled();
  });

  it('keeps the cached session when the server is unreachable', async () => {
    const { client, collection, authStore } = fakeClient();
    authStore.isValid = true;
    (authStore as { record: unknown }).record = user;
    collection.authRefresh.mockRejectedValue(responseError(0));
    const auth = createAuthBackend(client);
    expect(await auth.restore()).toMatchObject({
      id: 'u1',
      name: 'Ali',
      email: 'ali@example.com',
    });
  });
});
