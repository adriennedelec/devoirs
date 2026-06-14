import { describe, expect, it } from 'vitest';
import { calculateRewardStars, normalizeRewardSettings } from '../src/services/rewardSettingsDatabase';

describe('paramétrage des étoiles', () => {
  it('calcule les étoiles par exercice terminé, pas par bonne réponse', () => {
    const settings = normalizeRewardSettings({
      multiplication: {
        starsPerCompletedExercise: 5,
        perfectBonusStars: 2,
      },
    });

    expect(calculateRewardStars('multiplication', 8, 1, settings)).toBe(5);
    expect(calculateRewardStars('multiplication', 9, 0, settings)).toBe(7);
  });
});
