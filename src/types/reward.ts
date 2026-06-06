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
