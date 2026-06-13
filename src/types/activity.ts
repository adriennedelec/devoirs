export type ActivitySubject =
  | 'math'
  | 'multiplication'
  | 'dictation'
  | 'poetry'
  | 'reading'
  | 'orthography'
  | 'grammar';

export type ActivityStatus = 'not_started' | 'in_progress' | 'completed' | 'locked';

export type ActivitySummary = {
  id: string;
  subject: ActivitySubject;
  title: string;
  description: string;
  progressPercent: number;
  status: ActivityStatus;
  rewardStars: number;
  route: string;
  icon: string;
};

export type StoredActivityModule = 'multiplication' | 'dictation' | 'poetry' | 'reading';

export type StoredActivityStatus = 'completed' | 'partial' | 'abandoned';

export type ActivityRecordDetails = Record<string, unknown>;

export type ActivityRecord = {
  id: string;
  profileId: string;
  profileName: string;
  module: StoredActivityModule;
  moduleLabel: string;
  exerciseLabel: string;
  startedAtIso: string;
  completedAtIso: string;
  durationSeconds: number;
  status: StoredActivityStatus;
  score: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  starsEarned: number;
  details: ActivityRecordDetails;
};
