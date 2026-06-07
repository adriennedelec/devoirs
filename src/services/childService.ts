import type { ChildDashboard } from '../types/api';
import type {
  DictationAnswerResult,
  DictationAnswerSubmission,
  DictationSession,
  DictationWordFeedback,
  WordDictationGenerationProvider,
  VerbTense,
  VerbTenseOption,
  WordDictationOcrRequest,
  WordDictationOcrResult,
  WordDictationTextRequest,
  WordDictationTextResult,
  PoetryRecitalResult,
  PoetryRecitalSubmission,
  PoetrySession,
} from '../types/language';
import type {
  MultiplicationAnswerResult,
  MultiplicationAnswerSubmission,
  MultiplicationSession,
} from '../types/multiplication';
import type { ReadingAnswerResult, ReadingAnswerSubmission, ReadingSession } from '../types/reading';
import { apiDelay, cloneApiPayload } from './apiClient';
import {
  childDashboardMock,
  dictationSessionMock,
  multiplicationSessionMock,
  poetrySessionMock,
  readingSessionMock,
} from './mockData';

function assertKnownChild(childId: string) {
  if (childId !== childDashboardMock.child.id) {
    throw new Error(`Aucune donnée trouvée pour l’enfant ${childId}`);
  }
}

export async function getChildDashboard(childId: string): Promise<ChildDashboard> {
  await apiDelay();
  assertKnownChild(childId);

  return cloneApiPayload(childDashboardMock);
}

const multiplicationPracticeFactors = [8, 6, 9, 4, 7, 2, 5, 3, 1, 10];

function getTableRewardStars(table: number) {
  return multiplicationSessionMock.availableTables.find((availableTable) => availableTable.value === table)?.rewardStars ?? 2;
}

function buildAnswerOptions(table: number, factor: number): number[] {
  const correctAnswer = table * factor;
  const options = new Set<number>([correctAnswer]);
  [correctAnswer - table, correctAnswer + table, correctAnswer - factor, correctAnswer + factor, correctAnswer + table + factor]
    .filter((option) => option > 0)
    .forEach((option) => options.add(option));

  let filler = correctAnswer + 1;
  while (options.size < 4) {
    options.add(filler);
    filler += 1;
  }

  return Array.from(options).slice(0, 4).sort((left, right) => left - right);
}

function buildMultiplicationQuestions(table: number) {
  const rewardStars = getTableRewardStars(table);

  return multiplicationPracticeFactors.map((factor) => ({
    id: `q-${table}-${factor}`,
    table,
    leftFactor: table,
    rightFactor: factor,
    prompt: `${table} × ${factor} = ?`,
    options: buildAnswerOptions(table, factor),
    rewardStars,
  }));
}

function buildMultiplicationSession(table?: number): MultiplicationSession {
  const session = cloneApiPayload(multiplicationSessionMock);
  const selectedTable = table && session.availableTables.some((availableTable) => availableTable.value === table)
    ? table
    : session.selectedTable;
  const questions = buildMultiplicationQuestions(selectedTable);

  return {
    ...session,
    selectedTable,
    currentQuestion: questions[0],
    questions,
    totalQuestions: questions.length,
  };
}

function findGeneratedMultiplicationQuestion(questionId: string) {
  const match = /^q-(\d+)-(\d+)$/.exec(questionId);
  if (!match) return null;

  const table = Number(match[1]);
  const factor = Number(match[2]);
  const questionIndex = multiplicationPracticeFactors.indexOf(factor);
  const question = buildMultiplicationQuestions(table).find((item) => item.id === questionId);

  return question && questionIndex >= 0 ? { question, questionIndex } : null;
}

export async function getMultiplicationSession(childId: string, table?: number): Promise<MultiplicationSession> {
  await apiDelay();
  assertKnownChild(childId);

  return buildMultiplicationSession(table);
}

export async function submitMultiplicationAnswer(
  childId: string,
  submission: MultiplicationAnswerSubmission,
): Promise<MultiplicationAnswerResult> {
  await apiDelay();
  assertKnownChild(childId);

  const generatedQuestion = findGeneratedMultiplicationQuestion(submission.questionId);
  if (!generatedQuestion) {
    throw new Error(`Question inconnue : ${submission.questionId}`);
  }

  const { question, questionIndex } = generatedQuestion;
  const sessionQuestions = buildMultiplicationQuestions(question.table);
  const correctAnswer = question.leftFactor * question.rightFactor;
  const isCorrect = submission.selectedAnswer === correctAnswer;
  const currentIndex = questionIndex + 1;
  const totalQuestions = sessionQuestions.length;
  const isFinalQuestion = currentIndex === totalQuestions;

  return {
    questionId: question.id,
    selectedAnswer: submission.selectedAnswer,
    correctAnswer,
    isCorrect,
    earnedStars: isCorrect ? question.rewardStars : 0,
    feedbackTitle: isCorrect ? 'Bravo Emma !' : 'Presque !',
    feedbackMessage: isCorrect
      ? `Tu gagnes ${question.rewardStars} étoiles. La table de ${question.table} brille un peu plus !`
      : `${question.leftFactor} × ${question.rightFactor} = ${correctAnswer}. On retente avec le hibou magique.`,
    sessionProgress: {
      currentIndex,
      totalQuestions,
    },
    sessionSummary: isFinalQuestion
      ? {
          title: 'Série terminée !',
          message: 'Tu as fini les 10 calculs. Regarde ton score et relis les calculs en rouge avant une nouvelle table.',
          earnedStars: sessionQuestions.reduce((total, item) => total + item.rewardStars, 0),
        }
      : undefined,
  };
}

function normalizeFrenchText(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('fr-FR');
}

function normalizeWithoutAccents(value: string) {
  return normalizeFrenchText(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[.,!?;:]/g, '');
}

function buildDictationWordFeedback(answerText: string): DictationWordFeedback[] {
  const expectedWords = dictationSessionMock.expectedText.split(' ');
  const actualWords = answerText.trim().split(/\s+/);

  return expectedWords.map((expected, index) => {
    const actual = actualWords[index] ?? '';
    if (!actual) {
      return { expected, actual, status: 'missing', hint: 'Mot à ajouter tranquillement.' };
    }
    if (normalizeFrenchText(actual) === normalizeFrenchText(expected)) {
      return { expected, actual, status: 'correct', hint: 'Mot juste.' };
    }
    if (normalizeWithoutAccents(actual) === normalizeWithoutAccents(expected)) {
      return { expected, actual, status: 'accent_or_punctuation', hint: 'Accent à ajouter ou ponctuation à vérifier.' };
    }
    return { expected, actual, status: 'different', hint: 'Observe ce mot puis réessaie doucement.' };
  });
}

export async function getDictationSession(childId: string): Promise<DictationSession> {
  await apiDelay();
  assertKnownChild(childId);

  return cloneApiPayload(dictationSessionMock);
}

export const dictationVerbTenseOptions: VerbTenseOption[] = [
  { value: 'present', label: 'Présent', helper: 'Aujourd’hui, je raconte ce qui se passe maintenant.' },
  { value: 'imparfait', label: 'Imparfait', helper: 'Avant, je décris une habitude ou un décor.' },
  { value: 'passe_compose', label: 'Passé composé', helper: 'Hier, je raconte une action terminée.' },
  { value: 'futur', label: 'Futur', helper: 'Demain, je prépare la suite.' },
];

let knownDictationWordsCache: Set<string> | null = null;

async function getKnownDictationWords() {
  if (knownDictationWordsCache === null) {
    const frenchDictionaryModule = await import('an-array-of-french-words');
    knownDictationWordsCache = new Set(
      frenchDictionaryModule.default.map((word) => word.toLocaleLowerCase('fr-FR')),
    );
  }

  return knownDictationWordsCache;
}

function normalizeDictionaryWord(word: string) {
  return word.trim().toLocaleLowerCase('fr-FR');
}

async function findUnknownDictationWords(words: string[], confirmedUnknownWords: string[] = []) {
  const knownDictationWords = await getKnownDictationWords();
  const confirmed = new Set(confirmedUnknownWords.map(normalizeDictionaryWord));
  return words.filter((word) => {
    const normalizedWord = normalizeDictionaryWord(word);
    return !knownDictationWords.has(normalizedWord) && !confirmed.has(normalizedWord);
  });
}

function splitWordsFromInput(text: string) {
  return text
    .replace(/[’']/g, ' ')
    .split(/[^\p{L}\p{M}]+/u)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2);
}

function cleanWordList(words: string[]) {
  const normalizedWords = words
    .flatMap(splitWordsFromInput)
    .map((word) => word.toLocaleLowerCase('fr-FR'));

  return normalizedWords
    .filter(Boolean)
    .filter((word, index, allWords) => allWords.findIndex((candidate) => candidate === word) === index);
}

function extractCandidateWordsFromText(text: string) {
  return cleanWordList([text]);
}

export async function extractWordDictationWordsFromOcr(
  childId: string,
  request: WordDictationOcrRequest,
): Promise<WordDictationOcrResult> {
  await apiDelay();
  assertKnownChild(childId);

  const words = extractCandidateWordsFromText(request.extractedText || request.fileName.replace(/\.[^.]+$/, ''));
  if (words.length === 0) {
    throw new Error('Aucun mot lisible détecté. Essaie une photo plus nette ou saisis les mots à la main.');
  }

  const unknownWords = await findUnknownDictationWords(words);
  const helperText = unknownWords.length > 0
    ? `${words.length} mots détectés par OCR. Mot à confirmer : ${unknownWords.join(', ')}.`
    : `${words.length} mots détectés par OCR. Vérifie la liste avant de générer la dictée.`;

  return {
    source: 'ocr',
    fileName: request.fileName,
    words,
    unknownWords,
    detectedText: request.extractedText,
    helperText,
  };
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countWordOccurrences(text: string, word: string) {
  const normalizedText = text.toLocaleLowerCase('fr-FR');
  const normalizedWord = normalizeDictionaryWord(word);
  const matches = normalizedText.match(new RegExp(`(^|[^\\p{L}\\p{M}])${escapeRegex(normalizedWord)}($|[^\\p{L}\\p{M}])`, 'giu'));
  return matches?.length ?? 0;
}

function getDictationGenerationErrors(text: string, words: string[]) {
  const errors: string[] = [];
  const cleanText = text.trim();
  if (!cleanText) errors.push('texte vide');
  if (cleanText.length > 320) errors.push('texte trop long');
  const sentenceCount = cleanText.split(/[.!?]+/).filter((sentence) => sentence.trim().length > 0).length;
  if (sentenceCount > 4) errors.push('plus de 4 phrases');

  for (const word of words) {
    const count = countWordOccurrences(cleanText, word);
    if (count === 0) errors.push(`mot absent : ${word}`);
    if (count > 1) errors.push(`mot répété : ${word}`);
  }

  if (/^```|```$/.test(cleanText) || /^\s*[{[]/.test(cleanText)) errors.push('réponse non textuelle');

  return errors;
}

function buildGenerationTerms(words: string[]) {
  const terms: string[] = [];
  for (let index = 0; index < words.length; index += 1) {
    const current = normalizeDictionaryWord(words[index]);
    const next = normalizeDictionaryWord(words[index + 1] ?? '');
    if (current === 'se' && next === 'coucher') {
      terms.push('se coucher');
      index += 1;
    } else {
      terms.push(words[index]);
    }
  }

  return terms;
}

function buildOllamaDictationPrompt(words: string[], verbTenses: VerbTense[], previousErrors: string[] = []) {
  const tenseLabels = verbTenses.length > 0 ? verbTenses.join(', ') : 'present';
  const generationTerms = buildGenerationTerms(words);
  const correctionBlock = previousErrors.length > 0
    ? `\nLe texte précédent était refusé pour ces raisons : ${previousErrors.join('; ')}. Corrige strictement ces points.`
    : '';

  return `Tu es professeur des écoles et tu écris une courte dictée en français pour un enfant de CE2.\n\nMots ou expressions obligatoires à copier exactement une seule fois :\n${generationTerms.map((word) => `- ${word}`).join('\n')}\n\nScène conseillée : un enfant range dans son cartable des images, dessins ou cartes représentant les noms, puis fait une action du soir.\n\nContraintes obligatoires :\n- Le texte final doit contenir tous les mots ou expressions obligatoires, sans synonyme.\n- Le texte doit être logique, naturel et scolaire.\n- Évite les listes mécaniques et les formules comme "le mot ...".\n- N'invente pas de rencontre absurde avec des objets inanimés.\n- Longueur : 2 ou 3 phrases courtes.\n- Temps dominant demandé : ${tenseLabels}.\n- Style : simple, bienveillant, adapté à 8 ans.\n- Réponds uniquement avec le texte de la dictée, sans guillemets, sans titre, sans explication.${correctionBlock}`;
}

function stripLlmEnvelope(text: string) {
  return text
    .trim()
    .replace(/^```(?:text|txt|fr|markdown)?/i, '')
    .replace(/```$/i, '')
    .replace(/^\s*["“”]|["“”]\s*$/g, '')
    .trim();
}

async function callOllamaDictation(words: string[], verbTenses: VerbTense[], previousErrors: string[] = []) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 90_000);
  try {
    const response = await fetch('/api/ollama/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.1:8b',
        prompt: buildOllamaDictationPrompt(words, verbTenses, previousErrors),
        stream: false,
        options: {
          temperature: 0.2,
          num_predict: 220,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Ollama a répondu ${response.status}. Vérifie que le modèle local est disponible.`);
    }

    const payload = await response.json() as { response?: string; error?: string };
    if (payload.error) throw new Error(payload.error);
    return stripLlmEnvelope(payload.response ?? '');
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Ollama met trop de temps à répondre. Réessaie quand le modèle local est disponible.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function generateOllamaWordDictationText(words: string[], verbTenses: VerbTense[]) {
  let previousErrors: string[] = [];
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const candidate = await callOllamaDictation(words, verbTenses, previousErrors);
    const errors = getDictationGenerationErrors(candidate, words);
    if (errors.length === 0) return candidate;
    previousErrors = errors;
  }

  throw new Error(`Ollama n’a pas encore produit un texte conforme : ${previousErrors.join(', ')}.`);
}

export async function generateWordDictationText(
  childId: string,
  request: WordDictationTextRequest,
): Promise<WordDictationTextResult> {
  await apiDelay();
  assertKnownChild(childId);

  const words = cleanWordList(request.words);
  if (words.length === 0) {
    throw new Error('Ajoute au moins un mot pour préparer la dictée.');
  }

  const selectedVerbTenses: VerbTense[] = request.verbTenses.length > 0 ? request.verbTenses : ['present'];
  const unknownWords = await findUnknownDictationWords(words, request.confirmedUnknownWords ?? []);
  if (unknownWords.length > 0) {
    throw new Error(`Confirme ces mots avant de générer : ${unknownWords.join(', ')}`);
  }

  const text = await generateOllamaWordDictationText(words, selectedVerbTenses);

  return {
    mode: 'word_dictation',
    title: 'Dictée IA locale préparée',
    text,
    isHiddenByDefault: true,
    wordChecklist: words,
    selectedVerbTenses,
    generationProvider: 'ollama',
    readingInstruction: 'Texte masqué par défaut : lance la lecture pour l’élève, puis affiche-le seulement côté parent si besoin.',
  };
}

export async function submitDictationAnswer(
  childId: string,
  submission: DictationAnswerSubmission,
): Promise<DictationAnswerResult> {
  await apiDelay();
  assertKnownChild(childId);

  if (submission.sessionId !== dictationSessionMock.id) {
    throw new Error(`Dictée inconnue : ${submission.sessionId}`);
  }

  const isCorrect = normalizeFrenchText(submission.answerText) === normalizeFrenchText(dictationSessionMock.expectedText);

  return {
    sessionId: dictationSessionMock.id,
    answerText: submission.answerText,
    correctedText: dictationSessionMock.expectedText,
    isCorrect,
    earnedStars: isCorrect ? dictationSessionMock.rewardStars : 0,
    feedbackTitle: isCorrect ? 'Super dictée !' : 'Très proche !',
    feedbackMessage: isCorrect
      ? `Tu gagnes ${dictationSessionMock.rewardStars} étoiles. Ta phrase est complète et bien ponctuée.`
      : 'Regarde les mots en couleur puis réessaie sans pression.',
    wordFeedback: buildDictationWordFeedback(submission.answerText),
    retryLabel: 'Réessayer doucement',
  };
}

export async function getPoetrySession(childId: string): Promise<PoetrySession> {
  await apiDelay();
  assertKnownChild(childId);

  return cloneApiPayload(poetrySessionMock);
}

export async function submitPoetryRecital(
  childId: string,
  submission: PoetryRecitalSubmission,
): Promise<PoetryRecitalResult> {
  await apiDelay();
  assertKnownChild(childId);

  if (submission.poemId !== poetrySessionMock.poemId) {
    throw new Error(`Poésie inconnue : ${submission.poemId}`);
  }

  const completed = submission.confidence === 'ready';

  return {
    poemId: poetrySessionMock.poemId,
    status: completed ? 'completed' : 'needs_practice',
    earnedStars: completed ? poetrySessionMock.rewardStars : 0,
    feedbackTitle: completed ? 'Bravo, récitation validée !' : 'Encore un petit entraînement',
    feedbackMessage: completed
      ? `Tu gagnes ${poetrySessionMock.rewardStars} étoiles. Ta récitation est claire et posée.`
      : 'Relis les deux dernières lignes, puis réessaie tranquillement.',
  };
}

export async function getReadingSession(childId: string): Promise<ReadingSession> {
  await apiDelay();
  assertKnownChild(childId);

  return cloneApiPayload(readingSessionMock);
}

export async function submitReadingAnswers(
  childId: string,
  submission: ReadingAnswerSubmission,
): Promise<ReadingAnswerResult> {
  await apiDelay();
  assertKnownChild(childId);

  if (submission.sessionId !== readingSessionMock.id) {
    throw new Error(`Lecture inconnue : ${submission.sessionId}`);
  }

  const correctAnswers = submission.answers.filter((answer) => {
    const question = readingSessionMock.questions.find((item) => item.id === answer.questionId);
    return question?.correctOptionId === answer.selectedOptionId;
  }).length;
  const totalQuestions = readingSessionMock.questions.length;
  const allCorrect = correctAnswers === totalQuestions;

  return {
    sessionId: readingSessionMock.id,
    correctAnswers,
    totalQuestions,
    earnedStars: allCorrect ? readingSessionMock.rewardStars : Math.max(1, correctAnswers * 2),
    feedbackTitle: allCorrect ? 'Bravo, tu as compris l’histoire !' : 'Tu as déjà repéré beaucoup d’indices !',
    feedbackMessage: allCorrect
      ? `Tu gagnes ${readingSessionMock.rewardStars} étoiles. Le dragon adore lire avec toi.`
      : `Tu as ${correctAnswers} bonne(s) réponse(s) sur ${totalQuestions}. Relis l’histoire puis réessaie.`,
  };
}
