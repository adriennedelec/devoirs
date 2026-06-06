import { describe, expect, it } from 'vitest';
import {
  getChildDashboard,
  getReadingSession,
  submitReadingAnswers,
  getMultiplicationSession,
  submitMultiplicationAnswer,
  submitDictationAnswer,
  getPoetrySession,
} from '../src/services/childService';

describe('Lots 5-11 child experience service contracts', () => {
  it('exposes a complete child cockpit, learning path and reward economy', async () => {
    const dashboard = await getChildDashboard('emma-demo');

    expect(dashboard.welcomeMessage).toMatch(/aujourd’hui/i);
    expect(dashboard.primaryMission.ctaLabel).toBe('Je commence ma mission');
    expect(dashboard.learningWorlds.map((world) => world.title)).toEqual([
      'Île des calculs',
      'Monde des mots',
      'Forêt des histoires',
      'Scène des poètes',
    ]);
    expect(dashboard.rewardShelf.some((reward) => reward.status === 'locked')).toBe(true);
    expect(dashboard.rewardHistory[0].description).toMatch(/3 étoiles/i);
  });

  it('serves a real reading comprehension module with scored answers', async () => {
    const session = await getReadingSession('emma-demo');

    expect(session.title).toBe('Le dragon qui aimait les livres');
    expect(session.questions).toHaveLength(3);
    expect(session.questions[0].options).toContain('Dans la bibliothèque');

    const result = await submitReadingAnswers('emma-demo', {
      sessionId: session.id,
      answers: [
        { questionId: 'reading-q1', selectedOptionId: 'library' },
        { questionId: 'reading-q2', selectedOptionId: 'book' },
        { questionId: 'reading-q3', selectedOptionId: 'kindness' },
      ],
    });

    expect(result.correctAnswers).toBe(3);
    expect(result.feedbackTitle).toBe('Bravo, tu as compris l’histoire !');
    expect(result.earnedStars).toBe(session.rewardStars);
  });

  it('runs multiplication as a five-question mini-session with final summary', async () => {
    const session = await getMultiplicationSession('emma-demo');

    expect(session.questions).toHaveLength(5);
    expect(session.totalQuestions).toBe(5);

    const finalQuestion = session.questions[4];
    const result = await submitMultiplicationAnswer('emma-demo', {
      questionId: finalQuestion.id,
      selectedAnswer: finalQuestion.leftFactor * finalQuestion.rightFactor,
    });

    expect(result.sessionProgress.currentIndex).toBe(5);
    expect(result.sessionProgress.totalQuestions).toBe(5);
    expect(result.sessionSummary?.title).toBe('Série terminée !');
  });

  it('makes every displayed multiplication table playable with its own generated series', async () => {
    const baseSession = await getMultiplicationSession('emma-demo');
    const availableTableValues = baseSession.availableTables.map((table) => table.value);

    await Promise.all(
      availableTableValues.map(async (tableValue) => {
        const session = await getMultiplicationSession('emma-demo', tableValue);
        expect(session.selectedTable).toBe(tableValue);
        expect(session.questions).toHaveLength(5);
        expect(session.questions.every((question) => question.table === tableValue)).toBe(true);
        expect(session.questions.every((question) => question.leftFactor === tableValue)).toBe(true);

        const firstQuestion = session.questions[0];
        const result = await submitMultiplicationAnswer('emma-demo', {
          questionId: firstQuestion.id,
          selectedAnswer: firstQuestion.leftFactor * firstQuestion.rightFactor,
        });

        expect(result.isCorrect).toBe(true);
        expect(result.feedbackMessage).toContain(`table de ${tableValue}`);
      }),
    );
  });

  it('returns pedagogical dictation word feedback instead of only a full correction', async () => {
    const result = await submitDictationAnswer('emma-demo', {
      sessionId: 'dictation-forest-1',
      answerText: 'Le petit renard traverse la foret',
    });

    expect(result.wordFeedback).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ expected: 'forêt.', status: 'accent_or_punctuation', hint: expect.stringMatching(/accent/i) }),
      ]),
    );
    expect(result.retryLabel).toBe('Réessayer doucement');
  });

  it('structures poetry as line-by-line memorisation practice', async () => {
    const session = await getPoetrySession('emma-demo');

    expect(session.practiceLines).toHaveLength(4);
    expect(session.practiceLines[0]).toMatchObject({ label: 'Ligne 1', status: 'known' });
    expect(session.memoryModes).toEqual(['Lire', 'Cacher des mots', 'Réciter']);
  });
});
