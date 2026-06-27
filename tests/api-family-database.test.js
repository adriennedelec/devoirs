import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@vercel/postgres', () => ({
  sql: Object.assign(
    vi.fn(async () => ({ rows: [] })),
    { query: vi.fn(async () => ({ rows: [] })) },
  ),
}));

vi.mock('../api/auth-utils.js', () => ({
  requireAdminSession: vi.fn(() => ({ username: 'admin', role: 'admin' })),
}));

const { sql } = await import('@vercel/postgres');
const { default: handler } = await import('../api/family-database.js');

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe('api/family-database conflict guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sql.mockResolvedValue({ rows: [] });
    sql.query.mockResolvedValue({ rows: [] });
  });

  it('rejects stale writes when the remote snapshot changed since client load', async () => {
    sql.mockResolvedValueOnce({ rows: [{ updated_at: new Date('2026-06-19T12:04:00.000Z') }] });
    const response = createResponse();

    await handler({
      method: 'PUT',
      body: {
        familyId: 'famille-nedelec',
        baseUpdatedAtIso: '2026-06-19T12:02:00.000Z',
        snapshot: { schemaVersion: 1, tables: [] },
      },
      headers: {},
    }, response);

    expect(response.statusCode).toBe(409);
    expect(response.body).toMatchObject({
      code: 'remote_conflict',
      updatedAtIso: '2026-06-19T12:04:00.000Z',
    });
  });

  it('allows writes when the client base matches the remote updated timestamp', async () => {
    sql
      .mockResolvedValueOnce({ rows: [{ updated_at: new Date('2026-06-19T12:02:00.000Z') }] })
      .mockResolvedValueOnce({ rows: [{ updated_at: new Date('2026-06-19T12:05:00.000Z') }] });
    const response = createResponse();

    await handler({
      method: 'PUT',
      body: {
        familyId: 'famille-nedelec',
        baseUpdatedAtIso: '2026-06-19T12:02:00.000Z',
        snapshot: { schemaVersion: 1, tables: [] },
      },
      headers: {},
    }, response);

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({ ok: true, updatedAtIso: '2026-06-19T12:05:00.000Z' });
  });
});
