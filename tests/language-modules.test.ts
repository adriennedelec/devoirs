import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getDictationSession,
  getPoetrySession,
  extractWordDictationWordsFromOcr,
  generateWordDictationText,
  submitDictationAnswer,
  submitPoetryRecital,
} from '../src/services/childService';

describe('Lot 4 dictation and poetry services', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  it('accepts common French words from the full dictionary without parent confirmation', async () => {
    const result = await generateWordDictationText('emma-demo', {
      words: ['bonjour maman papa chocolat cahier'],
      verbTenses: ['present'],
      confirmedUnknownWords: [],
    });

    expect(result.wordChecklist).toEqual(['bonjour', 'maman', 'papa', 'chocolat', 'cahier']);
  });

  it('generates an age-appropriate mini story instead of repeating word labels', async () => {
    const requestedWords = ['cartable', 'dragon', 'autruche', 'citrouille', 'banane', 'escargot', 'se', 'coucher', 'laver'];
    const result = await generateWordDictationText('emma-demo', {
      words: requestedWords,
      verbTenses: ['present'],
      confirmedUnknownWords: [],
    });

    expect(result.text).not.toMatch(/mot\s+(cartable|dragon|autruche|citrouille|banane|escargot|se|coucher|laver)/iu);
    expect(result.text).not.toMatch(/utilise aussi|écrit aussi|mot\s+\w+/iu);
    expect(result.text).not.toMatch(/rencontre\s+citrouille|rencontre\s+[^.]*banane|rencontre\s+[^.]*escargot/iu);
    expect(result.text).toMatch(/cartable[^.]+(carte|image|dessin|étiquette)/iu);
    expect(result.text).toMatch(/dragon[^.]+autruche[^.]+citrouille[^.]+banane[^.]+escargot/iu);
    expect(result.text).toMatch(/se coucher[^.]+laver/i);
    expect(result.text.split(/[.!?]+/).filter((sentence) => sentence.trim().length > 0).length).toBeLessThanOrEqual(3);
    expect(result.text.length).toBeLessThanOrEqual(260);
    for (const word of requestedWords) {
      const occurrences = result.text.toLocaleLowerCase('fr-FR').match(new RegExp(`\\b${word}\\b`, 'gu')) ?? [];
      expect(occurrences).toHaveLength(1);
    }
  });

  it('calls the local Ollama provider and returns the validated coherent text', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({
      response: 'Dans son cartable, Emma garde un dessin de dragon, une image d’autruche et une petite citrouille en papier. Au goûter, elle mange une banane puis regarde un escargot avancer dans le jardin. Avant de se coucher, elle va laver ses mains.',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    const result = await generateWordDictationText('emma-demo', {
      words: ['cartable dragon autruche citrouille banane escargot se coucher laver'],
      verbTenses: ['present'],
      confirmedUnknownWords: [],
      generationProvider: 'ollama',
    });

    expect(fetch).toHaveBeenCalledWith('/api/ollama/generate', expect.objectContaining({ method: 'POST' }));
    expect(result.generationProvider).toBe('ollama');
    expect(result.text).toContain('Dans son cartable');
    expect(result.text).toContain('Avant de se coucher');
  });

  it('retries Ollama when a generated text misses a requested word', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({
        response: 'Emma range un dragon dans son cartable.',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        response: 'Dans son cartable, Emma dessine un dragon près de la rivière.',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    const result = await generateWordDictationText('emma-demo', {
      words: ['dragon cartable rivière'],
      verbTenses: ['present'],
      generationProvider: 'ollama',
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.text).toContain('rivière');
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
