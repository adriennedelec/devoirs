import type { ActivityRecord, StoredActivityModule, StoredActivityStatus } from '../types/activity';
import type { MultiplicationTableReviewFact } from '../types/multiplication';

const ACTIVITY_DATABASE_STORAGE_KEY = 'devoirs.activityRecords.v1';

type MultiplicationActivityRecordInput = {
  profileId: string;
  profileName: string;
  table: number;
  score: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  durationSeconds: number;
  startedAtIso: string;
  completedAtIso: string;
  facts: MultiplicationTableReviewFact[];
  starsEarned: number;
};

type LearningActivityRecordInput = {
  profileId: string;
  profileName: string;
  module: Exclude<StoredActivityModule, 'multiplication'>;
  moduleLabel: string;
  exerciseLabel: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  starsEarned: number;
  status?: ActivityRecord['status'];
  details?: ActivityRecord['details'];
  durationSeconds?: number;
  startedAtIso?: string;
  completedAtIso?: string;
};

function cryptoSafeId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function normalizePositiveNumber(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? Math.max(0, numberValue) : fallback;
}

function normalizeStoredActivityModule(value: unknown): StoredActivityModule | null {
  return value === 'multiplication' || value === 'dictation' || value === 'poetry' || value === 'reading' ? value : null;
}

function normalizeStoredActivityStatus(value: unknown): StoredActivityStatus {
  if (value === 'partial' || value === 'abandoned') return value;
  return 'completed';
}

export function normalizeActivityRecord(rawRecord: unknown): ActivityRecord | null {
  if (typeof rawRecord !== 'object' || rawRecord === null) return null;

  const candidate = rawRecord as Partial<ActivityRecord>;
  const module = normalizeStoredActivityModule(candidate.module);
  if (!module) return null;

  const completedAtIso = isIsoDate(candidate.completedAtIso) ? candidate.completedAtIso : new Date().toISOString();
  const startedAtIso = isIsoDate(candidate.startedAtIso) ? candidate.startedAtIso : completedAtIso;
  const details = typeof candidate.details === 'object' && candidate.details !== null ? candidate.details : {};

  return {
    id: typeof candidate.id === 'string' && candidate.id.trim().length > 0 ? candidate.id : cryptoSafeId(`activity-${module}`),
    profileId: typeof candidate.profileId === 'string' && candidate.profileId.trim().length > 0 ? candidate.profileId : 'unknown-profile',
    profileName: typeof candidate.profileName === 'string' && candidate.profileName.trim().length > 0 ? candidate.profileName.trim() : 'Élève',
    module,
    moduleLabel: typeof candidate.moduleLabel === 'string' && candidate.moduleLabel.trim().length > 0 ? candidate.moduleLabel.trim() : module,
    exerciseLabel: typeof candidate.exerciseLabel === 'string' && candidate.exerciseLabel.trim().length > 0 ? candidate.exerciseLabel.trim() : 'Exercice',
    startedAtIso,
    completedAtIso,
    durationSeconds: normalizePositiveNumber(candidate.durationSeconds),
    status: normalizeStoredActivityStatus(candidate.status),
    score: normalizePositiveNumber(candidate.score),
    totalQuestions: Math.max(1, normalizePositiveNumber(candidate.totalQuestions, 1)),
    correctCount: normalizePositiveNumber(candidate.correctCount),
    wrongCount: normalizePositiveNumber(candidate.wrongCount),
    starsEarned: normalizePositiveNumber(candidate.starsEarned),
    details,
  };
}

export function readActivityRecordsFromStorage(): ActivityRecord[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = window.localStorage.getItem(ACTIVITY_DATABASE_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(normalizeActivityRecord)
      .filter((record): record is ActivityRecord => record !== null)
      .sort((left, right) => Date.parse(right.completedAtIso) - Date.parse(left.completedAtIso));
  } catch {
    return [];
  }
}

export function writeActivityRecordsToStorage(records: ActivityRecord[]) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(ACTIVITY_DATABASE_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Ignore local database write failures; the UI can still keep in-memory state.
  }
}

export function appendActivityRecordToStorage(record: ActivityRecord) {
  const nextRecords = [record, ...readActivityRecordsFromStorage()];
  writeActivityRecordsToStorage(nextRecords);
  return nextRecords;
}

export function buildMultiplicationActivityRecord(input: MultiplicationActivityRecordInput): ActivityRecord {
  return {
    id: cryptoSafeId(`activity-multiplication-${input.table}`),
    profileId: input.profileId,
    profileName: input.profileName,
    module: 'multiplication',
    moduleLabel: 'Multiplication',
    exerciseLabel: `Table de ${input.table}`,
    startedAtIso: input.startedAtIso,
    completedAtIso: input.completedAtIso,
    durationSeconds: input.durationSeconds,
    status: 'completed',
    score: input.score,
    totalQuestions: input.totalQuestions,
    correctCount: input.correctCount,
    wrongCount: input.wrongCount,
    starsEarned: input.starsEarned,
    details: {
      table: input.table,
      facts: input.facts,
    },
  };
}

export function buildLearningActivityRecord(input: LearningActivityRecordInput): ActivityRecord {
  const completedAtIso = input.completedAtIso ?? new Date().toISOString();
  return {
    id: cryptoSafeId(`activity-${input.module}`),
    profileId: input.profileId,
    profileName: input.profileName,
    module: input.module,
    moduleLabel: input.moduleLabel,
    exerciseLabel: input.exerciseLabel,
    startedAtIso: input.startedAtIso ?? completedAtIso,
    completedAtIso,
    durationSeconds: input.durationSeconds ?? 0,
    status: input.status ?? 'completed',
    score: input.score,
    totalQuestions: Math.max(1, input.totalQuestions),
    correctCount: input.correctCount,
    wrongCount: input.wrongCount,
    starsEarned: input.starsEarned,
    details: input.details ?? {},
  };
}
