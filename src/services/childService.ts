import type { ChildDashboard } from '../types/api';
import type {
  DictationAnswerResult,
  DictationAnswerSubmission,
  DictationSession,
  PoetryRecitalResult,
  PoetryRecitalSubmission,
  PoetrySession,
} from '../types/language';
import type {
  MultiplicationAnswerResult,
  MultiplicationAnswerSubmission,
  MultiplicationSession,
} from '../types/multiplication';
import { apiDelay, cloneApiPayload } from './apiClient';
import { childDashboardMock, dictationSessionMock, multiplicationSessionMock, poetrySessionMock } from './mockData';

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

export async function getMultiplicationSession(childId: string, table?: number): Promise<MultiplicationSession> {
  await apiDelay();
  assertKnownChild(childId);

  const session = cloneApiPayload(multiplicationSessionMock);
  if (table && session.availableTables.some((availableTable) => availableTable.value === table)) {
    session.selectedTable = table;
  }

  return session;
}

export async function submitMultiplicationAnswer(
  childId: string,
  submission: MultiplicationAnswerSubmission,
): Promise<MultiplicationAnswerResult> {
  await apiDelay();
  assertKnownChild(childId);

  const question = multiplicationSessionMock.currentQuestion;
  if (submission.questionId !== question.id) {
    throw new Error(`Question inconnue : ${submission.questionId}`);
  }

  const correctAnswer = question.leftFactor * question.rightFactor;
  const isCorrect = submission.selectedAnswer === correctAnswer;

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
  };
}

function normalizeFrenchText(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('fr-FR');
}

export async function getDictationSession(childId: string): Promise<DictationSession> {
  await apiDelay();
  assertKnownChild(childId);

  return cloneApiPayload(dictationSessionMock);
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
      : `Regarde la correction douce : ${dictationSessionMock.expectedText}`,
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
