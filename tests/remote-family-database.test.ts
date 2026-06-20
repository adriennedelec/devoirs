import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchRemoteFamilyDatabase,
  saveRemoteFamilyDatabase,
  DEFAULT_REMOTE_FAMILY_ID,
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
      body: JSON.stringify({ familyId: DEFAULT_REMOTE_FAMILY_ID, snapshot }),
    });
  });

  it('remonte une erreur lisible quand l’API distante est indisponible', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'DATABASE_URL manquante' }), { status: 503 })));

    await expect(fetchRemoteFamilyDatabase()).rejects.toThrow('DATABASE_URL manquante');
  });
});
