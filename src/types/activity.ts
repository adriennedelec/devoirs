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
