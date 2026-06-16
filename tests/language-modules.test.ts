import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getDictationSession,
  getPoetryLibraryTexts,
  getPoetrySession,
  extractWordDictationWordsFromOcr,
  generateWordDictationText,
  getDefaultOllamaDictationPromptTemplate,
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

  it('keeps the default Ollama prompt as a placeholder template without output labels', () => {
    const prompt = getDefaultOllamaDictationPromptTemplate();

    expect(prompt).toContain('{{mots}}');
    expect(prompt).toContain('{{verbes}}');
    expect(prompt).toContain('{{temps}}');
    expect(prompt).not.toMatch(/TITRE\s*:\s*<|DICTEE\s*:\s*<|DICTÉE\s*:\s*</iu);
    expect(prompt).toMatch(/Réponds uniquement avec le texte final de la dictée/i);
    expect(prompt).toMatch(/cartes, dessins, images, étiquettes/i);
    expect(prompt).toMatch(/présent de l’indicatif/i);
    expect(prompt).toMatch(/Ne fais pas rencontrer un objet ou un aliment comme une personne/i);
  });

  it('generates a short well-written parent-visible text that uses every requested word exactly once', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({
      response: 'Aujourd’hui, Emma range dans son cartable des cartes avec dragon et rivière.',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    const result = await generateWordDictationText('emma-demo', {
      words: ['dragon', 'cartable', 'rivière'],
      verbTenses: ['present', 'futur'],
      confirmedUnknownWords: [],
    });

    expect(result.mode).toBe('word_dictation');
    expect(result.title).toBe('Dictée IA locale préparée');
    expect(result.generationProvider).toBe('ollama');
    expect(result.isHiddenByDefault).toBe(false);
    expect(result.readingInstruction).toMatch(/contrôles parent sous le texte/i);
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

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({
      response: 'Aujourd’hui, Emma range dans son cartable des cartes avec dragon, rivière et dragonnn.',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    const confirmedResult = await generateWordDictationText('emma-demo', {
      words: ['dragon cartable/rivière. dragonnn'],
      verbTenses: ['present'],
      confirmedUnknownWords: ['dragonnn'],
    });

    expect(confirmedResult.wordChecklist).toEqual(['dragon', 'cartable', 'rivière', 'dragonnn']);
  });

  it('accepts common French words from the full dictionary without parent confirmation', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({
      response: 'Aujourd’hui, Emma écrit bonjour dans son cahier, puis elle montre un chocolat à maman et papa.',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    const result = await generateWordDictationText('emma-demo', {
      words: ['bonjour maman papa chocolat cahier'],
      verbTenses: ['present'],
      confirmedUnknownWords: [],
    });

    expect(result.wordChecklist).toEqual(['bonjour', 'maman', 'papa', 'chocolat', 'cahier']);
  });

  it('generates an age-appropriate mini story instead of repeating word labels', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({
      response: 'Aujourd’hui, Emma range dans son cartable des cartes avec dragon, autruche, citrouille, banane et escargot. Avant de se coucher, elle pense à laver ses mains.',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

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

  it('passes a custom Llama prompt and interpolates MOTS/VERBES/TEMPS placeholders', async () => {
    const customPrompt = `Tu es un enseignant de français spécialisé dans la création de dictées pour les élèves de CM1 (9-10 ans).\n\nMOTS:\n{{mots}}\n\nVERBES:\n{{verbes}}\n\nTEMPS:\n{{temps}}`;
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({
      response: 'Aujourd’hui, Emma range un petit mot dragon dans son cartable.',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    await generateWordDictationText('emma-demo', {
      words: ['dragon', 'cartable'],
      verbTenses: ['present'],
      verbs: ['courir', 'manger'],
      generationProvider: 'ollama',
      prompt: customPrompt,
    });

    const request = fetchMock.mock.calls[0]?.[1];
    const body = request?.body ? JSON.parse(request.body as string) : {};
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/ollama/generate', expect.any(Object));
    expect(body.prompt).toContain('- dragon');
    expect(body.prompt).toContain('- cartable');
    expect(body.prompt).toContain('- courir');
    expect(body.prompt).toContain('- manger');
    expect(body.prompt).toContain('present');
  });

  it('uses the custom prompt word-count bounds to reject texts above 70 words', async () => {
    const longText = Array.from({ length: 85 }, (_, index) => {
      if (index === 4) return 'dragon';
      if (index === 14) return 'cartable';
      return `mot${index}`;
    }).join(' ');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.resolve(new Response(JSON.stringify({
      response: longText,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })));

    const result = await generateWordDictationText('emma-demo', {
      words: ['dragon', 'cartable'],
      verbTenses: ['present'],
      prompt: 'Crée une dictée entre 50 et 70 mots. MOTS: {{mots}} VERBES: {{verbes}} TEMPS: {{temps}}',
    });

    const request = fetchMock.mock.calls[0]?.[1];
    const body = request?.body ? JSON.parse(request.body as string) : {};
    expect(body.prompt).toContain('- dragon');
    expect(body.prompt).toContain('- cartable');
    expect(result.controlResult.isValid).toBe(false);
    expect(result.controlResult.checks).toContain('texte trop long : 85 mots (maximum 70)');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('rejects default Ollama generations above the normal 65-word maximum', async () => {
    const longText = Array.from({ length: 78 }, (_, index) => {
      if (index === 4) return 'dragon';
      if (index === 14) return 'cartable';
      return `mot${index}`;
    }).join(' ');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.resolve(new Response(JSON.stringify({
      response: longText,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })));

    const result = await generateWordDictationText('emma-demo', {
      words: ['dragon', 'cartable'],
      verbTenses: ['present'],
    });

    expect(result.controlResult.isValid).toBe(false);
    expect(result.controlResult.checks).toContain('texte trop long : 78 mots (maximum 65)');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('accepts noun and adjective agreement variants during generated text controls', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({
      response: 'Aujourd’hui, Emma colle des petits dragons sur son cartable.',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    const result = await generateWordDictationText('emma-demo', {
      words: ['dragon petit cartable'],
      verbTenses: ['present'],
      generationProvider: 'ollama',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.controlResult.isValid).toBe(true);
    expect(result.controlResult.checks).toEqual([]);
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

  it('retries Ollama when present tense generation contains obvious future or past markers', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({
        response: 'Demain, Emma mettra dans son cartable une image de dragon et elle a lavé ses mains.',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        response: 'Aujourd’hui, Emma range dans son cartable une image de dragon et elle lave ses mains.',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    const result = await generateWordDictationText('emma-demo', {
      words: ['cartable dragon'],
      verbs: ['laver'],
      verbTenses: ['present'],
      generationProvider: 'ollama',
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.controlResult.isValid).toBe(true);
    expect(result.text).toContain('lave');
    const firstRequest = fetchMock.mock.calls[0]?.[1];
    const secondRequest = fetchMock.mock.calls[1]?.[1];
    const firstPrompt = firstRequest?.body ? JSON.parse(firstRequest.body as string).prompt : '';
    const secondPrompt = secondRequest?.body ? JSON.parse(secondRequest.body as string).prompt : '';
    expect(firstPrompt).toContain('présent de l’indicatif UNIQUEMENT');
    expect(secondPrompt).toContain('temps incorrect');
  });

  it('returns generated text even after repeated invalid responses, with failed control checks', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockImplementation(() => Promise.resolve(new Response(JSON.stringify({
        response: 'Emma prépare une histoire très longue avec son cartable et un dragon, mais le texte oublie plusieurs images importantes et continue avec trop de détails inutiles pour une dictée courte du soir.'.repeat(3),
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })));

    const result = await generateWordDictationText('emma-demo', {
      words: ['cartable dragon autruche citrouille banane escargot se coucher laver'],
      verbTenses: ['present'],
      generationProvider: 'ollama',
    });

    expect(result.controlResult.isValid).toBe(false);
    expect(result.controlResult.checks.length).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalledTimes(3);
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

  it('returns the five main La Fontaine fables for poetry selection and accepts custom poem text', async () => {
    const library = await getPoetryLibraryTexts('emma-demo');

    expect(library.map((poem) => poem.title)).toEqual([
      'La Cigale et la Fourmi',
      'Le Corbeau et le Renard',
      'Le Loup et l’Agneau',
      'Le Lièvre et la Tortue',
      'La Grenouille qui veut se faire aussi grosse que le Bœuf',
    ]);
    expect(library[0].text).toContain('La Cigale, ayant chanté');

    const result = await submitPoetryRecital('emma-demo', {
      poemId: library[1].id,
      poemText: library[1].text,
      confidence: 'ready',
    });

    expect(result.poemId).toBe('le-corbeau-et-le-renard');
    expect(result.status).toBe('completed');
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
