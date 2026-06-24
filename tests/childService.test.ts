import { describe, expect, it } from 'vitest';
import {
  buildGeneratedReadingSession,
  evaluateReadingAnswers,
  getChildDashboard,
} from '../src/services/childService';

describe('child dashboard service contract', () => {
  it('returns an API-shaped dashboard payload without exposing shared mutable fixtures', async () => {
    const first = await getChildDashboard('emma-demo');
    const second = await getChildDashboard('emma-demo');

    expect(first.child.firstName).toBe('Emma');
    expect(first.dailyGoal.targetCount).toBeGreaterThan(0);
    expect(first.activities.length).toBeGreaterThanOrEqual(4);
    expect(first.activities.every((activity) => activity.route.startsWith('/'))).toBe(true);
    expect(first).not.toBe(second);
    expect(first.activities).not.toBe(second.activities);
  });
});

describe('generated reading comprehension contract', () => {
  it('builds comprehension questions from the generated story context instead of the static dragon demo', () => {
    const session = buildGeneratedReadingSession({
      childId: 'emma-demo',
      storyText: 'Lina entre dans la forêt avec un renard. Elle trouve une clé dorée sous une pierre lumineuse.',
      fields: {
        character: 'Lina',
        animal: 'renard',
        object: 'clé dorée',
        place: 'forêt',
      },
    });

    expect(session.id).toMatch(/^generated-reading-/);
    expect(session.title).toBe('Histoire générée par IA');
    expect(session.text).toEqual([
      'Lina entre dans la forêt avec un renard.',
      'Elle trouve une clé dorée sous une pierre lumineuse.',
    ]);
    expect(session.questions).toHaveLength(3);
    expect(session.questions.map((question) => question.prompt).join(' ')).not.toMatch(/dragon|bibliothèque|Emma prête/iu);
    expect(session.questions[0]).toMatchObject({
      prompt: 'Quel personnage suit-on dans cette histoire ?',
      correctOptionId: 'character',
    });
    expect(session.questions[0].options).toContain('Lina');
    expect(session.questions[1].options).toContain('renard');
    expect(session.questions[2].options).toContain('clé dorée');
  });

  it('validates answers against the generated reading session questions', () => {
    const session = buildGeneratedReadingSession({
      childId: 'emma-demo',
      storyText: 'Noé visite une station lunaire. Un panda ninja protège une boussole magique.',
      fields: {
        character: 'Noé',
        animal: 'panda ninja',
        object: 'boussole magique',
        place: 'station lunaire',
      },
    });

    const result = evaluateReadingAnswers(session, {
      sessionId: session.id,
      answers: session.questions.map((question) => ({
        questionId: question.id,
        selectedOptionId: question.correctOptionId,
      })),
    });

    expect(result).toMatchObject({
      sessionId: session.id,
      correctAnswers: 3,
      totalQuestions: 3,
      earnedStars: 8,
      feedbackTitle: 'Bravo, tu as compris l’histoire !',
    });
    expect(result.feedbackMessage).toMatch(/histoire que tu viens de lire/i);
  });
});
