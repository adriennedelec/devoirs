import { describe, expect, it } from 'vitest';
import { getMultiplicationSession, submitMultiplicationAnswer } from '../src/services/childService';

describe('Lot 3 multiplication tables service', () => {
  it('returns an API-shaped table hub with progress and available tables', async () => {
    const session = await getMultiplicationSession('emma-demo');

    expect(session.childId).toBe('emma-demo');
    expect(session.availableTables.map((table) => table.value)).toContain(7);
    expect(session.availableTables.find((table) => table.value === 7)).toMatchObject({
      label: 'Table de 7',
      progressPercent: 45,
      status: 'in_progress',
    });
    expect(session.currentQuestion).toMatchObject({
    id: 'q-7-8',
    table: 7,
    leftFactor: 7,
    rightFactor: 8,
    prompt: '7 × 8 = ?',
    rewardStars: 1,
    });
    expect(session.currentQuestion.options).toHaveLength(4);
    expect(session.currentQuestion.options).toContain(56);
  });

  it('submits an answer through the mock API and returns corrective feedback', async () => {
    const correct = await submitMultiplicationAnswer('emma-demo', {
      questionId: 'q-7-8',
      selectedAnswer: 56,
    });

    expect(correct).toMatchObject({
      questionId: 'q-7-8',
      selectedAnswer: 56,
      correctAnswer: 56,
      isCorrect: true,
      earnedStars: 1,
      feedbackTitle: 'Bravo Emma !',
    });

    const retry = await submitMultiplicationAnswer('emma-demo', {
      questionId: 'q-7-8',
      selectedAnswer: 54,
    });

    expect(retry).toMatchObject({
      isCorrect: false,
      earnedStars: 0,
      feedbackTitle: 'Presque !',
      feedbackMessage: '7 × 8 = 56. On retente avec le hibou magique.',
    });
  });
});
