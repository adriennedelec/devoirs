import { afterEach, describe, expect, it, vi } from 'vitest';
import { getMultiplicationSession, submitMultiplicationAnswer } from '../src/services/childService';

describe('Lot 3 multiplication tables service', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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
    expect(session.questions.map((question) => question.rightFactor)).toEqual([8, 6, 9, 4, 7, 2, 5, 3, 10]);
    expect(session.questions.map((question) => question.rightFactor)).not.toContain(1);
  });

  it('mixes the correct answer position across generated QCM options', async () => {
    const randomValues = [0.02, 0.84, 0.55, 0.29, 0.99, 0.11, 0.67, 0.43, 0.76];
    let randomIndex = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => randomValues[randomIndex++ % randomValues.length]);

    const session = await getMultiplicationSession('emma-demo', 7);

    const correctAnswerIndexes = session.questions.map((question) => question.options.indexOf(question.leftFactor * question.rightFactor));

    expect(correctAnswerIndexes).toEqual([0, 3, 2, 1, 3, 0, 2, 1, 3]);
  });

  it('does not force correct answers to rotate through top-left, top-right, bottom-left, bottom-right', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01);

    const session = await getMultiplicationSession('emma-demo', 7);

    const correctAnswerIndexes = session.questions.map((question) => question.options.indexOf(question.leftFactor * question.rightFactor));

    expect(correctAnswerIndexes).toEqual(Array(session.questions.length).fill(0));
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
