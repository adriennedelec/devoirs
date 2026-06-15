import type { CompletedMultiplicationTable, MultiplicationTableReviewFact } from '../types/multiplication';

const MULTIPLICATION_TABLE_HISTORY_STORAGE_KEY = 'devoirs.multiplicationTableHistory.v1';

function cryptoSafeId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `multiplication-history-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeMultiplicationHistoryFact(rawFact: unknown): MultiplicationTableReviewFact | null {
  if (typeof rawFact !== 'object' || rawFact === null) return null;
  const candidate = rawFact as Partial<MultiplicationTableReviewFact>;
  const rightFactor = Number(candidate.rightFactor);
  const line = typeof candidate.line === 'string' && candidate.line.trim().length > 0 ? candidate.line : '';
  const status = candidate.status === 'missed' ? 'missed' : 'mastered';

  if (!Number.isFinite(rightFactor) || rightFactor < 2 || rightFactor > 10 || !line) return null;

  return { rightFactor, line, status };
}

export function normalizeCompletedMultiplicationTable(rawRecord: unknown): CompletedMultiplicationTable | null {
  if (typeof rawRecord !== 'object' || rawRecord === null) return null;
  const candidate = rawRecord as Partial<CompletedMultiplicationTable>;
  const table = Number(candidate.table);
  const totalQuestions = Number(candidate.totalQuestions);
  const completedAtIso = typeof candidate.completedAtIso === 'string' && Number.isFinite(Date.parse(candidate.completedAtIso))
    ? candidate.completedAtIso
    : new Date().toISOString();
  const facts = Array.isArray(candidate.facts)
    ? candidate.facts.map(normalizeMultiplicationHistoryFact).filter((fact): fact is MultiplicationTableReviewFact => fact !== null)
    : [];

  if (!Number.isFinite(table) || table < 2 || table > 10) return null;

  return {
    id: typeof candidate.id === 'string' && candidate.id.length > 0 ? candidate.id : cryptoSafeId(),
    profileId: typeof candidate.profileId === 'string' && candidate.profileId.trim().length > 0 ? candidate.profileId.trim() : undefined,
    childName: typeof candidate.childName === 'string' && candidate.childName.trim().length > 0 ? candidate.childName.trim() : 'Élève',
    table,
    correctCount: Math.max(0, Number(candidate.correctCount) || 0),
    wrongCount: Math.max(0, Number(candidate.wrongCount) || 0),
    score: Math.max(0, Number(candidate.score) || 0),
    totalQuestions: Math.max(1, totalQuestions || facts.length || 9),
    durationSeconds: Math.max(0, Number(candidate.durationSeconds) || 0),
    completedAtIso,
    facts,
  };
}

export function readMultiplicationTableHistoryFromStorage(): CompletedMultiplicationTable[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = window.localStorage.getItem(MULTIPLICATION_TABLE_HISTORY_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(normalizeCompletedMultiplicationTable)
      .filter((record): record is CompletedMultiplicationTable => record !== null)
      .sort((left, right) => Date.parse(right.completedAtIso) - Date.parse(left.completedAtIso));
  } catch {
    return [];
  }
}

export function writeMultiplicationTableHistoryToStorage(history: CompletedMultiplicationTable[]) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(MULTIPLICATION_TABLE_HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Ignore local database write failures; the in-memory history still displays in this session.
  }
}
