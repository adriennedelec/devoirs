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

async function parseRemoteDatabaseResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof payload === 'object' && payload !== null && 'error' in payload && typeof payload.error === 'string'
      ? payload.error
      : 'Base distante indisponible.';
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
): Promise<RemoteFamilyDatabaseWriteResult> {
  const response = await fetch('/api/family-database', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ familyId, snapshot }),
  });
  return parseRemoteDatabaseResponse<RemoteFamilyDatabaseWriteResult>(response);
}
