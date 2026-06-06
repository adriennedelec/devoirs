export type RewardShelfItemStatus = 'unlocked' | 'locked';

export type RewardShelfItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
  costStars: number;
  status: RewardShelfItemStatus;
};

export type RewardHistoryItem = {
  id: string;
  title: string;
  description: string;
  earnedStars: number;
  activityTitle: string;
};

export type Badge = {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
};

export type ChallengeSummary = {
  id: string;
  title: string;
  description: string;
  currentCount: number;
  targetCount: number;
  rewardStars: number;
};
