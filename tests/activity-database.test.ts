import { beforeEach, describe, expect, it } from 'vitest';
import {
  appendActivityRecordToStorage,
  buildMultiplicationActivityRecord,
  readActivityRecordsFromStorage,
  writeActivityRecordsToStorage,
} from '../src/services/activityDatabase';
import type { MultiplicationTableReviewFact } from '../src/types/multiplication';

const multiplicationFacts: MultiplicationTableReviewFact[] = [
  { rightFactor: 2, line: '2 × 7 = 14', status: 'mastered' },
  { rightFactor: 3, line: '3 × 7 = 21', status: 'mastered' },
  { rightFactor: 4, line: '4 × 7 = 28', status: 'missed' },
];

describe('base de données locale des activités', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('normalise et trie les activités stockées pour tous les profils', () => {
    writeActivityRecordsToStorage([
      {
        id: 'old-reading',
        profileId: 'emma-demo',
        profileName: 'Emma',
        module: 'reading',
        moduleLabel: 'Lecture',
        exerciseLabel: 'Lecture du renard',
        startedAtIso: '2026-06-10T08:00:00.000Z',
        completedAtIso: '2026-06-10T08:05:00.000Z',
        durationSeconds: 300,
        status: 'completed',
        score: 4,
        totalQuestions: 5,
        correctCount: 4,
        wrongCount: 1,
        starsEarned: 2,
        details: { textId: 'renard' },
      },
      {
        id: 'new-table',
        profileId: 'louane-demo',
        profileName: 'Louane',
        module: 'multiplication',
        moduleLabel: 'Tables',
        exerciseLabel: 'Table de 7',
        startedAtIso: '2026-06-11T08:00:00.000Z',
        completedAtIso: '2026-06-11T08:02:00.000Z',
        durationSeconds: 120,
        status: 'completed',
        score: 9,
        totalQuestions: 9,
        correctCount: 9,
        wrongCount: 0,
        starsEarned: 9,
        details: { table: 7, facts: multiplicationFacts },
      },
    ]);

    const records = readActivityRecordsFromStorage();

    expect(records.map((record) => record.id)).toEqual(['new-table', 'old-reading']);
    expect(records[0]).toMatchObject({
      profileId: 'louane-demo',
      module: 'multiplication',
      exerciseLabel: 'Table de 7',
      durationSeconds: 120,
      starsEarned: 9,
    });
    expect(records[0].details).toMatchObject({ table: 7, facts: multiplicationFacts });
  });

  it('ajoute une activité sans supprimer les activités déjà présentes', () => {
    writeActivityRecordsToStorage([
      {
        id: 'existing',
        profileId: 'emma-demo',
        profileName: 'Emma',
        module: 'dictation',
        moduleLabel: 'Dictée',
        exerciseLabel: 'Dictée des mots doux',
        startedAtIso: '2026-06-10T08:00:00.000Z',
        completedAtIso: '2026-06-10T08:04:00.000Z',
        durationSeconds: 240,
        status: 'completed',
        score: 8,
        totalQuestions: 10,
        correctCount: 8,
        wrongCount: 2,
        starsEarned: 3,
        details: { mode: 'word-dictation' },
      },
    ]);

    appendActivityRecordToStorage({
      id: 'added',
      profileId: 'louane-demo',
      profileName: 'Louane',
      module: 'poetry',
      moduleLabel: 'Poésie',
      exerciseLabel: 'Récitation courte',
      startedAtIso: '2026-06-11T09:00:00.000Z',
      completedAtIso: '2026-06-11T09:03:00.000Z',
      durationSeconds: 180,
      status: 'completed',
      score: 1,
      totalQuestions: 1,
      correctCount: 1,
      wrongCount: 0,
      starsEarned: 4,
      details: { poemId: 'demo' },
    });

    expect(readActivityRecordsFromStorage().map((record) => record.id)).toEqual(['added', 'existing']);
  });

  it('construit une activité de table terminée avec durée, score, étoiles et détail des faits', () => {
    const record = buildMultiplicationActivityRecord({
      profileId: 'emma-demo',
      profileName: 'Emma',
      table: 7,
      score: 8,
      totalQuestions: 9,
      correctCount: 8,
      wrongCount: 1,
      durationSeconds: 95,
      startedAtIso: '2026-06-11T08:00:00.000Z',
      completedAtIso: '2026-06-11T08:01:35.000Z',
      facts: multiplicationFacts,
      starsEarned: 8,
    });

    expect(record).toMatchObject({
      profileId: 'emma-demo',
      profileName: 'Emma',
      module: 'multiplication',
      moduleLabel: 'Multiplication',
      exerciseLabel: 'Table de 7',
      startedAtIso: '2026-06-11T08:00:00.000Z',
      completedAtIso: '2026-06-11T08:01:35.000Z',
      durationSeconds: 95,
      status: 'completed',
      score: 8,
      totalQuestions: 9,
      correctCount: 8,
      wrongCount: 1,
      starsEarned: 8,
      details: { table: 7, facts: multiplicationFacts },
    });
    expect(record.id).toMatch(/^activity-multiplication-7-/);
  });
});
