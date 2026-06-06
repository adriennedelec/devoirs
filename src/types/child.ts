export type ChildProfile = {
  id: string;
  firstName: string;
  avatarEmoji: string;
  level: number;
  title: string;
  stars: number;
  streakDays: number;
};

export type GlobalProgress = {
  percent: number;
  starsEarned: number;
  objectivesCompleted: number;
  streakDays: number;
};

export type DailyGoal = {
  id: string;
  title: string;
  description: string;
  currentCount: number;
  targetCount: number;
  rewardStars: number;
};

export type Reminder = {
  id: string;
  title: string;
  description: string;
  kind: 'homework' | 'quiz' | 'encouragement';
};
