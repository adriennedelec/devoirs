export type RewardExerciseKey = 'multiplication' | 'dictation' | 'poetry' | 'reading';

export type RewardExerciseSetting = {
  label: string;
  starsPerCompletedExercise: number;
  perfectBonusStars: number;
};

export type RewardSettings = Record<RewardExerciseKey, RewardExerciseSetting>;

const REWARD_SETTINGS_STORAGE_KEY = 'devoirs.rewardSettings.v1';

export const DEFAULT_REWARD_SETTINGS: RewardSettings = {
  multiplication: {
    label: 'Tables de multiplication',
    starsPerCompletedExercise: 1,
    perfectBonusStars: 0,
  },
  dictation: {
    label: 'Dictée',
    starsPerCompletedExercise: 2,
    perfectBonusStars: 0,
  },
  poetry: {
    label: 'Poésie',
    starsPerCompletedExercise: 4,
    perfectBonusStars: 0,
  },
  reading: {
    label: 'Lecture',
    starsPerCompletedExercise: 2,
    perfectBonusStars: 0,
  },
};

const rewardKeys = Object.keys(DEFAULT_REWARD_SETTINGS) as RewardExerciseKey[];

function normalizeStars(value: unknown, fallback: number) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? Math.max(0, Math.round(numberValue)) : fallback;
}

export function normalizeRewardSettings(rawSettings: unknown): RewardSettings {
  const candidate = typeof rawSettings === 'object' && rawSettings !== null ? rawSettings as Partial<Record<RewardExerciseKey, Partial<RewardExerciseSetting>>> : {};

  return rewardKeys.reduce<RewardSettings>((settings, key) => {
    const fallback = DEFAULT_REWARD_SETTINGS[key];
    const rawSetting = candidate[key] ?? {};
    settings[key] = {
      label: fallback.label,
      starsPerCompletedExercise: normalizeStars(rawSetting.starsPerCompletedExercise, fallback.starsPerCompletedExercise),
      perfectBonusStars: normalizeStars(rawSetting.perfectBonusStars, fallback.perfectBonusStars),
    };
    return settings;
  }, {} as RewardSettings);
}

export function readRewardSettingsFromStorage(): RewardSettings {
  if (typeof window === 'undefined') return DEFAULT_REWARD_SETTINGS;

  try {
    const stored = window.localStorage.getItem(REWARD_SETTINGS_STORAGE_KEY);
    if (!stored) return DEFAULT_REWARD_SETTINGS;
    return normalizeRewardSettings(JSON.parse(stored));
  } catch {
    return DEFAULT_REWARD_SETTINGS;
  }
}

export function writeRewardSettingsToStorage(settings: RewardSettings) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(REWARD_SETTINGS_STORAGE_KEY, JSON.stringify(normalizeRewardSettings(settings)));
  } catch {
    // Ignore local persistence failures; the current screen state still reflects the edited settings.
  }
}

export function calculateRewardStars(
  key: RewardExerciseKey,
  score: number,
  wrongCount: number,
  settings: RewardSettings = readRewardSettingsFromStorage(),
) {
  const exerciseSettings = settings[key];
  const baseStars = Math.max(0, score) * exerciseSettings.starsPerCompletedExercise;
  const bonusStars = wrongCount === 0 ? exerciseSettings.perfectBonusStars : 0;
  return baseStars + bonusStars;
}
