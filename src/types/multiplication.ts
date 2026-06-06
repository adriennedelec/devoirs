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
};

export type MultiplicationAnswerSubmission = {
  questionId: string;
  selectedAnswer: number;
};

export type MultiplicationAnswerResult = {
  questionId: string;
  selectedAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  earnedStars: number;
  feedbackTitle: string;
  feedbackMessage: string;
};
