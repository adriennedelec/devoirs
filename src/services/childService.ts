import type { ChildDashboard } from '../types/api';
import type {
  DictationAnswerResult,
  DictationAnswerSubmission,
  DictationSession,
  DictationWordFeedback,
  WordDictationGenerationProvider,
  VerbTense,
  VerbTenseOption,
  WordDictationTextLength,
  WordDictationOcrRequest,
  WordDictationOcrResult,
  WordDictationTextRequest,
  WordDictationTextResult,
  PoetryLineRecitalFeedback,
  PoetryRecitalResult,
  PoetryLibraryText,
  PoetryRecitalSubmission,
  PoetrySession,
} from '../types/language';
import type {
  MultiplicationAnswerResult,
  MultiplicationAnswerSubmission,
  MultiplicationSession,
} from '../types/multiplication';
import type { ReadingAnswerResult, ReadingAnswerSubmission, ReadingQuestion, ReadingSession } from '../types/reading';
import { apiDelay, cloneApiPayload } from './apiClient';
import {
  childDashboardMock,
  dictationSessionMock,
  multiplicationSessionMock,
  poetryLibraryTexts,
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

const multiplicationPracticeFactors = [8, 6, 9, 4, 7, 2, 5, 3, 10];

function getTableRewardStars(table: number) {
  return multiplicationSessionMock.availableTables.find((availableTable) => availableTable.value === table)?.rewardStars ?? 2;
}

function getSeededOptionRank(option: number, table: number, factor: number) {
  const seed = option * 97 + table * 31 + factor * 17;
  const mixed = Math.sin(seed) * 10000;
  return mixed - Math.floor(mixed);
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

  const distractors = Array.from(options)
    .filter((option) => option !== correctAnswer)
    .slice(0, 3)
    .sort((left, right) => getSeededOptionRank(left, table, factor) - getSeededOptionRank(right, table, factor));
  const correctIndex = Math.floor(Math.random() * 4);

  return [
    ...distractors.slice(0, correctIndex),
    correctAnswer,
    ...distractors.slice(correctIndex),
  ];
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
          message: 'Tu as fini les calculs de 2 à 10. Regarde ton score et relis les calculs en rouge avant une nouvelle table.',
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

function splitPoetryTextLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function splitTextForDictationPhrases(text: string): string[] {
  const normalizedText = text.trim();
  if (!normalizedText) return [];

  const sentences = normalizedText
    .split(/\n+/)
    .flatMap((part) => {
      const matches = part.match(/[^.!?;:…]+[.!?;:…]?/g);
      return matches ? matches.map((sentence) => sentence.trim()).filter(Boolean) : [];
    })
    .filter((sentence) => sentence.length > 0);

  return sentences.length > 0 ? sentences : [normalizedText];
}

function normalizePoetryWord(word: string) {
  return normalizeWithoutAccents(word).replace(/[^\p{L}\p{M}'-]/gu, '').trim();
}

function splitPoetryWords(text: string): string[] {
  return normalizeWithoutAccents(text).split(/\s+/).map((word) => normalizePoetryWord(word)).filter(Boolean);
}

function calculateWordDiff(expectedWords: string[], spokenWords: string[]) {
  const expectedMap = new Map<string, number>();
  const spokenMap = new Map<string, number>();

  for (const word of expectedWords) {
    expectedMap.set(word, (expectedMap.get(word) ?? 0) + 1);
  }

  for (const word of spokenWords) {
    spokenMap.set(word, (spokenMap.get(word) ?? 0) + 1);
  }

  const missingWords: string[] = [];
  const extraWords: string[] = [];

  for (const [word, expectedCount] of expectedMap) {
    const spokenCount = spokenMap.get(word) ?? 0;
    const diff = expectedCount - spokenCount;
    for (let i = 0; i < diff; i += 1) {
      if (diff > 0) missingWords.push(word);
    }
  }

  for (const [word, spokenCount] of spokenMap) {
    const expectedCount = expectedMap.get(word) ?? 0;
    const diff = spokenCount - expectedCount;
    for (let i = 0; i < diff; i += 1) {
      if (diff > 0) extraWords.push(word);
    }
  }

  return { missingWords, extraWords };
}

function levenshteinWordDistance(left: string[], right: string[]): number {
  const matrix = Array.from({ length: left.length + 1 }, () => Array(right.length + 1).fill(0));

  for (let row = 0; row <= left.length; row += 1) {
    matrix[row][0] = row;
  }

  for (let column = 0; column <= right.length; column += 1) {
    matrix[0][column] = column;
  }

  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      if (left[row - 1] === right[column - 1]) {
        matrix[row][column] = matrix[row - 1][column - 1];
        continue;
      }

      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + 1,
      );
    }
  }

  return matrix[left.length][right.length];
}

function buildPoetryLineFeedback(lineIndex: number, expectedLine: string, spokenLine: string): PoetryLineRecitalFeedback {
  const expectedWords = splitPoetryWords(expectedLine);
  const spokenWords = splitPoetryWords(spokenLine);
  const distance = levenshteinWordDistance(expectedWords, spokenWords);
  const denominator = Math.max(expectedWords.length, spokenWords.length, 1);
  const accuracy = Number((1 - distance / denominator).toFixed(2));
  const { missingWords, extraWords } = calculateWordDiff(expectedWords, spokenWords);
  const isCorrect = accuracy >= 0.84 && extraWords.length <= 1;

  return {
    lineIndex,
    expectedText: expectedLine,
    spokenText: spokenLine,
    isCorrect,
    accuracy: Number(Math.max(0, Math.min(1, accuracy)).toFixed(2)),
    missingWords,
    extraWords,
  };
}

function evaluatePoetryRecital({ poemText, submission, mode, lineIndex }: {
  poemText: string;
  submission: PoetryRecitalSubmission;
  mode: 'line' | 'full';
  lineIndex: number;
}): { status: PoetryRecitalResult['status']; lineFeedback: PoetryLineRecitalFeedback[]; nextLineToPractice?: number; overallAccuracy?: number; recognizedText: string } {
  const poemLines = splitPoetryTextLines(poemText);
  const spokenText = splitTextForDictationPhrases(submission.transcriptText ?? '')
    .join(' ')
    .trim();

  if (poemLines.length === 0) {
    throw new Error('La poésie est vide. Ajoute quelques lignes avant la récitation.');
  }

  const spokenTokens = splitPoetryWords(submission.transcriptText ?? '');
  const expectedTokens = splitPoetryWords(poemLines.join(' '));
  const overallDistance = levenshteinWordDistance(expectedTokens, spokenTokens);
  const overallAccuracy = Number((1 - overallDistance / Math.max(expectedTokens.length, spokenTokens.length, 1)).toFixed(2));

  const feedback: PoetryLineRecitalFeedback[] = [];
  let nextLineToPractice: number | undefined;

  if (mode === 'line') {
    const targetLine = poemLines[lineIndex] ?? poemLines[poemLines.length - 1];
    const expectedTokensForLine = splitPoetryWords(targetLine);
    const spokenLineText = splitTextForDictationPhrases(submission.transcriptText ?? '')[0] ?? submission.transcriptText ?? '';
    const spokenTokensForLine = splitPoetryWords(spokenLineText);

    const localDistance = levenshteinWordDistance(expectedTokensForLine, spokenTokensForLine);
    const localAccuracy = Number((1 - localDistance / Math.max(expectedTokensForLine.length, spokenTokensForLine.length, 1)).toFixed(2));
    const lineFeedback = buildPoetryLineFeedback(lineIndex, targetLine, spokenLineText);
    feedback.push(lineFeedback);

    if (lineFeedback.isCorrect) {
      const next = lineIndex + 1;
      nextLineToPractice = next < poemLines.length ? next : undefined;
    } else {
      nextLineToPractice = lineIndex;
    }

    const status = lineFeedback.isCorrect && nextLineToPractice === undefined ? 'completed' : 'needs_practice';

    return {
      status,
      lineFeedback: feedback,
      nextLineToPractice,
      overallAccuracy: lineFeedback.isCorrect ? localAccuracy : (lineFeedback.accuracy ?? 0),
      recognizedText: spokenText,
    };
  }

  let tokenIndex = 0;
  for (let i = 0; i < poemLines.length; i += 1) {
    const line = poemLines[i];
    const expectedLineTokens = splitPoetryWords(line);
    const chunkSize = Math.max(expectedLineTokens.length, 1);
    const spokenLineTokens = spokenTokens.slice(tokenIndex, tokenIndex + chunkSize);
    tokenIndex += chunkSize;

    const spokenLineText = spokenLineTokens.join(' ');
    const lineEvaluation = buildPoetryLineFeedback(i, line, spokenLineText);
    feedback.push(lineEvaluation);

    if (!lineEvaluation.isCorrect && nextLineToPractice === undefined) {
      nextLineToPractice = i;
    }
  }

  if (feedback.length > 0 && feedback.every((item) => item.isCorrect)) {
    return {
      status: 'completed',
      lineFeedback: feedback,
      nextLineToPractice: undefined,
      overallAccuracy: Math.max(0, overallAccuracy),
      recognizedText: spokenText,
    };
  }

  return {
    status: 'needs_practice',
    lineFeedback: feedback,
    nextLineToPractice,
    overallAccuracy: Math.max(0, overallAccuracy),
    recognizedText: spokenText,
  };
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

const KNOWN_DICTATION_WORDS = new Set([
  'ailleurs', 'apprendre', 'autruche', 'baignoire', 'banane', 'bleu', 'brillant', 'cabane', 'calme', 'cartable',
  'château', 'chanter', 'chemin', 'chercher', 'choisir', 'citrouille', 'courage', 'courageux', 'courir', 'crayon',
  'curieux', 'demain', 'dessiner', 'difficile', 'dormir', 'doucement', 'découvrir', 'doré', 'dragon', 'ensemble',
  'escargot', 'facile', 'fenêtre', 'fermer', 'forêt', 'grand', 'grandir', 'hier', 'histoire', 'ici', 'jardin',
  'joli', 'jouer', 'joyeux', 'lanterne', 'laver', 'lire', 'loin', 'léger', 'magique', 'maison', 'maintenant',
  'manger', 'marcher', 'montagne', 'nuage', 'ouvrir', 'petit', 'pirate', 'près', 'préparer', 'rapide', 'regarder',
  'ranger', 'robot', 'rivière', 'répondre', 'sauter', 'secret', 'silencieux', 'souvent', 'sourire', 'toujours',
  'trouver', 'trésor', 'vite', 'voyage', 'écrire', 'écouter', 'étoile',
]);

function normalizeDictionaryWord(word: string) {
  return word.trim().toLocaleLowerCase('fr-FR');
}

function isLikelyFrenchDictationWord(word: string) {
  const normalizedWord = normalizeDictionaryWord(word);
  if (KNOWN_DICTATION_WORDS.has(normalizedWord)) return true;

  return normalizedWord.length >= 2
    && normalizedWord.length <= 18
    && /^[\p{L}\p{M}]+$/u.test(normalizedWord)
    && !/(.)\1\1/u.test(normalizedWord);
}

async function findUnknownDictationWords(words: string[], confirmedUnknownWords: string[] = []) {
  const confirmed = new Set(confirmedUnknownWords.map(normalizeDictionaryWord));
  return words.filter((word) => {
    const normalizedWord = normalizeDictionaryWord(word);
    return !isLikelyFrenchDictationWord(normalizedWord) && !confirmed.has(normalizedWord);
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

function buildAgreementVariants(word: string) {
  const normalizedWord = normalizeDictionaryWord(word);
  const variants = new Set<string>([normalizedWord]);

  if (normalizedWord.length <= 2) return variants;

  if (!/[sxz]$/u.test(normalizedWord)) {
    variants.add(`${normalizedWord}s`);
  }

  if (normalizedWord.endsWith('e')) {
    variants.add(`${normalizedWord}s`);
  } else {
    variants.add(`${normalizedWord}e`);
    variants.add(`${normalizedWord}es`);
  }

  if (normalizedWord.endsWith('al')) {
    variants.add(`${normalizedWord.slice(0, -2)}aux`);
  }

  if (/(eau|eu|au)$/u.test(normalizedWord)) {
    variants.add(`${normalizedWord}x`);
  }

  return variants;
}

function countWordOccurrences(text: string, word: string) {
  const acceptedVariants = buildAgreementVariants(word);
  const tokens = text.toLocaleLowerCase('fr-FR').match(/[\p{L}\p{M}]+/gu) ?? [];
  return tokens.filter((token) => acceptedVariants.has(token)).length;
}

function countGeneratedWords(text: string) {
  return text.match(/[\p{L}\p{M}0-9'-]+/gu)?.length ?? 0;
}

function extractWordCountBoundsFromPrompt(promptTemplate: string) {
  const match = promptTemplate.match(/entre\s+(\d+)\s+et\s+(\d+)\s+mots/iu);
  if (!match) return null;

  const minimum = Number(match[1]);
  const maximum = Number(match[2]);
  if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || minimum <= 0 || maximum < minimum) return null;

  return { minimum, maximum };
}

function getDictationTenseErrors(text: string, verbTenses: VerbTense[]) {
  const errors: string[] = [];
  const selectedTenses = verbTenses.length > 0 ? verbTenses : ['present'];
  const cleanText = normalizeFrenchText(text);

  if (selectedTenses.length === 1 && selectedTenses[0] === 'present') {
    const forbiddenPresentMarkers = [
      /\b(demain|hier)\b/iu,
      /\b(?:je|tu|il|elle|on|nous|vous|ils|elles)\s+vais?\s+\p{L}+/iu,
      /\b(?:nous)\s+allons\s+\p{L}+/iu,
      /\b(?:il|elle|on)\s+va\s+\p{L}+/iu,
      /\b(?:tu)\s+vas\s+\p{L}+/iu,
      /\b(?:vous)\s+allez\s+\p{L}+/iu,
      /\b(?:ils|elles)\s+vont\s+\p{L}+/iu,
      /\b\p{L}+(?:erai|eras|era|erons|erez|eront)\b/iu,
      /\b(?:j|je|tu|il|elle|on|nous|vous|ils|elles)'?\s*(?:ai|as|a|avons|avez|ont)\s+\p{L}+(?:é|i|u|is|it)\b/iu,
    ];

    if (forbiddenPresentMarkers.some((pattern) => pattern.test(cleanText))) {
      errors.push('temps incorrect : le texte doit rester au présent de l’indicatif');
    }
  }

  return errors;
}

const DICTATION_TEXT_LENGTH_BOUNDS: Record<WordDictationTextLength, { minimum: number; maximum: number; label: string }> = {
  S: { minimum: 35, maximum: 55, label: 'S : 35 à 55 mots' },
  M: { minimum: 55, maximum: 85, label: 'M : 55 à 85 mots' },
  L: { minimum: 85, maximum: 120, label: 'L : 85 à 120 mots' },
  XL: { minimum: 120, maximum: 180, label: 'XL : 120 à 180 mots' },
};

function getDictationTextLengthBounds(textLength: WordDictationTextLength = 'M') {
  return DICTATION_TEXT_LENGTH_BOUNDS[textLength] ?? DICTATION_TEXT_LENGTH_BOUNDS.M;
}

function formatDictationTextLengthForPrompt(textLength: WordDictationTextLength = 'M') {
  const bounds = getDictationTextLengthBounds(textLength);
  return `${bounds.minimum} à ${bounds.maximum} mots`;
}

function getDefaultDictationWordCountBounds() {
  return getDictationTextLengthBounds('M');
}

function getDictationGenerationErrors(
  text: string,
  words: string[],
  promptTemplate = DEFAULT_OLLAMA_DICTATION_PROMPT,
  verbTenses: VerbTense[] = ['present'],
  textLength: WordDictationTextLength = 'M',
) {
  const errors: string[] = [];
  const cleanText = text.trim();
  if (!cleanText) errors.push('texte vide');
  const wordCountBounds = extractWordCountBoundsFromPrompt(promptTemplate) ?? getDictationTextLengthBounds(textLength);
  const wordCount = countGeneratedWords(cleanText);
  if (wordCount > wordCountBounds.maximum) {
    errors.push(`texte trop long : ${wordCount} mots (maximum ${wordCountBounds.maximum})`);
  }
  const sentenceCount = cleanText.split(/[.!?]+/).filter((sentence) => sentence.trim().length > 0).length;
  if (sentenceCount > 4) errors.push('plus de 4 phrases');

  for (const word of words) {
    const count = countWordOccurrences(cleanText, word);
    if (count === 0) errors.push(`mot absent : ${word}`);
    if (count > 1) errors.push(`mot répété : ${word}`);
  }

  if (/^```|```$/.test(cleanText) || /^\s*[{[]/.test(cleanText)) errors.push('réponse non textuelle');
  errors.push(...getDictationTenseErrors(cleanText, verbTenses));

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

const DEFAULT_OLLAMA_DICTATION_PROMPT = `Tu es un enseignant de français de CM1. Tu écris une dictée courte pour un enfant de 9-10 ans.

# Résultat attendu

Écris UN SEUL texte final de dictée, naturel, fluide et cohérent.

# Données à intégrer

MOTS :
{{mots}}

VERBES :
{{verbes}}

TEMPS :
{{temps}}

LONGUEUR :
{{longueur}}

# Règles obligatoires

1. Utilise chaque élément de MOTS exactement une fois.
2. Utilise chaque verbe de VERBES exactement une fois.
3. Respecte strictement LONGUEUR : le texte final doit faire entre les deux bornes indiquées.
4. Conjugue chaque verbe au temps demandé dans TEMPS, dans une vraie phrase avec un sujet clair. Si un seul temps est demandé, toute l’histoire reste à ce temps. Si TEMPS contient 'present', écris au présent de l’indicatif uniquement : 'je lave', 'je me couche'. N’utilise jamais futur proche ou passé : interdit 'je vais laver', 'je vais me coucher', 'je laverai', 'je me coucherai', 'j’ai lavé', 'j’ai dû', 'nous allons', 'hier', 'demain'.
5. Écris 2 ou 3 phrases maximum pour S et M, 3 ou 4 phrases maximum pour L et XL.
6. Si TEMPS contient 'present', utilise ce modèle de style (sans le recopier exactement) : Aujourd’hui, Emma ouvre son cartable et regarde des cartes de dragon et d’autruche. Elle lave ses mains, puis elle se couche calmement.
7. Choisis une situation simple d’enfant : école, maison, jardin, sortie, cahier, cartes, images ou petits objets.
8. Si les mots sont très différents entre eux (animaux, objets, aliments, lieux), rassemble-les naturellement avec des cartes, dessins, images, étiquettes, inventaire ou trésor dans un cartable. Ne fais pas rencontrer un objet ou un aliment comme une personne.
9. Le texte doit sonner comme une petite histoire, pas comme un exercice.

# Interdits

- Ne commence pas par TITRE, DICTEE ou DICTÉE.
- Ne donne pas de titre.
- Ne donne pas de liste, d’explication, de commentaire, de markdown ou de guillemets.
- N’écris jamais "le mot ...", "utilise le mot ...", "la liste ...", "le verbe ...".
- N’invente pas de mots rares ou compliqués.

# Réponse

Réponds uniquement avec le texte final de la dictée.

# Auto-vérification silencieuse

Avant de répondre, vérifie sans l’écrire : tous les mots sont présents une fois, tous les verbes sont présents une fois et conjugués au bon temps, le texte respecte LONGUEUR.`;

export function getDefaultOllamaDictationPromptTemplate() {
  return DEFAULT_OLLAMA_DICTATION_PROMPT;
}

function formatVerbTensesForPrompt(verbTenses: VerbTense[]) {
  const labels: Record<VerbTense, string> = {
    present: 'present (présent de l’indicatif UNIQUEMENT : je fais, je lave, je me couche ; pas de futur, pas de passé, pas de hier/demain)',
    imparfait: 'imparfait (je faisais, je lavais, je me couchais)',
    passe_compose: 'passe_compose (passé composé : j’ai fait, j’ai lavé, je me suis couché)',
    futur: 'futur (je ferai, je laverai, je me coucherai)',
  };

  return verbTenses.map((verbTense) => labels[verbTense] ?? verbTense).join(', ');
}

function interpolateLlamaPrompt(
  template: string,
  words: string[],
  verbs: string[],
  verbTenses: VerbTense[],
  textLength: WordDictationTextLength = 'M',
) {
  const terms = buildGenerationTerms(words);
  const replacements = {
    mots: terms.map((word) => `- ${word}`).join('\n') || 'à définir',
    verbes: verbs.length > 0 ? verbs.map((verb) => `- ${verb}`).join('\n') : 'à définir',
    temps: verbTenses.length > 0 ? formatVerbTensesForPrompt(verbTenses) : formatVerbTensesForPrompt(['present']),
    longueur: formatDictationTextLengthForPrompt(textLength),
  };

  const prompt = template.replace(/\{\{\s*(mots|verbes|temps|longueur)\s*\}\}/gi, (match, key: string) => {
    const resolvedKey = key.toLocaleLowerCase() as keyof typeof replacements;
    return replacements[resolvedKey] ?? match;
  });

  if (/\{\{\s*longueur\s*\}\}/iu.test(template)) return prompt;
  return `${prompt}\n\nLONGUEUR : ${formatDictationTextLengthForPrompt(textLength)}`;
}

export function buildOllamaDictationPromptFromTemplate(
  template: string,
  words: string[],
  verbs: string[],
  verbTenses: VerbTense[],
  textLength: WordDictationTextLength = 'M',
  previousErrors: string[] = [],
) {
  const generatedPrompt = interpolateLlamaPrompt(template, words, verbs, verbTenses, textLength);
  const correctionBlock = previousErrors.length > 0
    ? `\nLe texte précédent était refusé pour ces raisons : ${previousErrors.join('; ')}. Corrige strictement ces points.`
    : '';

  return `${generatedPrompt}${correctionBlock}`;
}

export function buildOllamaDictationPrompt(
  words: string[],
  verbs: string[],
  verbTenses: VerbTense[],
  textLength: WordDictationTextLength = 'M',
  previousErrors: string[] = [],
) {
  return buildOllamaDictationPromptFromTemplate(DEFAULT_OLLAMA_DICTATION_PROMPT, words, verbs, verbTenses, textLength, previousErrors);
}

function stripLlmEnvelope(text: string) {
  return text
    .trim()
    .replace(/^```(?:text|txt|fr|markdown)?/i, '')
    .replace(/```$/i, '')
    .replace(/^\s*["“”]|["“”]\s*$/g, '')
    .trim();
}

async function callOpenAiDictation(
  words: string[],
  verbs: string[],
  verbTenses: VerbTense[],
  textLength: WordDictationTextLength = 'M',
  previousErrors: string[] = [],
  customPrompt?: string,
) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 90_000);
  const generatedPrompt = customPrompt
    ? buildOllamaDictationPromptFromTemplate(customPrompt, words, verbs, verbTenses, textLength, previousErrors)
    : buildOllamaDictationPrompt(words, verbs, verbTenses, textLength, previousErrors);
  const correctionBlock = previousErrors.length > 0
    ? `\nLe texte précédent était refusé pour ces raisons : ${previousErrors.join('; ')}. Corrige strictement ces points.`
    : '';
  const finalPrompt = previousErrors.length > 0 && !generatedPrompt.includes('Corrige strictement ces points.')
    ? `${generatedPrompt}${correctionBlock}`
    : generatedPrompt;
  try {
    const response = await fetch('/api/openai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        prompt: finalPrompt,
        stream: false,
        options: {
          temperature: 0.2,
          num_predict: 220,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`OpenAI a répondu ${response.status}. Vérifie que la clé API est disponible côté serveur.`);
    }

    const payload = await response.json() as { response?: string; error?: string };
    if (payload.error) throw new Error(payload.error);
    return stripLlmEnvelope(payload.response ?? '');
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('OpenAI met trop de temps à répondre. Réessaie dans quelques instants.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function generateOpenAiWordDictationText(
  words: string[],
  verbs: string[],
  verbTenses: VerbTense[],
  textLength: WordDictationTextLength = 'M',
  customPrompt?: string,
) {
  let previousErrors: string[] = [];
  let lastText = '';
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const candidate = await callOpenAiDictation(words, verbs, verbTenses, textLength, previousErrors, customPrompt);
    lastText = candidate;
    const errors = getDictationGenerationErrors(candidate, words, customPrompt ?? DEFAULT_OLLAMA_DICTATION_PROMPT, verbTenses, textLength);
    if (errors.length === 0) {
      return {
        text: candidate,
        checks: [],
        isValid: true,
      };
    }
    previousErrors = errors;
  }

  return {
    text: lastText,
    checks: previousErrors,
    isValid: false,
  };
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

  const selectedVerbs: string[] = request.verbs ?? [];
  const selectedVerbTenses: VerbTense[] = request.verbTenses.length > 0 ? request.verbTenses : ['present'];
  const selectedTextLength: WordDictationTextLength = request.textLength ?? 'M';
  const unknownWords = await findUnknownDictationWords(words, request.confirmedUnknownWords ?? []);
  if (unknownWords.length > 0) {
    throw new Error(`Confirme ces mots avant de générer : ${unknownWords.join(', ')}`);
  }

  const generationResult = await generateOpenAiWordDictationText(words, selectedVerbs, selectedVerbTenses, selectedTextLength, request.prompt);

  return {
    mode: 'word_dictation',
    title: 'Dictée IA OpenAI préparée',
    text: generationResult.text,
    isHiddenByDefault: false,
    wordChecklist: words,
    selectedVerbTenses,
    selectedTextLength,
    generationProvider: 'openai',
    readingInstruction: 'Contrôles parent sous le texte : vérifie les mots inclus, lance la lecture pour l\u2019élève ou relance OpenAI si tu veux une nouvelle proposition.',
    controlResult: {
      isValid: generationResult.isValid,
      checks: generationResult.checks,
    },
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

export async function getPoetryLibraryTexts(childId: string): Promise<PoetryLibraryText[]> {
  await apiDelay();
  assertKnownChild(childId);

  return cloneApiPayload(poetryLibraryTexts);
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

  const { poemId, poemText, transcriptText, confidence, recitationMode, lineIndex } = submission;
  const expectedPoemText = poemText ?? poetrySessionMock.lines.join('\n');

  if (poemId !== poetrySessionMock.poemId && !poemText) {
    throw new Error(`Poésie inconnue : ${poemId}`);
  }

  const mode = recitationMode ?? 'full';
  const selectedLineIndex = Math.max(0, Math.min((lineIndex ?? 0), Math.max(0, splitPoetryTextLines(expectedPoemText).length - 1)));
  const evaluation = evaluatePoetryRecital({
    poemText: expectedPoemText,
    submission: {
      ...submission,
      poemId,
      transcriptText: transcriptText ?? '',
    },
    mode,
    lineIndex: selectedLineIndex,
  });

  const isManualPractice = (transcriptText ?? '').trim().length === 0;

  if (mode === 'line' && confidence === undefined && !isManualPractice) {
    return {
      poemId,
      status: evaluation.status,
      earnedStars: evaluation.status === 'completed' ? poetrySessionMock.rewardStars : 0,
      feedbackTitle: evaluation.status === 'completed' ? 'Très bien, tu as dit cette ligne !' : 'Essaie encore cette ligne.',
      feedbackMessage: evaluation.status === 'completed'
        ? `La ligne ${selectedLineIndex + 1} est bien comprise.`
        : 'Ressaye lentement en appuyant sur le micro à l’ouverture de la ligne.',
      nextLineToPractice: evaluation.nextLineToPractice,
      overallAccuracy: evaluation.overallAccuracy,
      lineFeedback: evaluation.lineFeedback,
      recognizedText: evaluation.recognizedText,
    };
  }

  if (mode === 'full' && confidence === undefined && isManualPractice) {
    return {
      poemId,
      status: 'needs_practice',
      earnedStars: 0,
      feedbackTitle: 'Il faut valider la récitation',
      feedbackMessage: 'Récite la poésie au micro ou copie le texte prononcé pour corriger.',
      nextLineToPractice: 0,
      overallAccuracy: 0,
      lineFeedback: [],
      recognizedText: evaluation.recognizedText,
    };
  }

  if (mode === 'line') {
    const lineFeedback = evaluation.lineFeedback[0];
    const isLineCorrect = lineFeedback?.isCorrect ?? false;
    if (isLineCorrect) {
      return {
        poemId,
        status: evaluation.status,
        earnedStars: evaluation.status === 'completed' ? poetrySessionMock.rewardStars : 0,
        feedbackTitle: evaluation.nextLineToPractice === undefined ? 'Super ! Toute la poésie est mémorisée.' : 'Très bien, ligne réussie',
        feedbackMessage: evaluation.nextLineToPractice === undefined
          ? `Parfait, tu as tout dit clairement. ${poetrySessionMock.rewardStars} étoiles.`
          : `Ligne ${selectedLineIndex + 1} validée. Passe à la ligne suivante.`,
        nextLineToPractice: evaluation.nextLineToPractice,
        overallAccuracy: evaluation.overallAccuracy,
        lineFeedback: evaluation.lineFeedback,
        recognizedText: evaluation.recognizedText,
      };
    }

    return {
      poemId,
      status: 'needs_practice',
      earnedStars: 0,
      feedbackTitle: 'Presque prêt !',
      feedbackMessage: `La ligne ${selectedLineIndex + 1} a besoin d’un petit réajustement.`,
      nextLineToPractice: evaluation.nextLineToPractice,
      overallAccuracy: evaluation.overallAccuracy,
      lineFeedback: evaluation.lineFeedback,
      recognizedText: evaluation.recognizedText,
    };
  }

  if (evaluation.status === 'completed' || confidence === 'ready') {
    const isValidated = evaluation.status === 'completed' || confidence === 'ready';
    return {
      poemId,
      status: isValidated ? 'completed' : 'needs_practice',
      earnedStars: isValidated ? poetrySessionMock.rewardStars : 0,
      feedbackTitle: isValidated ? 'Bravo, récitation validée !' : 'Il faut encore progresser',
      feedbackMessage: isValidated
        ? `Tu gagnes ${poetrySessionMock.rewardStars} étoiles. Ta récitation est claire et posée.`
        : 'Relis la ligne la plus difficile, puis réessaie calmement.',
      nextLineToPractice: evaluation.nextLineToPractice,
      overallAccuracy: evaluation.overallAccuracy,
      lineFeedback: evaluation.lineFeedback,
      recognizedText: evaluation.recognizedText,
    };
  }

  return {
    poemId,
    status: 'needs_practice',
    earnedStars: 0,
    feedbackTitle: 'Encore une tentative',
    feedbackMessage: 'Relis tranquillement et refais la récitation.',
    nextLineToPractice: evaluation.nextLineToPractice,
    overallAccuracy: evaluation.overallAccuracy,
    lineFeedback: evaluation.lineFeedback,
    recognizedText: evaluation.recognizedText,
  };
}

export async function getReadingSession(childId: string): Promise<ReadingSession> {
  await apiDelay();
  assertKnownChild(childId);

  return cloneApiPayload(readingSessionMock);
}

type GeneratedReadingFields = {
  character: string;
  animal: string;
  object: string;
  place: string;
};

type GeneratedReadingSessionRequest = {
  childId: string;
  storyText: string;
  fields: GeneratedReadingFields;
};

const readingQuestionDistractors: Record<keyof GeneratedReadingFields, string[]> = {
  character: ['Noé', 'Zoé l’inventrice', 'Milo le magicien', 'Inès l’exploratrice'],
  animal: ['chouette savante', 'chat astronaute', 'panda ninja', 'dauphin farceur'],
  object: ['carte au trésor', 'boussole magique', 'carnet secret', 'lampe à étoiles'],
  place: ['bibliothèque volante', 'château nuage', 'île aux énigmes', 'station lunaire'],
};

function firstReadingChoice(value: string, fallback: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean)[0] ?? fallback;
}

function splitGeneratedReadingStory(text: string) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return ['Histoire générée par IA.'];
  const sentences = normalized.match(/[^.!?]+[.!?]+|[^.!?]+$/gu) ?? [normalized];
  return sentences.map((sentence) => sentence.trim()).filter(Boolean);
}

function buildReadingQuestion({
  id,
  prompt,
  correctLabel,
  correctOptionId,
  distractors,
}: {
  id: string;
  prompt: string;
  correctLabel: string;
  correctOptionId: string;
  distractors: string[];
}): ReadingQuestion {
  const uniqueDistractors = distractors.filter((item) => item.toLocaleLowerCase('fr-FR') !== correctLabel.toLocaleLowerCase('fr-FR')).slice(0, 2);
  const options = [correctLabel, ...uniqueDistractors];
  const optionIds = [correctOptionId, `${correctOptionId}-a`, `${correctOptionId}-b`];

  return { id, prompt, options, optionIds, correctOptionId };
}

export function buildGeneratedReadingSession(request: GeneratedReadingSessionRequest): ReadingSession {
  const character = firstReadingChoice(request.fields.character, 'le personnage principal');
  const animal = firstReadingChoice(request.fields.animal, 'l’animal de l’histoire');
  const object = firstReadingChoice(request.fields.object, 'l’objet important');
  const storyLines = splitGeneratedReadingStory(request.storyText);
  const stableId = `${character}-${animal}-${object}-${request.fields.place}-${request.storyText}`
    .toLocaleLowerCase('fr-FR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'story';

  return {
    childId: request.childId,
    id: `generated-reading-${stableId}`,
    title: 'Histoire générée par IA',
    instruction: 'Lis l’histoire générée, puis réponds aux questions de compréhension préparées pour ce texte.',
    audioLabel: 'Écouter l’histoire générée',
    text: storyLines,
    questions: [
      buildReadingQuestion({
        id: 'generated-reading-q1',
        prompt: 'Quel personnage suit-on dans cette histoire ?',
        correctLabel: character,
        correctOptionId: 'character',
        distractors: readingQuestionDistractors.character,
      }),
      buildReadingQuestion({
        id: 'generated-reading-q2',
        prompt: 'Quel animal apparaît dans cette histoire ?',
        correctLabel: animal,
        correctOptionId: 'animal',
        distractors: readingQuestionDistractors.animal,
      }),
      buildReadingQuestion({
        id: 'generated-reading-q3',
        prompt: 'Quel objet est important dans cette histoire ?',
        correctLabel: object,
        correctOptionId: 'object',
        distractors: readingQuestionDistractors.object,
      }),
    ],
    rewardStars: readingSessionMock.rewardStars,
  };
}

export function evaluateReadingAnswers(session: ReadingSession, submission: ReadingAnswerSubmission): ReadingAnswerResult {
  if (submission.sessionId !== session.id) {
    throw new Error(`Lecture inconnue : ${submission.sessionId}`);
  }

  const correctAnswers = submission.answers.filter((answer) => {
    const question = session.questions.find((item) => item.id === answer.questionId);
    return question?.correctOptionId === answer.selectedOptionId;
  }).length;
  const totalQuestions = session.questions.length;
  const allCorrect = correctAnswers === totalQuestions;

  return {
    sessionId: session.id,
    correctAnswers,
    totalQuestions,
    earnedStars: allCorrect ? session.rewardStars : Math.max(1, correctAnswers * 2),
    feedbackTitle: allCorrect ? 'Bravo, tu as compris l’histoire !' : 'Tu as déjà repéré beaucoup d’indices !',
    feedbackMessage: allCorrect
      ? `Tu gagnes ${session.rewardStars} étoiles. Tu as bien compris l’histoire que tu viens de lire.`
      : `Tu as ${correctAnswers} bonne(s) réponse(s) sur ${totalQuestions}. Relis l’histoire puis réessaie.`,
  };
}

export async function submitReadingAnswers(
  childId: string,
  submission: ReadingAnswerSubmission,
): Promise<ReadingAnswerResult> {
  await apiDelay();
  assertKnownChild(childId);

  return evaluateReadingAnswers(readingSessionMock, submission);
}
