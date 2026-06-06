import type { ChildDashboard } from '../types/api';
import type {
  DictationAnswerResult,
  DictationAnswerSubmission,
  DictationSession,
  DictationWordFeedback,
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

const knownDictationWords = new Set([
  'abeille', 'ami', 'amie', 'animal', 'arbre', 'automne', 'ballon', 'bateau', 'chat', 'château', 'chemin',
  'chien', 'classe', 'crayon', 'dragon', 'école', 'enfant', 'étoile', 'famille', 'fleur', 'forêt', 'garçon',
  'histoire', 'jardin', 'lapin', 'livre', 'maison', 'matin', 'mer', 'mot', 'mots', 'nuage', 'oiseau', 'page',
  'papillon', 'pluie', 'poésie', 'pomme', 'renard', 'rivière', 'robot', 'sac', 'soleil', 'table', 'cartable',
  'train', 'vélo', 'ville', 'voiture', 'voyage',
]);

function normalizeDictionaryWord(word: string) {
  return word.trim().toLocaleLowerCase('fr-FR');
}

function findUnknownDictationWords(words: string[], confirmedUnknownWords: string[] = []) {
  const confirmed = new Set(confirmedUnknownWords.map(normalizeDictionaryWord));
  return words.filter((word) => {
    const normalizedWord = normalizeDictionaryWord(word);
    return !knownDictationWords.has(normalizedWord) && !confirmed.has(normalizedWord);
  });
}

function cleanWordList(words: string[]) {
  return words
    .flatMap((item) => item.split(/[\n,;]+/))
    .map((word) => word.trim())
    .filter(Boolean)
    .filter((word, index, allWords) => allWords.findIndex((candidate) => candidate.toLocaleLowerCase('fr-FR') === word.toLocaleLowerCase('fr-FR')) === index);
}

function extractCandidateWordsFromText(text: string) {
  return cleanWordList(
    text
      .replace(/[’']/g, ' ')
      .split(/[^\p{L}\p{M}-]+/u)
      .map((word) => word.trim())
      .filter((word) => word.length >= 2),
  ).map((word) => word.toLocaleLowerCase('fr-FR'));
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

  const unknownWords = findUnknownDictationWords(words);
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

function buildTenseSentences(words: string[], verbTenses: VerbTense[]) {
  const chosenTenses: VerbTense[] = verbTenses.length > 0 ? verbTenses : ['present'];
  const sentenceTemplates: Record<VerbTense, (word: string, index: number) => string> = {
    present: (word, index) => index === 0
      ? `Aujourd’hui, Emma utilise le mot ${word}.`
      : `Elle utilise aussi le mot ${word}.`,
    imparfait: (word, index) => index === 0
      ? `Avant, Emma apprenait le mot ${word}.`
      : `Elle apprenait aussi le mot ${word}.`,
    passe_compose: (word, index) => index === 0
      ? `Hier, Emma a écrit le mot ${word}.`
      : `Elle a écrit aussi le mot ${word}.`,
    futur: (word, index) => index === 0
      ? `Demain, Emma utilisera le mot ${word}.`
      : `Demain, elle utilisera aussi le mot ${word}.`,
  };

  return words
    .map((word, index) => sentenceTemplates[chosenTenses[index % chosenTenses.length]](word, index))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
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
  const unknownWords = findUnknownDictationWords(words, request.confirmedUnknownWords ?? []);
  if (unknownWords.length > 0) {
    throw new Error(`Confirme ces mots avant de générer : ${unknownWords.join(', ')}`);
  }

  return {
    mode: 'word_dictation',
    title: 'Dictée de mots préparée',
    text: buildTenseSentences(words, selectedVerbTenses),
    isHiddenByDefault: true,
    wordChecklist: words,
    selectedVerbTenses,
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
