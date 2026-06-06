export type ReadingQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctOptionId: string;
  optionIds: string[];
};

export type ReadingSession = {
  childId: string;
  id: string;
  title: string;
  instruction: string;
  audioLabel: string;
  text: string[];
  questions: ReadingQuestion[];
  rewardStars: number;
};

export type ReadingAnswerSubmission = {
  sessionId: string;
  answers: Array<{
    questionId: string;
    selectedOptionId: string;
  }>;
};

export type ReadingAnswerResult = {
  sessionId: string;
  correctAnswers: number;
  totalQuestions: number;
  earnedStars: number;
  feedbackTitle: string;
  feedbackMessage: string;
};
