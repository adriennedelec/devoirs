export type DictationSession = {
  childId: string;
  id: string;
  title: string;
  instruction: string;
  audioLabel: string;
  expectedText: string;
  hints: string[];
  rewardStars: number;
};

export type DictationAnswerSubmission = {
  sessionId: string;
  answerText: string;
};

export type DictationAnswerResult = {
  sessionId: string;
  answerText: string;
  correctedText: string;
  isCorrect: boolean;
  earnedStars: number;
  feedbackTitle: string;
  feedbackMessage: string;
};

export type PoetryStepStatus = 'completed' | 'current' | 'locked';

export type PoetryStep = {
  id: string;
  label: string;
  description: string;
  status: PoetryStepStatus;
};

export type PoetrySession = {
  childId: string;
  poemId: string;
  title: string;
  instruction: string;
  lines: string[];
  steps: PoetryStep[];
  rewardStars: number;
};

export type PoetryRecitalSubmission = {
  poemId: string;
  confidence: 'needs_help' | 'ready';
};

export type PoetryRecitalResult = {
  poemId: string;
  status: 'needs_practice' | 'completed';
  earnedStars: number;
  feedbackTitle: string;
  feedbackMessage: string;
};
