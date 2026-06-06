import type { ChildDashboard } from '../types/api';
import type {
  MultiplicationAnswerResult,
  MultiplicationAnswerSubmission,
  MultiplicationSession,
} from '../types/multiplication';
import { apiDelay, cloneApiPayload } from './apiClient';
import { childDashboardMock, multiplicationSessionMock } from './mockData';

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
