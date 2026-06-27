import { createHash } from 'node:crypto';
import { sql } from '@vercel/postgres';
import { requireAdminSession } from './auth-utils.js';

const TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS devoirs_family_snapshots (
    family_id TEXT PRIMARY KEY,
    snapshot JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

function sendJson(response, status, payload) {
  response.status(status).json(payload);
}

function normalizeFamilyId(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : 'famille-nedelec';
}

function normalizeBaseUpdatedAtIso(value) {
  if (typeof value !== 'string' || value.trim().length === 0) return '';
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : '';
}

function toIso(value) {
  return new Date(value).toISOString();
}

function hashPasswordForStorage(password) {
  return `sha256:${createHash('sha256').update(password).digest('hex')}`;
}

function sanitizeSnapshotRecord(storageKey, record) {
  if (storageKey !== 'devoirs.users.v1' || !record || typeof record !== 'object' || Array.isArray(record)) return record;
  const { password, ...safeRecord } = record;
  if (typeof password === 'string' && password.length > 0 && typeof safeRecord.passwordHash !== 'string') {
    safeRecord.passwordHash = hashPasswordForStorage(password);
  }
  return safeRecord;
}

function sanitizeSnapshot(value) {
  if (!value || typeof value !== 'object' || !Array.isArray(value.tables)) {
    throw new Error('Snapshot Devoirs invalide : tables attendu.');
  }

  return {
    ...value,
    tables: value.tables.map((table) => ({
      ...table,
      records: Array.isArray(table.records)
        ? table.records.map((record) => sanitizeSnapshotRecord(table.storageKey, record))
        : [],
    })),
  };
}

async function ensureTable() {
  await sql.query(TABLE_SQL);
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');

  if (!requireAdminSession(request, response)) return;

  try {
    await ensureTable();

    if (request.method === 'GET') {
      const familyId = normalizeFamilyId(request.query?.familyId);
      const result = await sql`
        SELECT snapshot, updated_at
        FROM devoirs_family_snapshots
        WHERE family_id = ${familyId}
        LIMIT 1
      `;
      const row = result.rows[0];
      if (!row) return sendJson(response, 200, { found: false, snapshot: null });
      return sendJson(response, 200, {
        found: true,
        snapshot: row.snapshot,
        updatedAtIso: new Date(row.updated_at).toISOString(),
      });
    }

    if (request.method === 'PUT') {
      const familyId = normalizeFamilyId(request.body?.familyId);
      const snapshot = sanitizeSnapshot(request.body?.snapshot);
      const baseUpdatedAtIso = normalizeBaseUpdatedAtIso(request.body?.baseUpdatedAtIso);
      if (baseUpdatedAtIso) {
        const current = await sql`
          SELECT updated_at
          FROM devoirs_family_snapshots
          WHERE family_id = ${familyId}
          LIMIT 1
        `;
        const currentUpdatedAt = current.rows[0]?.updated_at;
        if (currentUpdatedAt && toIso(currentUpdatedAt) !== baseUpdatedAtIso) {
          return sendJson(response, 409, {
            error: 'Conflit de synchronisation : la base distante a changé depuis le dernier chargement.',
            code: 'remote_conflict',
            updatedAtIso: toIso(currentUpdatedAt),
          });
        }
      }
      const result = await sql`
        INSERT INTO devoirs_family_snapshots (family_id, snapshot, updated_at)
        VALUES (${familyId}, ${JSON.stringify(snapshot)}::jsonb, NOW())
        ON CONFLICT (family_id)
        DO UPDATE SET snapshot = EXCLUDED.snapshot, updated_at = NOW()
        RETURNING updated_at
      `;
      return sendJson(response, 200, {
        ok: true,
        updatedAtIso: new Date(result.rows[0].updated_at).toISOString(),
      });
    }

    response.setHeader('Allow', 'GET, PUT');
    return sendJson(response, 405, { error: 'Méthode non autorisée.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Base distante indisponible.';
    const status = message.includes('POSTGRES') || message.includes('DATABASE') || message.includes('No database') ? 503 : 400;
    return sendJson(response, status, { error: message });
  }
}
