import type { ActivitySummary } from './activity';
import type { ChildProfile, DailyGoal, GlobalProgress, Reminder } from './child';
import type { Badge, ChallengeSummary } from './reward';

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
};
