import { describe, expect, it } from 'vitest';
import { getChildDashboard } from '../src/services/childService';

describe('child dashboard service contract', () => {
  it('returns an API-shaped dashboard payload without exposing shared mutable fixtures', async () => {
    const first = await getChildDashboard('emma-demo');
    const second = await getChildDashboard('emma-demo');

    expect(first.child.firstName).toBe('Emma');
    expect(first.dailyGoal.targetCount).toBeGreaterThan(0);
    expect(first.activities.length).toBeGreaterThanOrEqual(4);
    expect(first.activities.every((activity) => activity.route.startsWith('/'))).toBe(true);
    expect(first).not.toBe(second);
    expect(first.activities).not.toBe(second.activities);
  });
});
