import type { ActivitySummary } from './activity';
import type { ChildProfile, DailyGoal, GlobalProgress, Reminder } from './child';
import type { LearningWorld, PrimaryMission } from './learningPath';
import type { Badge, ChallengeSummary, RewardHistoryItem, RewardShelfItem } from './reward';

export type ApiState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'empty' }
  | { status: 'error'; message: string };

export type ChildDashboard = {
  child: ChildProfile;
  progress: GlobalProgress;
  dailyGoal: DailyGoal;
  activities: ActivitySummary[];
  recentBadges: Badge[];
  activeChallenge?: ChallengeSummary;
  reminders: Reminder[];
  welcomeMessage: string;
  primaryMission: PrimaryMission;
  learningWorlds: LearningWorld[];
  rewardShelf: RewardShelfItem[];
  rewardHistory: RewardHistoryItem[];
};
