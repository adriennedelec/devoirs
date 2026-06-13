export type MultiplicationTableStatus = 'not_started' | 'in_progress' | 'mastered';

export type MultiplicationTableSummary = {
  value: number;
  label: string;
  progressPercent: number;
  status: MultiplicationTableStatus;
  rewardStars: number;
};

export type MultiplicationQuestion = {
  id: string;
  table: number;
  leftFactor: number;
  rightFactor: number;
  prompt: string;
  options: number[];
  rewardStars: number;
};

export type MultiplicationSession = {
  childId: string;
  title: string;
  mascotTip: string;
  selectedTable: number;
  availableTables: MultiplicationTableSummary[];
  currentQuestion: MultiplicationQuestion;
  questions: MultiplicationQuestion[];
  totalQuestions: number;
};

export type MultiplicationAnswerSubmission = {
  questionId: string;
  selectedAnswer: number;
};

export type MultiplicationSessionProgress = {
  currentIndex: number;
  totalQuestions: number;
};

export type MultiplicationAttemptRecord = {
  questionId: string;
  leftFactor: number;
  rightFactor: number;
  correctAnswer: number;
  scorePoint: 0 | 1;
};

export type MultiplicationTableReviewFact = {
  rightFactor: number;
  line: string;
  status: 'mastered' | 'missed';
};

export type MultiplicationSessionSummary = {
  title: string;
  message: string;
  earnedStars: number;
};

export type CompletedMultiplicationTable = {
  id: string;
  childName: string;
  table: number;
  correctCount: number;
  wrongCount: number;
  score: number;
  totalQuestions: number;
  durationSeconds: number;
  completedAtIso: string;
  facts: MultiplicationTableReviewFact[];
};

export type MultiplicationAnswerResult = {
  questionId: string;
  selectedAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  earnedStars: number;
  feedbackTitle: string;
  feedbackMessage: string;
  sessionProgress: MultiplicationSessionProgress;
  sessionSummary?: MultiplicationSessionSummary;
};
