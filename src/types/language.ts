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

export type DictationWordFeedback = {
  expected: string;
  actual: string;
  status: 'correct' | 'missing' | 'accent_or_punctuation' | 'different';
  hint: string;
};

export type DictationAnswerResult = {
  sessionId: string;
  answerText: string;
  correctedText: string;
  isCorrect: boolean;
  earnedStars: number;
  feedbackTitle: string;
  feedbackMessage: string;
  wordFeedback: DictationWordFeedback[];
  retryLabel: string;
};

export type PoetryStepStatus = 'completed' | 'current' | 'locked';

export type PoetryStep = {
  id: string;
  label: string;
  description: string;
  status: PoetryStepStatus;
};

export type PoetryPracticeLine = {
  id: string;
  label: string;
  text: string;
  hiddenText: string;
  status: 'known' | 'practice' | 'locked';
};

export type PoetrySession = {
  childId: string;
  poemId: string;
  title: string;
  instruction: string;
  lines: string[];
  steps: PoetryStep[];
  rewardStars: number;
  practiceLines: PoetryPracticeLine[];
  memoryModes: string[];
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
