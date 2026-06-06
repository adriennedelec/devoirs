import { describe, expect, it } from 'vitest';
import {
  getDictationSession,
  getPoetrySession,
  extractWordDictationWordsFromOcr,
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

  it('generates a short well-written hidden-ready text that uses every requested word exactly once', async () => {
    const result = await generateWordDictationText('emma-demo', {
      words: ['dragon', 'cartable', 'rivière'],
      verbTenses: ['present', 'futur'],
      confirmedUnknownWords: [],
    });

    expect(result.mode).toBe('word_dictation');
    expect(result.title).toBe('Dictée de mots préparée');
    expect(result.isHiddenByDefault).toBe(true);
    expect(result.wordChecklist).toEqual(['dragon', 'cartable', 'rivière']);
    expect(result.selectedVerbTenses).toEqual(['present', 'futur']);
    expect(result.text.length).toBeLessThanOrEqual(220);
    for (const word of ['dragon', 'cartable', 'rivière']) {
      const occurrences = result.text.toLocaleLowerCase('fr-FR').match(new RegExp(`\\b${word}\\b`, 'gu')) ?? [];
      expect(occurrences).toHaveLength(1);
    }
    expect(result.text).toMatch(/Aujourd’hui|Demain/);
    expect(result.text).toMatch(/[.!?]$/);
  });

  it('splits typed word series on any separator before checking the dictionary', async () => {
    await expect(generateWordDictationText('emma-demo', {
      words: ['dragon cartable/rivière. dragonnn'],
      verbTenses: ['present'],
      confirmedUnknownWords: [],
    })).rejects.toThrow(/Confirme ces mots avant de générer : dragonnn/);

    const confirmedResult = await generateWordDictationText('emma-demo', {
      words: ['dragon cartable/rivière. dragonnn'],
      verbTenses: ['present'],
      confirmedUnknownWords: ['dragonnn'],
    });

    expect(confirmedResult.wordChecklist).toEqual(['dragon', 'cartable', 'rivière', 'dragonnn']);
  });

  it('extracts OCR words from an imported document or photo payload for word dictation', async () => {
    const result = await extractWordDictationWordsFromOcr('emma-demo', {
      fileName: 'liste-mots-photo.jpg',
      mimeType: 'image/jpeg',
      extractedText: 'Dragon\ncartable, rivière ! dragon',
    });

    expect(result.source).toBe('ocr');
    expect(result.words).toEqual(['dragon', 'cartable', 'rivière']);
    expect(result.unknownWords).toEqual([]);
    expect(result.detectedText).toContain('Dragon');
    expect(result.helperText).toMatch(/mots détectés/i);
  });

  it('flags unknown OCR words so the parent can confirm them before generation', async () => {
    const result = await extractWordDictationWordsFromOcr('emma-demo', {
      fileName: 'photo-mots.jpg',
      mimeType: 'image/jpeg',
      extractedText: 'dragon dragonnn cartable',
    });

    expect(result.words).toEqual(['dragon', 'dragonnn', 'cartable']);
    expect(result.unknownWords).toEqual(['dragonnn']);
    expect(result.helperText).toMatch(/à confirmer/i);
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
