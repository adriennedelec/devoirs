export type LearningWorldStatus = 'completed' | 'in_progress' | 'available' | 'locked';

export type LearningWorld = {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: LearningWorldStatus;
  progressPercent: number;
  unlockedBadges: number;
};

export type PrimaryMission = {
  id: string;
  title: string;
  description: string;
  subject: 'multiplication' | 'dictation' | 'poetry' | 'reading';
  ctaLabel: string;
  rewardStars: number;
};
