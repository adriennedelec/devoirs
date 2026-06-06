import { describe, expect, it } from 'vitest';
import {
  getDictationSession,
  getPoetrySession,
  generateWordDictationText,
  submitDictationAnswer,
  submitPoetryRecital,
} from '../src/services/childService';

describe('Lot 4 dictation and poetry services', () => {
  it('returns an API-shaped dictation session with audio, prompt and reward contract', async () => {
    const session = await getDictationSession('emma-demo');

    expect(session).toMatchObject({
      childId: 'emma-demo',
      id: 'dictation-forest-1',
      title: 'Dictée de la forêt magique',
      instruction: 'Écoute la phrase puis écris-la dans ton cahier magique.',
      audioLabel: 'Écouter la phrase',
      expectedText: 'Le petit renard traverse la forêt.',
      rewardStars: 4,
    });
    expect(session.hints).toContain('La phrase commence par une majuscule.');
  });

  it('submits a dictation answer and returns benevolent correction feedback', async () => {
    const success = await submitDictationAnswer('emma-demo', {
      sessionId: 'dictation-forest-1',
      answerText: 'Le petit renard traverse la forêt.',
    });

    expect(success).toMatchObject({
      isCorrect: true,
      earnedStars: 4,
      feedbackTitle: 'Super dictée !',
    });

    const retry = await submitDictationAnswer('emma-demo', {
      sessionId: 'dictation-forest-1',
      answerText: 'Le petit renard traverse la foret',
    });

    expect(retry).toMatchObject({
      isCorrect: false,
      earnedStars: 0,
      feedbackTitle: 'Très proche !',
      correctedText: 'Le petit renard traverse la forêt.',
    });
  });

  it('generates a short hidden-ready word dictation text containing every requested word and selected verb tenses', async () => {
    const result = await generateWordDictationText('emma-demo', {
      words: ['dragon', 'cartable', 'rivière'],
      verbTenses: ['present', 'futur'],
    });

    expect(result.mode).toBe('word_dictation');
    expect(result.title).toBe('Dictée de mots préparée');
    expect(result.isHiddenByDefault).toBe(true);
    expect(result.wordChecklist).toEqual(['dragon', 'cartable', 'rivière']);
    expect(result.selectedVerbTenses).toEqual(['present', 'futur']);
    expect(result.text.length).toBeLessThanOrEqual(280);
    for (const word of ['dragon', 'cartable', 'rivière']) {
      expect(result.text.toLocaleLowerCase('fr-FR')).toContain(word);
    }
    expect(result.text).toMatch(/Aujourd’hui|Demain/);
  });

  it('returns a poetry session and validates a simulated recital', async () => {
    const session = await getPoetrySession('emma-demo');

    expect(session.title).toBe('Poésie des saisons');
    expect(session.steps.map((step) => step.label)).toEqual(['Écouter', 'Comprendre', 'Mémoriser', 'Réciter']);
    expect(session.lines).toContain('Le printemps réveille les jardins,');

    const result = await submitPoetryRecital('emma-demo', {
      poemId: 'poem-seasons-1',
      confidence: 'ready',
    });

    expect(result).toMatchObject({
      poemId: 'poem-seasons-1',
      status: 'completed',
      earnedStars: 6,
      feedbackTitle: 'Bravo, récitation validée !',
    });
  });
});
