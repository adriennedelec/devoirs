import { hashPasswordForStorage } from './passwordHash';

export const DEFAULT_REMOTE_FAMILY_ID = 'famille-nedelec';

export type RemoteDatabaseSnapshot = {
  schemaVersion: number;
  app?: string;
  exportedAtIso?: string;
  mergePolicy?: string;
  tables: Array<{
    storageKey: string;
    label?: string;
    primaryKey: string;
    mode: string;
    records: Array<Record<string, unknown>>;
  }>;
};

export type RemoteFamilyDatabaseReadResult = {
  found: boolean;
  snapshot: RemoteDatabaseSnapshot | null;
  updatedAtIso?: string;
};

export type RemoteFamilyDatabaseWriteResult = {
  ok: boolean;
  updatedAtIso?: string;
};

export class RemoteFamilyDatabaseConflictError extends Error {
  updatedAtIso?: string;

  constructor(message: string, updatedAtIso?: string) {
    super(message);
    this.name = 'RemoteFamilyDatabaseConflictError';
    this.updatedAtIso = updatedAtIso;
  }
}

function sanitizeRemoteRecord(storageKey: string, record: Record<string, unknown>): Record<string, unknown> {
  if (storageKey !== 'devoirs.users.v1') return record;
  const { password, ...safeRecord } = record;
  if (typeof password === 'string' && password.length > 0 && typeof safeRecord.passwordHash !== 'string') {
    safeRecord.passwordHash = hashPasswordForStorage(password);
  }
  return safeRecord;
}

export function sanitizeRemoteDatabaseSnapshot(snapshot: RemoteDatabaseSnapshot): RemoteDatabaseSnapshot {
  return {
    ...snapshot,
    tables: snapshot.tables.map((table) => ({
      ...table,
      records: table.records.map((record) => sanitizeRemoteRecord(table.storageKey, record)),
    })),
  };
}

async function parseRemoteDatabaseResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof payload === 'object' && payload !== null && 'error' in payload && typeof payload.error === 'string'
      ? payload.error
      : 'Base distante indisponible.';
    const updatedAtIso = typeof payload === 'object' && payload !== null && 'updatedAtIso' in payload && typeof payload.updatedAtIso === 'string'
      ? payload.updatedAtIso
      : undefined;
    if (response.status === 409) throw new RemoteFamilyDatabaseConflictError(message, updatedAtIso);
    throw new Error(message);
  }
  return payload as T;
}

export async function fetchRemoteFamilyDatabase(familyId = DEFAULT_REMOTE_FAMILY_ID): Promise<RemoteFamilyDatabaseReadResult> {
  const response = await fetch(`/api/family-database?familyId=${encodeURIComponent(familyId)}`);
  return parseRemoteDatabaseResponse<RemoteFamilyDatabaseReadResult>(response);
}

export async function saveRemoteFamilyDatabase(
  snapshot: RemoteDatabaseSnapshot,
  familyId = DEFAULT_REMOTE_FAMILY_ID,
  baseUpdatedAtIso?: string,
): Promise<RemoteFamilyDatabaseWriteResult> {
  const response = await fetch('/api/family-database', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ familyId, snapshot: sanitizeRemoteDatabaseSnapshot(snapshot), baseUpdatedAtIso }),
  });
  return parseRemoteDatabaseResponse<RemoteFamilyDatabaseWriteResult>(response);
}
