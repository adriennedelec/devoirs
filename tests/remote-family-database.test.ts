import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchRemoteFamilyDatabase,
  saveRemoteFamilyDatabase,
  DEFAULT_REMOTE_FAMILY_ID,
  RemoteFamilyDatabaseConflictError,
} from '../src/services/remoteFamilyDatabase';

const snapshot = {
  schemaVersion: 1,
  app: 'devoirs',
  exportedAtIso: '2026-06-19T12:00:00.000Z',
  mergePolicy: 'primary-key-upsert-delete',
  tables: [],
};

describe('base distante famille Devoirs', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('lit le snapshot familial distant via l’API Vercel', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ found: true, snapshot, updatedAtIso: '2026-06-19T12:01:00.000Z' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchRemoteFamilyDatabase()).resolves.toEqual({
      found: true,
      snapshot,
      updatedAtIso: '2026-06-19T12:01:00.000Z',
    });
    expect(fetchMock).toHaveBeenCalledWith(`/api/family-database?familyId=${DEFAULT_REMOTE_FAMILY_ID}`);
  });

  it('sauvegarde le snapshot local dans la base distante', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true, updatedAtIso: '2026-06-19T12:02:00.000Z' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(saveRemoteFamilyDatabase(snapshot)).resolves.toEqual({ ok: true, updatedAtIso: '2026-06-19T12:02:00.000Z' });
    expect(fetchMock).toHaveBeenCalledWith('/api/family-database', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ familyId: DEFAULT_REMOTE_FAMILY_ID, snapshot, baseUpdatedAtIso: undefined }),
    });
  });

  it('transmet la version distante connue pour éviter d’écraser un snapshot concurrent', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true, updatedAtIso: '2026-06-19T12:03:00.000Z' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await saveRemoteFamilyDatabase(snapshot, DEFAULT_REMOTE_FAMILY_ID, '2026-06-19T12:02:00.000Z');

    const calls = fetchMock.mock.calls as unknown as Array<[RequestInfo | URL, RequestInit]>;
    const requestInit = calls[0]![1];
    expect(JSON.parse(requestInit.body as string)).toMatchObject({
      familyId: DEFAULT_REMOTE_FAMILY_ID,
      baseUpdatedAtIso: '2026-06-19T12:02:00.000Z',
    });
  });

  it('remonte un conflit de synchronisation avec la date distante courante', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      error: 'Conflit de synchronisation',
      code: 'remote_conflict',
      updatedAtIso: '2026-06-19T12:04:00.000Z',
    }), { status: 409 })));

    try {
      await saveRemoteFamilyDatabase(snapshot, DEFAULT_REMOTE_FAMILY_ID, '2026-06-19T12:02:00.000Z');
      throw new Error('Le conflit aurait dû être rejeté.');
    } catch (error) {
      expect(error).toBeInstanceOf(RemoteFamilyDatabaseConflictError);
      expect(error).toMatchObject({
        name: 'RemoteFamilyDatabaseConflictError',
        updatedAtIso: '2026-06-19T12:04:00.000Z',
      });
    }
  });

  it('ne transmet jamais les mots de passe utilisateurs en clair dans le snapshot distant', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const unsafeSnapshot = {
      ...snapshot,
      tables: [{
        storageKey: 'devoirs.users.v1',
        primaryKey: 'id',
        mode: 'upsert-delete',
        records: [{ id: 'user-1', login: 'parent', password: 'secret123', familyId: 'famille-nedelec' }],
      }],
    };

    await saveRemoteFamilyDatabase(unsafeSnapshot);

    const calls = fetchMock.mock.calls as unknown as Array<[RequestInfo | URL, RequestInit]>;
    const requestInit = calls[0]![1];
    const payload = JSON.parse(requestInit.body as string);
    expect(payload.snapshot.tables[0].records[0]).toEqual(expect.objectContaining({
      id: 'user-1',
      login: 'parent',
      passwordHash: 'sha256:fcf730b6d95236ecd3c9fc2d92d7b6b2bb061514961aec041d6c7a7192f592e4',
    }));
    expect(payload.snapshot.tables[0].records[0]).not.toHaveProperty('password');
  });

  it('remonte une erreur lisible quand l’API distante est indisponible', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'DATABASE_URL manquante' }), { status: 503 })));

    await expect(fetchRemoteFamilyDatabase()).rejects.toThrow('DATABASE_URL manquante');
  });
});
