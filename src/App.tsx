import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode, FormEvent, CSSProperties } from 'react';
import { BookOpen, Database, Flame, Gift, GraduationCap, Home, MapIcon, Mic, PencilLine, Settings, Sparkles, Star, Trophy, User, UserRound, Users } from 'lucide-react';
import type { ApiState, ChildDashboard } from './types/api';
import type { ActivityRecord, StoredActivityModule } from './types/activity';
import type {
  DictationAnswerResult,
  DictationSession,
  DictationMode,
  PoetryLineRecitalFeedback,
  PoetryRecitalResult,
  PoetrySession,
  VerbTense,
  WordDictationOcrResult,
  WordDictationTextResult,
} from './types/language';
import type {
  MultiplicationAnswerResult,
  MultiplicationAttemptRecord,
  MultiplicationSession,
  MultiplicationTableReviewFact,
  CompletedMultiplicationTable,
} from './types/multiplication';
import type { ReadingAnswerResult, ReadingSession } from './types/reading';
import adrienProfilePhotoUrl from './assets/profile-photos/parents/adrien.png';
import {
  getChildDashboard,
  getDictationSession,
  getMultiplicationSession,
  getPoetrySession,
  getReadingSession,
  dictationVerbTenseOptions,
  extractWordDictationWordsFromOcr,
  generateWordDictationText,
  submitDictationAnswer,
  submitMultiplicationAnswer,
  submitPoetryRecital,
  submitReadingAnswers,
  buildOllamaDictationPromptFromTemplate,
  getDefaultOllamaDictationPromptTemplate,
} from './services/childService';
import {
  readMultiplicationTableHistoryFromStorage,
  writeMultiplicationTableHistoryToStorage,
} from './services/multiplicationHistoryDatabase';
import {
  appendActivityRecordToStorage,
  buildLearningActivityRecord,
  buildMultiplicationActivityRecord,
  readActivityRecordsFromStorage,
} from './services/activityDatabase';
import {
  calculateRewardStars,
  readRewardSettingsFromStorage,
  writeRewardSettingsToStorage,
} from './services/rewardSettingsDatabase';
import type { RewardExerciseKey, RewardSettings } from './services/rewardSettingsDatabase';
import './styles/tokens.css';
import './styles/base.css';
import './styles/child-app.css';

type ChildPage = 'home' | 'path' | 'rewards' | 'reading' | 'multiplication' | 'dictation' | 'poetry' | 'profile' | 'database' | 'settings';

type NavItem = {
  id: ChildPage;
  label: string;
  icon: typeof Home;
};

type ProfileRole = 'eleve' | 'parent';

type ProfileProgressItem = {
  subject: string;
  value: number;
};

type ProfileMission = {
  title: string;
  description?: string;
  exercisesCount?: number;
};

type ChildProfileConfig = {
  id: string;
  name: string;
  avatarEmoji: string;
  avatarPhotoUrl: string;
  avatarColor?: string;
  profileColor?: string;
  age?: number;
  role: ProfileRole;
  schoolLevel: string;
  stars?: number;
  badges?: number;
  streakDays?: number;
  progress?: ProfileProgressItem[];
  currentMission?: ProfileMission;
};

type NewProfileForm = {
  name: string;
  avatarPhotoUrl: string;
  age: string;
  role: ProfileRole;
  schoolLevel: string;
  profileColor: string;
};

type FamilyIllustrationVariant = 'house' | 'garden' | 'stars';

type FamilySettings = {
  name: string;
  illustration: FamilyIllustrationVariant;
};

type ExerciseHistoryStatus = 'success' | 'partial' | 'needs_review';

type ExerciseHistoryModule = 'reading' | 'multiplication' | 'dictation' | 'poetry';

type ProfileExerciseHistoryRecord = {
  id: string;
  profileId: string;
  module: ExerciseHistoryModule;
  moduleLabel: string;
  exercise: string;
  resultLabel: string;
  status: ExerciseHistoryStatus;
  details: string;
  dateIso: string;
};

type ProfileExerciseHistoryMap = Record<string, ProfileExerciseHistoryRecord[]>;

type FamilyActivityStat = {
  profileId: string;
  day: string;
  minutes: number;
  stars: number;
  exercisesBySubject: Record<string, number>;
};

type FamilyActivityHistoryRow = {
  id: string;
  profileId: string;
  profileName: string;
  activity: string;
  subject: string;
  dateIso: string;
  resultPercent: number;
};

type ProfileActivityData = {
  stats: FamilyActivityStat[];
  historyRows: FamilyActivityHistoryRow[];
  hasStoredActivities: boolean;
};

type HistorySortKey = 'profile' | 'activity' | 'subject' | 'date' | 'result';
type SortDirection = 'asc' | 'desc';

type ActivityFilters = {
  profileId: string;
  activity: string;
  subject: string;
  periodDays: string;
};

const FAMILY_NAME = 'Famille Nedelec';
const FAMILY_LEVEL = 7;
const PROFILE_COLOR_PALETTE = ['#6D5DFC', '#F25CA2', '#7A8AA0', '#20B486', '#4E7DFF', '#FF8A4C'];
const STUDENT_PROFILE_COLOR_PALETTE = ['#6D5DFC', '#F25CA2', '#20B486', '#4E7DFF', '#FF8A4C', '#F5B400'];
const FAMILY_ILLUSTRATION_OPTIONS: Array<{ id: FamilyIllustrationVariant; label: string }> = [
  { id: 'house', label: 'Maison' },
  { id: 'garden', label: 'Jardin' },
  { id: 'stars', label: 'Étoiles' },
];
const ACTIVITY_SUBJECTS = ['Mathématiques', 'Français', 'Poésie', 'Lecture'];
const DEFAULT_HISTORY_PAGE_SIZE = 10;
const ACTIVITY_CHART_HEIGHT_PX = 96;

function formatChartAxisTick(value: number) {
  return value.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
}

function getRecentDayLabels(days: number) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - 1 - index));
    return date.toISOString().slice(0, 10);
  });
}

function formatActivityDay(day: string) {
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' }).format(new Date(`${day}T12:00:00`));
}

function formatActivityChartDay(day: string) {
  const label = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(new Date(`${day}T12:00:00`));
  return label.replace('.', '').slice(0, 3);
}

function buildFamilyActivityStats(children: ChildProfileConfig[], periodDays: number): FamilyActivityStat[] {
  const days = getRecentDayLabels(periodDays);
  return children.flatMap((profile, profileIndex) =>
    days.map((day, dayIndex) => {
      const base = profileIndex + 1;
      return {
        profileId: profile.id,
        day,
        minutes: ((dayIndex + base) % 4 === 0 ? 0 : 12 + base * 6 + (dayIndex % 3) * 7),
        stars: ((dayIndex + base) % 3 === 0 ? 1 + profileIndex : 3 + profileIndex + (dayIndex % 2)),
        exercisesBySubject: {
          Mathématiques: 1 + ((dayIndex + base) % 3),
          Français: 1 + ((dayIndex + profileIndex) % 2),
          'Histoire-Géo': (dayIndex + base) % 2,
          Sciences: dayIndex % 3 === 0 ? 1 : 0,
        },
      };
    }),
  );
}

function getLastConnectionLabel(profileId: string, stats: FamilyActivityStat[]) {
  const latest = [...stats]
    .filter((item) => item.profileId === profileId && item.minutes > 0)
    .sort((a, b) => b.day.localeCompare(a.day))[0];
  return latest ? formatActivityDay(latest.day) : 'Aucune connexion récente';
}

function buildFamilyHistoryRows(profiles: ChildProfileConfig[]): FamilyActivityHistoryRow[] {
  const profileById = profiles.reduce<Record<string, ChildProfileConfig>>((lookup, profile) => {
    lookup[profile.id] = profile;
    return lookup;
  }, {});
  const rows = [
    { id: 'h1', profileId: 'emma-demo', activity: 'Fractions niveau 1', subject: 'Mathématiques', dateIso: '2026-06-12T08:45:00.000Z', resultPercent: 92 },
    { id: 'h2', profileId: 'louane-demo', activity: 'Lecture courte du renard', subject: 'Français', dateIso: '2026-06-11T17:20:00.000Z', resultPercent: 78 },
    { id: 'h3', profileId: 'emma-demo', activity: 'Dictée des mots doux', subject: 'Français', dateIso: '2026-06-11T08:10:00.000Z', resultPercent: 86 },
    { id: 'h4', profileId: 'louane-demo', activity: 'Additions rapides', subject: 'Mathématiques', dateIso: '2026-06-10T18:05:00.000Z', resultPercent: 64 },
    { id: 'h5', profileId: 'emma-demo', activity: 'Carte des régions', subject: 'Histoire-Géo', dateIso: '2026-06-09T18:40:00.000Z', resultPercent: 74 },
    { id: 'h6', profileId: 'louane-demo', activity: 'Découverte des plantes', subject: 'Sciences', dateIso: '2026-06-08T16:15:00.000Z', resultPercent: 88 },
    { id: 'h7', profileId: 'emma-demo', activity: 'Tables de 7', subject: 'Mathématiques', dateIso: '2026-06-07T09:00:00.000Z', resultPercent: 100 },
  ];

  return rows
    .map((row) => {
      const profile = profileById[row.profileId];
      if (!profile) return null;
      return { ...row, profileName: profile.name };
    })
    .filter((row): row is FamilyActivityHistoryRow => row !== null);
}

function getActivitySubjectLabel(module: StoredActivityModule) {
  const labels: Record<StoredActivityModule, string> = {
    multiplication: 'Mathématiques',
    dictation: 'Français',
    poetry: 'Poésie',
    reading: 'Lecture',
  };
  return labels[module];
}

function buildProfileActivityData(profiles: ChildProfileConfig[], students: ChildProfileConfig[], periodDays: number): ProfileActivityData {
  const records = readActivityRecordsFromStorage();
  if (records.length === 0) {
    return {
      stats: buildFamilyActivityStats(students, periodDays),
      historyRows: buildFamilyHistoryRows(profiles),
      hasStoredActivities: false,
    };
  }

  const profileById = profiles.reduce<Record<string, ChildProfileConfig>>((lookup, profile) => {
    lookup[profile.id] = profile;
    return lookup;
  }, {});
  const days = getRecentDayLabels(periodDays);
  const daySet = new Set(days);
  const statsByKey = new Map<string, FamilyActivityStat>();

  students.forEach((profile) => {
    days.forEach((day) => {
      statsByKey.set(`${profile.id}-${day}`, {
        profileId: profile.id,
        day,
        minutes: 0,
        stars: 0,
        exercisesBySubject: {},
      });
    });
  });

  records.forEach((record) => {
    const day = record.completedAtIso.slice(0, 10);
    if (!daySet.has(day) || !profileById[record.profileId] || profileById[record.profileId]?.role !== 'eleve') return;
    const key = `${record.profileId}-${day}`;
    const stat = statsByKey.get(key);
    if (!stat) return;
    const subject = getActivitySubjectLabel(record.module);
    const durationMinutes = record.durationSeconds > 0 ? Math.max(1, Math.round(record.durationSeconds / 60)) : 0;
    stat.minutes += durationMinutes;
    stat.stars += record.starsEarned;
    stat.exercisesBySubject[subject] = (stat.exercisesBySubject[subject] ?? 0) + 1;
  });

  const historyRows = records
    .filter((record) => Boolean(profileById[record.profileId]))
    .map((record) => ({
      id: record.id,
      profileId: record.profileId,
      profileName: profileById[record.profileId]?.name ?? record.profileName,
      activity: record.exerciseLabel,
      subject: getActivitySubjectLabel(record.module),
      dateIso: record.completedAtIso,
      resultPercent: Math.round((record.score / Math.max(1, record.totalQuestions)) * 100),
    }));

  return {
    stats: Array.from(statsByKey.values()),
    historyRows,
    hasStoredActivities: true,
  };
}

function compareHistoryRows(a: FamilyActivityHistoryRow, b: FamilyActivityHistoryRow, key: HistorySortKey) {
  if (key === 'profile') return a.profileName.localeCompare(b.profileName, 'fr');
  if (key === 'activity') return a.activity.localeCompare(b.activity, 'fr');
  if (key === 'subject') return a.subject.localeCompare(b.subject, 'fr');
  if (key === 'date') return Date.parse(a.dateIso) - Date.parse(b.dateIso);
  return a.resultPercent - b.resultPercent;
}


function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function formatHistoryDateTime(isoDate: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(isoDate)).replace(',', '');
}

type DictationCorrectionMode = 'off' | 'line' | 'advanced';

const LLAMA_DICTATION_PROMPT_STORAGE_KEY = 'devoirs.wordDictation.llamaPrompt';
const PROFILE_EXERCISE_HISTORY_STORAGE_KEY = 'devoirs.profileExerciseHistory.v1';
const SCHOOL_LEVEL_OPTIONS = ['CP', 'CE1', 'CE2', 'CM1', 'CM2', '6e', '5e', '4e', '3e'];
const MAX_HISTORY_BY_PROFILE = 120;
const MULTIPLICATION_REVIEW_FACTORS = [2, 3, 4, 5, 6, 7, 8, 9, 10];
const dictationWordTokenRegex = /[A-Za-zÀ-ÖØ-öø-ÿ0-9'-]+/g;

function extractDictationWords(text: string) {
  return Array.from(text.matchAll(dictationWordTokenRegex), (match) => match[0]);
}

const PROFILE_PHOTO_OPTIONS = (() => {
  const assets = import.meta.glob('./assets/profile-photos/*.{png,jpg,jpeg,webp}', {
    eager: true,
    query: '?url',
    import: 'default',
  }) as Record<string, string>;

  return Object.entries(assets)
    .map(([filePath, url]) => ({
      id: filePath.split('/').at(-1) ?? filePath,
      label: filePath.split('/').at(-1)?.replace(/\.[^.]+$/, '') ?? 'Photo',
      url,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
})();

const PROFILE_STORAGE_KEY = 'devoirs.childProfiles.v1';
const ACTIVE_PROFILE_ID_KEY = 'devoirs.activeProfileId.v1';
const FAMILY_SETTINGS_STORAGE_KEY = 'devoirs.familySettings.v1';

const DEFAULT_FAMILY_PROFILES: ChildProfileConfig[] = [
  {
    id: 'emma-demo',
    name: 'Emma',
    avatarEmoji: '🧒',
    avatarPhotoUrl: '',
    avatarColor: 'linear-gradient(135deg, #6D5DFC, #4E7DFF)',
    profileColor: '#6D5DFC',
    age: 9,
    role: 'eleve',
    schoolLevel: 'CM1',
    stars: 125,
    badges: 8,
    streakDays: 5,
    progress: [
      { subject: 'Mathématiques', value: 72 },
      { subject: 'Français', value: 88 },
      { subject: 'Histoire-Géo', value: 65 },
    ],
    currentMission: {
      title: 'Réviser les fractions',
      description: 'Mission courte pour consolider les bases.',
      exercisesCount: 5,
    },
  },
  {
    id: 'louane-demo',
    name: 'Louane',
    avatarEmoji: '👧',
    avatarPhotoUrl: '',
    avatarColor: 'linear-gradient(135deg, #FF6B4A, #FFC83D)',
    profileColor: '#F25CA2',
    age: 7,
    role: 'eleve',
    schoolLevel: 'CE1',
    stars: 135,
    badges: 4,
    streakDays: 3,
    progress: [
      { subject: 'Mathématiques', value: 64 },
      { subject: 'Français', value: 78 },
      { subject: 'Histoire-Géo', value: 52 },
    ],
    currentMission: {
      title: 'Lire une histoire courte',
      description: 'Comprendre les personnages et le lieu.',
      exercisesCount: 4,
    },
  },
  {
    id: 'adrien-parent',
    name: 'Adrien',
    avatarEmoji: '👨',
    avatarPhotoUrl: adrienProfilePhotoUrl,
    profileColor: '#7A8AA0',
    role: 'parent',
    schoolLevel: '',
    stars: 80,
    badges: 0,
    streakDays: 0,
  },
];

const FALLBACK_PROFILE: ChildProfileConfig = DEFAULT_FAMILY_PROFILES[0]!;
const DEFAULT_ADRIEN_PROFILE = DEFAULT_FAMILY_PROFILES.find((profile) => profile.id === 'adrien-parent')!;
const DASHBOARD_CHILD_ID = FALLBACK_PROFILE.id;
const MOCK_LEARNING_SERVICE_CHILD_ID = DASHBOARD_CHILD_ID;

function getDefaultProfileColor(profileId: string, name: string, role: ProfileRole) {
  if (profileId === 'emma-demo' || name.trim().toLowerCase() === 'emma') return '#6D5DFC';
  if (profileId === 'louane-demo' || name.trim().toLowerCase() === 'louane') return '#F25CA2';
  if (profileId === 'adrien-parent' || role === 'parent') return '#7A8AA0';
  const seed = Array.from(`${profileId}-${name}`).reduce((total, char) => total + char.charCodeAt(0), 0);
  return PROFILE_COLOR_PALETTE[seed % PROFILE_COLOR_PALETTE.length]!;
}

function getProfileColor(profile: ChildProfileConfig) {
  return profile.profileColor || getDefaultProfileColor(profile.id, profile.name, profile.role);
}

function ProfileColorDot({ profile, className = '' }: { profile: ChildProfileConfig; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`profile-color-dot ${className}`.trim()}
      data-testid={`profile-color-dot-${profile.id}`}
      style={{ background: getProfileColor(profile) }}
    />
  );
}

function applyFamilyProfileMigrations(profiles: ChildProfileConfig[]) {
  const hasAdrienProfile = profiles.some((profile) =>
    profile.id === DEFAULT_ADRIEN_PROFILE.id || profile.name.trim().toLowerCase() === 'adrien',
  );
  const migratedProfiles = hasAdrienProfile ? profiles : [...profiles, DEFAULT_ADRIEN_PROFILE];

  return migratedProfiles.map((profile) => {
    if (profile.id === DEFAULT_ADRIEN_PROFILE.id || profile.name.trim().toLowerCase() === 'adrien') {
      return { ...profile, avatarPhotoUrl: adrienProfilePhotoUrl, profileColor: profile.profileColor || getDefaultProfileColor(profile.id, profile.name, 'parent') };
    }

    return { ...profile, profileColor: profile.profileColor || getDefaultProfileColor(profile.id, profile.name, profile.role) };
  });
}

function normalizeProfile(rawProfile: unknown): ChildProfileConfig | null {
  if (typeof rawProfile !== 'object' || rawProfile === null) return null;

  const candidate = rawProfile as Partial<ChildProfileConfig & { age: unknown; }>;
  const id = typeof candidate.id === 'string' && candidate.id.trim().length > 0 ? candidate.id.trim() : cryptoSafeId();
  const name = typeof candidate.name === 'string' && candidate.name.trim().length > 0 ? candidate.name.trim() : FALLBACK_PROFILE.name;
  const avatarEmoji = typeof candidate.avatarEmoji === 'string' && candidate.avatarEmoji.trim().length > 0
    ? candidate.avatarEmoji.trim()
    : FALLBACK_PROFILE.avatarEmoji;
  let avatarPhotoUrl = typeof candidate.avatarPhotoUrl === 'string' ? candidate.avatarPhotoUrl : FALLBACK_PROFILE.avatarPhotoUrl;
  if (id === 'adrien-parent' && avatarPhotoUrl.trim().length === 0) {
    avatarPhotoUrl = adrienProfilePhotoUrl;
  }
  const avatarColor = typeof candidate.avatarColor === 'string' && candidate.avatarColor.trim().length > 0
    ? candidate.avatarColor.trim()
    : undefined;
  const role = candidate.role === 'parent' ? 'parent' : 'eleve';
  const profileColor = typeof candidate.profileColor === 'string' && candidate.profileColor.trim().length > 0
    ? candidate.profileColor.trim()
    : getDefaultProfileColor(id, name, role);

  const parsedAge =
    typeof candidate.age === 'number'
      ? candidate.age
      : typeof candidate.age === 'string'
        ? Number(candidate.age)
        : Number.NaN;
  const age = Number.isFinite(parsedAge) && parsedAge > 0 && parsedAge <= 120 ? Math.max(3, Math.floor(parsedAge)) : undefined;
  const schoolLevel = role === 'parent'
    ? ''
    : typeof candidate.schoolLevel === 'string' && candidate.schoolLevel.trim().length > 0
      ? candidate.schoolLevel.trim()
      : FALLBACK_PROFILE.schoolLevel;
  const stars = Number.isFinite(Number(candidate.stars)) ? Math.max(0, Math.floor(Number(candidate.stars))) : 0;
  const badges = Number.isFinite(Number(candidate.badges)) ? Math.max(0, Math.floor(Number(candidate.badges))) : 0;
  const streakDays = Number.isFinite(Number(candidate.streakDays)) ? Math.max(0, Math.floor(Number(candidate.streakDays))) : 0;
  const progress = Array.isArray(candidate.progress)
    ? candidate.progress
        .filter((item): item is ProfileProgressItem =>
          typeof item === 'object'
          && item !== null
          && typeof item.subject === 'string'
          && item.subject.trim().length > 0
          && Number.isFinite(Number(item.value)),
        )
        .map((item) => ({ subject: item.subject.trim(), value: Math.min(100, Math.max(0, Math.round(Number(item.value)))) }))
    : undefined;
  const currentMission = candidate.currentMission && typeof candidate.currentMission === 'object'
    ? {
        title: typeof candidate.currentMission.title === 'string' && candidate.currentMission.title.trim().length > 0
          ? candidate.currentMission.title.trim()
          : 'Continuer l’aventure',
        description: typeof candidate.currentMission.description === 'string' ? candidate.currentMission.description : undefined,
        exercisesCount: Number.isFinite(Number(candidate.currentMission.exercisesCount))
          ? Math.max(0, Math.floor(Number(candidate.currentMission.exercisesCount)))
          : undefined,
      }
    : undefined;

  return {
    id,
    name,
    avatarEmoji,
    avatarPhotoUrl,
    avatarColor,
    profileColor,
    age: role === 'eleve' ? age ?? FALLBACK_PROFILE.age : age,
    role,
    schoolLevel,
    stars,
    badges,
    streakDays,
    progress,
    currentMission,
  };
}

function cryptoSafeId() {
  return `profile-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function readProfilesFromStorage(): ChildProfileConfig[] {
  if (typeof window === 'undefined') return applyFamilyProfileMigrations(DEFAULT_FAMILY_PROFILES);

  try {
    const stored = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!stored) return applyFamilyProfileMigrations(DEFAULT_FAMILY_PROFILES);

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return applyFamilyProfileMigrations(DEFAULT_FAMILY_PROFILES);

    const seenIds = new Set<string>();
    const profiles: ChildProfileConfig[] = [];

    for (const raw of parsed) {
      const normalized = normalizeProfile(raw);
      if (!normalized) continue;

      const uniqueId = seenIds.has(normalized.id)
        ? `${normalized.id}-${cryptoSafeId()}`
        : normalized.id;
      const profileId = uniqueId;
      seenIds.add(profileId);
      profiles.push({ ...normalized, id: profileId });
    }

    return applyFamilyProfileMigrations(profiles.length > 0 ? profiles : DEFAULT_FAMILY_PROFILES);
  } catch {
    return applyFamilyProfileMigrations(DEFAULT_FAMILY_PROFILES);
  }
}

function readActiveProfileIdFromStorage(fallbackId: string): string {
  if (typeof window === 'undefined') return fallbackId;

  try {
    const value = window.localStorage.getItem(ACTIVE_PROFILE_ID_KEY);
    return value && value.trim().length > 0 ? value : fallbackId;
  } catch {
    return fallbackId;
  }
}

function writeProfilesToStorage(profiles: ChildProfileConfig[]) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles));
  } catch {
    // Ignore write failures (for restrictive browser modes).
  }
}

function writeActiveProfileIdToStorage(profileId: string) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(ACTIVE_PROFILE_ID_KEY, profileId);
  } catch {
    // Ignore storage failures for compatibility.
  }
}

function readSessionStateFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;

  try {
    const stored = window.sessionStorage.getItem(key);
    return stored ? JSON.parse(stored) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeSessionStateToStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Temporary exercise drafts are best-effort only.
  }
}

function removeSessionStateFromStorage(key: string) {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Ignore restrictive browser modes.
  }
}

function useSessionStorageState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => readSessionStateFromStorage(key, fallback));

  useEffect(() => {
    writeSessionStateToStorage(key, value);
  }, [key, value]);

  return [value, setValue] as const;
}

function mergeProfileIntoDashboard(dashboard: ChildDashboard, profile: ChildProfileConfig): ChildDashboard {
  return {
    ...dashboard,
    child: {
      ...dashboard.child,
      id: profile.id,
      firstName: profile.name,
      avatarEmoji: profile.avatarEmoji,
      stars: profile.stars ?? dashboard.child.stars,
      streakDays: profile.streakDays ?? dashboard.child.streakDays,
    },
  };
}

function getDefaultProfileForm(profile?: ChildProfileConfig, role: ProfileRole = 'eleve'): NewProfileForm {
  const selectedRole = profile?.role ?? role;
  return {
    name: profile?.name ?? '',
    avatarPhotoUrl: profile?.avatarPhotoUrl ?? '',
    age: profile?.age ? String(profile.age) : '',
    role: selectedRole,
    schoolLevel: selectedRole === 'parent'
      ? ''
      : (profile?.schoolLevel ?? FALLBACK_PROFILE.schoolLevel),
    profileColor: profile?.profileColor ?? getDefaultProfileColor(profile?.id ?? '', profile?.name ?? '', selectedRole),
  };
}

function getDefaultProgressForRole(role: ProfileRole): ProfileProgressItem[] | undefined {
  if (role === 'parent') return undefined;
  return [
    { subject: 'Mathématiques', value: 45 },
    { subject: 'Français', value: 50 },
    { subject: 'Histoire-Géo', value: 35 },
  ];
}

function normalizeProfilePayload(profile: Omit<ChildProfileConfig, 'id'>): Omit<ChildProfileConfig, 'id'> {
  const role = profile.role === 'parent' ? 'parent' : 'eleve';
  const age = Number(profile.age);
  const safeAge = Number.isFinite(age) && age > 0 && age <= 120 ? Math.max(3, Math.floor(age)) : undefined;
  return {
    name: profile.name.trim() || FALLBACK_PROFILE.name,
    avatarEmoji: profile.avatarEmoji || (role === 'parent' ? '👤' : FALLBACK_PROFILE.avatarEmoji),
    avatarPhotoUrl: sanitizeProfilePhotoUrl(profile.avatarPhotoUrl),
    avatarColor: profile.avatarColor || (role === 'parent' ? 'linear-gradient(135deg, #332A7C, #6D5DFC)' : 'linear-gradient(135deg, #6D5DFC, #4E7DFF)'),
    profileColor: profile.profileColor || getDefaultProfileColor('', profile.name, role),
    age: role === 'eleve' ? safeAge ?? FALLBACK_PROFILE.age : safeAge,
    role,
    schoolLevel: role === 'parent' ? '' : profile.schoolLevel || FALLBACK_PROFILE.schoolLevel,
    stars: Math.max(0, Math.floor(Number(profile.stars ?? 0))),
    badges: Math.max(0, Math.floor(Number(profile.badges ?? 0))),
    streakDays: Math.max(0, Math.floor(Number(profile.streakDays ?? 0))),
    progress: profile.progress ?? getDefaultProgressForRole(role),
    currentMission: profile.currentMission ?? (role === 'eleve'
      ? { title: 'Nouvelle mission', description: 'Démarrer un parcours personnalisé.', exercisesCount: 3 }
      : undefined),
  };
}

function buildProfilePayloadFromForm(state: NewProfileForm): Omit<ChildProfileConfig, 'id'> {
  const normalizedSchoolLevel = state.role === 'parent' ? '' : state.schoolLevel.trim();
  const safeSchoolLevel = SCHOOL_LEVEL_OPTIONS.includes(normalizedSchoolLevel)
    ? normalizedSchoolLevel
    : FALLBACK_PROFILE.schoolLevel;

  return normalizeProfilePayload({
    name: state.name.trim(),
    avatarEmoji: state.role === 'parent' ? '👤' : FALLBACK_PROFILE.avatarEmoji,
    avatarPhotoUrl: sanitizeProfilePhotoUrl(state.avatarPhotoUrl),
    age: state.role === 'parent' && state.age.trim().length === 0 ? undefined : Number(state.age),
    role: state.role,
    schoolLevel: safeSchoolLevel,
    profileColor: state.profileColor,
    stars: 0,
    badges: 0,
    streakDays: 0,
  });
}

function getDefaultFamilySettings(): FamilySettings {
  return { name: FAMILY_NAME, illustration: 'house' };
}

function normalizeFamilySettings(candidate: unknown): FamilySettings {
  if (typeof candidate !== 'object' || candidate === null) return getDefaultFamilySettings();
  const raw = candidate as Partial<FamilySettings>;
  const name = typeof raw.name === 'string' && raw.name.trim().length > 0 ? raw.name.trim() : FAMILY_NAME;
  const illustration = FAMILY_ILLUSTRATION_OPTIONS.some((option) => option.id === raw.illustration) ? raw.illustration! : 'house';
  return { name, illustration };
}

function readFamilySettingsFromStorage(): FamilySettings {
  if (typeof window === 'undefined') return getDefaultFamilySettings();

  try {
    const stored = window.localStorage.getItem(FAMILY_SETTINGS_STORAGE_KEY);
    return stored ? normalizeFamilySettings(JSON.parse(stored)) : getDefaultFamilySettings();
  } catch {
    return getDefaultFamilySettings();
  }
}

function writeFamilySettingsToStorage(settings: FamilySettings) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(FAMILY_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage failures for compatibility.
  }
}

function sanitizeProfilePhotoUrl(photoUrl: string) {
  if (typeof photoUrl !== 'string') return '';
  return photoUrl.trim();
}

function getProfileSummaryText(profile: ChildProfileConfig) {
  return {
    title: profile.role === 'eleve' && profile.age ? `${profile.name} (${profile.age} ans)` : profile.name,
    subtitle: profile.role === 'eleve'
      ? `${profile.schoolLevel || 'Niveau non défini'} • ${profile.age ?? '?'} ans`
      : 'Parent',
  };
}

function shouldShowSchoolField(role: ProfileRole) {
  return role === 'eleve';
}

function readProfileExerciseHistoryFromStorage(): ProfileExerciseHistoryMap {
  if (typeof window === 'undefined') return {};

  try {
    const stored = window.localStorage.getItem(PROFILE_EXERCISE_HISTORY_STORAGE_KEY);
    if (!stored) return {};

    const parsed = JSON.parse(stored);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};

    const history: ProfileExerciseHistoryMap = {};

    for (const profileId of Object.keys(parsed)) {
      const rawList = parsed[profileId];
      if (!Array.isArray(rawList)) continue;

      const normalized = rawList
        .map((raw) => {
          if (typeof raw !== 'object' || raw === null) return null;
          const candidate = raw as Partial<ProfileExerciseHistoryRecord>;
          const module =
            candidate.module === 'reading' || candidate.module === 'multiplication' || candidate.module === 'dictation' || candidate.module === 'poetry'
              ? candidate.module
              : null;
          const status =
            candidate.status === 'success' || candidate.status === 'needs_review' || candidate.status === 'partial'
              ? candidate.status
              : 'partial';
          if (!module) return null;

          const dateIso =
            typeof candidate.dateIso === 'string' && Number.isFinite(Date.parse(candidate.dateIso))
              ? candidate.dateIso
              : new Date().toISOString();

          return {
            id: typeof candidate.id === 'string' && candidate.id.length > 0 ? candidate.id : cryptoSafeId(),
            profileId: typeof candidate.profileId === 'string' && candidate.profileId.length > 0 ? candidate.profileId : profileId,
            module,
            moduleLabel: typeof candidate.moduleLabel === 'string' && candidate.moduleLabel.length > 0
              ? candidate.moduleLabel
              : module,
            exercise: typeof candidate.exercise === 'string' && candidate.exercise.length > 0
              ? candidate.exercise
              : 'Exercice',
            resultLabel: typeof candidate.resultLabel === 'string' && candidate.resultLabel.length > 0
              ? candidate.resultLabel
              : '—',
            status,
            details: typeof candidate.details === 'string' && candidate.details.length > 0
              ? candidate.details
              : '—',
            dateIso,
          };
        })
        .filter((entry): entry is ProfileExerciseHistoryRecord => entry !== null)
        .sort((left, right) => Date.parse(right.dateIso) - Date.parse(left.dateIso));

      history[profileId] = normalized;
    }

    return history;
  } catch {
    return {};
  }
}

function writeProfileExerciseHistoryToStorage(history: ProfileExerciseHistoryMap) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(PROFILE_EXERCISE_HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Ignore storage failures.
  }
}

function addProfileHistoryRecord(
  history: ProfileExerciseHistoryMap,
  profileId: string,
  payload: {
    module: ExerciseHistoryModule;
    moduleLabel: string;
    exercise: string;
    resultLabel: string;
    status: ExerciseHistoryStatus;
    details: string;
  },
): ProfileExerciseHistoryMap {
  const previous = history[profileId] ?? [];
  const nextEntry: ProfileExerciseHistoryRecord = {
    id: cryptoSafeId(),
    profileId,
    module: payload.module,
    moduleLabel: payload.moduleLabel,
    exercise: payload.exercise,
    resultLabel: payload.resultLabel,
    status: payload.status,
    details: payload.details,
    dateIso: new Date().toISOString(),
  };

  return {
    ...history,
    [profileId]: [nextEntry, ...previous].slice(0, MAX_HISTORY_BY_PROFILE),
  };
}

function getHistoryStatusLabel(status: ExerciseHistoryStatus) {
  if (status === 'success') return 'Terminé';
  if (status === 'needs_review') return 'À revoir';
  return 'Partiel';
}

function getHistoryStatusClass(status: ExerciseHistoryStatus) {
  if (status === 'success') return 'success';
  if (status === 'needs_review') return 'time';
  return 'retry';
}

function getSavedLlamaDictationPrompt() {
  if (typeof window === 'undefined') return null;

  try {
    const savedPrompt = window.localStorage.getItem(LLAMA_DICTATION_PROMPT_STORAGE_KEY);
    if (savedPrompt && /TITRE\s*:|DICTEE\s*:|DICTÉE\s*:/iu.test(savedPrompt)) {
      window.localStorage.removeItem(LLAMA_DICTATION_PROMPT_STORAGE_KEY);
      return null;
    }
    return savedPrompt && savedPrompt.trim().length > 0 ? savedPrompt : null;
  } catch {
    return null;
  }
}

function saveLlamaDictationPrompt(prompt: string) {
  if (typeof window === 'undefined') return;

  try {
    if (prompt.trim().length === 0) {
      window.localStorage.removeItem(LLAMA_DICTATION_PROMPT_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(LLAMA_DICTATION_PROMPT_STORAGE_KEY, prompt);
  } catch {
    // LocalStorage can be unavailable in restricted browsers; prompt editing should still work for the current session.
  }
}

function clearSavedLlamaDictationPrompt() {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(LLAMA_DICTATION_PROMPT_STORAGE_KEY);
  } catch {
    // Ignore storage failures and keep the in-memory default prompt reset.
  }
}

function splitPoetryTextIntoLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function maskPoetryLine(line: string): string {
  return line
    .split('')
    .map((char) => (char.trim() === '' ? char : '•'))
    .join('');
}

type ChildWordDictationFeedbackWord = {
  actual: string;
  expected: string;
  hasError: boolean;
};

type ChildWordDictationFeedbackLine = {
  actualLine: string;
  expectedLine: string;
  hasError: boolean;
  words: ChildWordDictationFeedbackWord[];
};

type ChildWordDictationReview = {
  mistakeCount: number;
  lines: ChildWordDictationFeedbackLine[];
};

type DictationHelpLevel = 'none' | 'line' | 'word';
type DictationPlaybackSpeed = 'slow' | 'medium' | 'fast';

const DICTATION_FAST_PLAYBACK_RATE = 0.72;
const DICTATION_MEDIUM_WORD_PAUSE_MS = 1200;
const DICTATION_SLOW_WORD_PAUSE_MS = 3000;

const DICTATION_PLAYBACK_SPEEDS: Array<{ value: DictationPlaybackSpeed; label: string; helper: string }> = [
  { value: 'slow', label: 'Lent', helper: 'tempo enfant très lent' },
  { value: 'medium', label: 'Moyen', helper: 'tempo enfant ralenti' },
  { value: 'fast', label: 'Rapide', helper: 'vitesse actuelle' },
];

function getDictationPlaybackWordPauseMs(speed: DictationPlaybackSpeed): number {
  if (speed === 'slow') return DICTATION_SLOW_WORD_PAUSE_MS;
  if (speed === 'medium') return DICTATION_MEDIUM_WORD_PAUSE_MS;
  return 0;
}

function getDictationPlaybackRate(speed: DictationPlaybackSpeed): number {
  return speed === 'fast' ? DICTATION_FAST_PLAYBACK_RATE : DICTATION_FAST_PLAYBACK_RATE;
}

function splitTextForDictationWords(text: string): string[] {
  return text.trim().match(/\S+/g) ?? [];
}

function buildDictationTextFromWordRange(words: string[], startIndex: number, endIndex: number): string {
  return words.slice(startIndex, endIndex).join(' ');
}

function getDictationWordIndexFromBoundary(words: string[], charIndex: number): number {
  let cursor = 0;

  for (let index = 0; index < words.length; index += 1) {
    const start = cursor;
    const end = start + words[index].length;
    if (charIndex >= start && charIndex <= end) return index;
    cursor = end + 1;
  }

  return Math.max(0, words.length - 1);
}

function normalizeWordDictationAnswerToken(token: string): string {
  return token.toLocaleLowerCase('fr-FR').replace(/^[^\p{L}\p{M}\p{N}]+|[^\p{L}\p{M}\p{N}]+$/gu, '');
}

function splitWordDictationLines(text: string): string[] {
  return text.split(/\r?\n/);
}

type DictationReviewToken = {
  raw: string;
  normalized: string;
  lineIndex: number;
};

type DictationReviewOperation = {
  type: 'match' | 'substitute' | 'insert' | 'delete';
  expected?: DictationReviewToken;
  actual?: DictationReviewToken;
  actualIndex: number;
};

function extractDictationReviewTokens(text: string): DictationReviewToken[] {
  return splitWordDictationLines(text).flatMap((line, lineIndex) => splitTextForDictationWords(line).map((raw) => ({
    raw,
    normalized: normalizeWordDictationAnswerToken(raw),
    lineIndex,
  })));
}

function alignDictationReviewTokens(expectedTokens: DictationReviewToken[], actualTokens: DictationReviewToken[]): DictationReviewOperation[] {
  const rowCount = expectedTokens.length + 1;
  const columnCount = actualTokens.length + 1;
  const distances = Array.from({ length: rowCount }, () => Array.from({ length: columnCount }, () => 0));

  for (let expectedIndex = 0; expectedIndex < rowCount; expectedIndex += 1) distances[expectedIndex][0] = expectedIndex;
  for (let actualIndex = 0; actualIndex < columnCount; actualIndex += 1) distances[0][actualIndex] = actualIndex;

  for (let expectedIndex = 1; expectedIndex < rowCount; expectedIndex += 1) {
    for (let actualIndex = 1; actualIndex < columnCount; actualIndex += 1) {
      const substitutionCost = expectedTokens[expectedIndex - 1].normalized === actualTokens[actualIndex - 1].normalized ? 0 : 1;
      distances[expectedIndex][actualIndex] = Math.min(
        distances[expectedIndex - 1][actualIndex] + 1,
        distances[expectedIndex][actualIndex - 1] + 1,
        distances[expectedIndex - 1][actualIndex - 1] + substitutionCost,
      );
    }
  }

  const operations: DictationReviewOperation[] = [];
  let expectedIndex = expectedTokens.length;
  let actualIndex = actualTokens.length;

  while (expectedIndex > 0 || actualIndex > 0) {
    const expectedToken = expectedTokens[expectedIndex - 1];
    const actualToken = actualTokens[actualIndex - 1];

    if (expectedIndex > 0 && actualIndex > 0) {
      const substitutionCost = expectedToken.normalized === actualToken.normalized ? 0 : 1;
      if (distances[expectedIndex][actualIndex] === distances[expectedIndex - 1][actualIndex - 1] + substitutionCost) {
        operations.push({
          type: substitutionCost === 0 ? 'match' : 'substitute',
          expected: expectedToken,
          actual: actualToken,
          actualIndex: actualIndex - 1,
        });
        expectedIndex -= 1;
        actualIndex -= 1;
        continue;
      }
    }

    if (expectedIndex > 0 && distances[expectedIndex][actualIndex] === distances[expectedIndex - 1][actualIndex] + 1) {
      operations.push({
        type: 'delete',
        expected: expectedToken,
        actualIndex,
      });
      expectedIndex -= 1;
      continue;
    }

    if (actualIndex > 0) {
      operations.push({
        type: 'insert',
        actual: actualToken,
        actualIndex: actualIndex - 1,
      });
      actualIndex -= 1;
    }
  }

  return operations.reverse();
}

function getLineIndexForMissingDictationWord(operation: DictationReviewOperation, actualTokens: DictationReviewToken[], fallbackLineCount: number): number {
  const previousActualToken = operation.actualIndex > 0 ? actualTokens[operation.actualIndex - 1] : undefined;
  const nextActualToken = actualTokens[operation.actualIndex];
  return Math.min(
    Math.max(previousActualToken?.lineIndex ?? nextActualToken?.lineIndex ?? 0, 0),
    Math.max(fallbackLineCount - 1, 0),
  );
}

function buildChildWordDictationReview(expectedText: string, answerText: string): ChildWordDictationReview {
  const answerLines = splitWordDictationLines(answerText);
  const lineCount = Math.max(answerLines.length, 1);
  const lines: ChildWordDictationFeedbackLine[] = Array.from({ length: lineCount }, (_, lineIndex) => ({
    actualLine: answerLines[lineIndex] ?? '',
    expectedLine: '',
    hasError: false,
    words: [],
  }));
  const expectedTokens = extractDictationReviewTokens(expectedText);
  const actualTokens = extractDictationReviewTokens(answerText);
  const operations = alignDictationReviewTokens(expectedTokens, actualTokens);
  let mistakeCount = 0;

  operations.forEach((operation) => {
    const hasError = operation.type !== 'match';
    const lineIndex = operation.actual
      ? Math.min(Math.max(operation.actual.lineIndex, 0), lineCount - 1)
      : getLineIndexForMissingDictationWord(operation, actualTokens, lineCount);

    if (hasError) {
      mistakeCount += 1;
      lines[lineIndex].hasError = true;
    }

    lines[lineIndex].words.push({
      actual: operation.actual?.raw ?? '',
      expected: operation.expected?.raw ?? '',
      hasError,
    });
  });

  return { mistakeCount, lines };
}

function maskDictationText(text: string): string {
  return text
    .split('')
    .map((char) => (char.trim() === '' ? char : '•'))
    .join('');
}

const navItems: NavItem[] = [
  { id: 'home', label: 'Accueil', icon: Home },
  { id: 'path', label: 'Parcours', icon: MapIcon },
  { id: 'rewards', label: 'Récompenses', icon: Gift },
  { id: 'reading', label: 'Lecture', icon: BookOpen },
  { id: 'multiplication', label: 'Tables', icon: Sparkles },
  { id: 'dictation', label: 'Dictée', icon: PencilLine },
  { id: 'poetry', label: 'Poésie', icon: Mic },
  { id: 'profile', label: 'Profil', icon: UserRound },
  { id: 'database', label: 'Base de données', icon: Database },
  { id: 'settings', label: 'Paramétrage', icon: Settings },
];

function LoadingDots() {
  return (
    <span className="loading-dots" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="progress-bar" aria-label={`Progression ${Math.round(value)}%`}>
      <span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

function ChildTopBar({ dashboard, title }: { dashboard: ChildDashboard; title?: string }) {
  return (
    <header className="child-topbar">
      <div className="avatar-bubble" aria-hidden="true">{dashboard.child.avatarEmoji}</div>
      <div>
        <p className="eyebrow">Niveau {dashboard.child.level} · {dashboard.child.title}</p>
        <h1>{title ?? `Bonjour ${dashboard.child.firstName} ! 👋`}</h1>
      </div>
    </header>
  );
}

function routeForSubject(subject: string): ChildPage {
  if (subject === 'reading') return 'reading';
  if (subject === 'multiplication') return 'multiplication';
  if (subject === 'dictation') return 'dictation';
  if (subject === 'poetry') return 'poetry';
  return 'path';
}

function HomeView({ dashboard, onNavigate }: { dashboard: ChildDashboard; onNavigate: (page: ChildPage) => void }) {
  return (
    <main className="child-main">
      <ChildTopBar dashboard={dashboard} />

      <section className="hero-card cockpit-hero">
        <div>
          <p className="eyebrow">Cockpit du jour</p>
          <h2>{dashboard.welcomeMessage}</h2>
          <p>Prête à apprendre et à progresser ? La mascotte te propose une mission simple et positive.</p>
        </div>
        <div className="hero-stats">
          <strong>{dashboard.progress.objectivesCompleted}</strong>
          <span>objectifs atteints</span>
        </div>
      </section>

      <section className="daily-goal-card primary-mission" aria-labelledby="primary-mission-title">
        <div>
          <p className="eyebrow">Mon objectif du jour</p>
          <p className="eyebrow">{dashboard.primaryMission.title}</p>
          <h2 id="primary-mission-title">{dashboard.primaryMission.description}</h2>
          <ProgressBar value={(dashboard.dailyGoal.currentCount / dashboard.dailyGoal.targetCount) * 100} />
          <p>{dashboard.dailyGoal.currentCount} / {dashboard.dailyGoal.targetCount} activités · +{dashboard.primaryMission.rewardStars} étoiles</p>
          <button className="primary-action" type="button" onClick={() => onNavigate(routeForSubject(dashboard.primaryMission.subject))}>
            {dashboard.primaryMission.ctaLabel}
          </button>
        </div>
        <div className="mascot-tip">🦉<span>Encore une mission et ton objectif est réussi !</span></div>
      </section>

      <section>
        <div className="section-heading">
          <p className="eyebrow">Mes activités</p>
          <h2>Choisis ta prochaine mission</h2>
        </div>
        <div className="activity-grid">
          {dashboard.activities.map((activity) => (
            <article className="activity-card" key={activity.id}>
              <div className="activity-icon" aria-hidden="true">{activity.icon}</div>
              <div>
                <h3>{activity.title}</h3>
                <p>{activity.description}</p>
                <ProgressBar value={activity.progressPercent} />
                <span className="activity-meta">{activity.progressPercent}% · +{activity.rewardStars} étoiles</span>
              </div>
              <button onClick={() => onNavigate(routeForSubject(activity.subject))}>Continuer</button>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-columns">
        <div className="card-panel">
          <p className="eyebrow">Badges récents</p>
          <div className="badge-row">
            {dashboard.recentBadges.map((badge) => (
              <div className="badge" key={badge.id}><span>{badge.icon}</span>{badge.title}</div>
            ))}
          </div>
        </div>
        {dashboard.activeChallenge ? (
          <div className="card-panel challenge-card">
            <p className="eyebrow">Défi en cours</p>
            <h3>{dashboard.activeChallenge.title}</h3>
            <p>{dashboard.activeChallenge.description}</p>
            <ProgressBar value={(dashboard.activeChallenge.currentCount / dashboard.activeChallenge.targetCount) * 100} />
            <span>{dashboard.activeChallenge.currentCount} / {dashboard.activeChallenge.targetCount} défis</span>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function LearningPathView({ dashboard }: { dashboard: ChildDashboard }) {
  return (
    <main className="child-main">
      <ChildTopBar dashboard={dashboard} title="Mon parcours" />
      <section className="page-card path-hero">
        <p className="eyebrow">Aventure pédagogique</p>
        <h2>Chaque étape te rapproche de la réussite !</h2>
        <p>Avance monde après monde. Les étapes complétées débloquent de nouveaux badges adaptés à ton niveau.</p>
        <ProgressBar value={dashboard.progress.percent} />
      </section>
      <section className="path-grid world-map" aria-label="Mondes du parcours">
        {dashboard.learningWorlds.map((world, index) => (
          <article className={`path-step ${world.status}`} key={world.id}>
            <span className="step-number">{index + 1}</span>
            <span className="step-icon" aria-hidden="true">{world.icon}</span>
            <h3>{world.title}</h3>
            <p>{world.description}</p>
            <strong>{world.status === 'locked' ? 'À débloquer' : `${world.unlockedBadges} badge(s)`}</strong>
            <ProgressBar value={world.progressPercent} />
          </article>
        ))}
      </section>
    </main>
  );
}

function RewardsView({ dashboard }: { dashboard: ChildDashboard }) {
  return (
    <main className="child-main">
      <ChildTopBar dashboard={dashboard} title="Mes récompenses" />
      <section className="page-card rewards-hero">
        <p className="eyebrow">Niveau {dashboard.child.level}</p>
        <h2>{dashboard.child.title}</h2>
        <p>Boutique magique : continue tes missions pour débloquer badges, accessoires et surprises.</p>
        <ProgressBar value={68} />
      </section>
      <section className="reward-grid" aria-label="Boutique magique">
        {dashboard.rewardShelf.map((reward) => (
          <article className={`reward-card ${reward.status}`} key={reward.id}>
            <span aria-hidden="true">{reward.icon}</span>
            <h3>{reward.title}</h3>
            <p>{reward.description}</p>
            <strong>{reward.status === 'locked' ? 'Verrouillé' : 'Débloqué'} · {reward.costStars} ⭐</strong>
          </article>
        ))}
      </section>
      <section className="card-panel reward-history" aria-label="Historique des étoiles">
        <p className="eyebrow">Historique récent</p>
        {dashboard.rewardHistory.map((event) => (
          <article key={event.id}>
            <strong>{event.title}</strong>
            <p>{event.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

function ReadingView({
  dashboard,
  onRecordExercise,
}: {
  dashboard: ChildDashboard;
  onRecordExercise: (payload: {
    module: ExerciseHistoryModule;
    moduleLabel: string;
    exercise: string;
    resultLabel: string;
    status: ExerciseHistoryStatus;
    details: string;
  }) => void;
}) {
  const [sessionState, setSessionState] = useState<ApiState<ReadingSession>>({ status: 'loading' });
  const exerciseDraftKey = `devoirs.exerciseDraft.${dashboard.child.id}.reading`;
  const [answers, setAnswers] = useSessionStorageState<Record<string, string>>(`${exerciseDraftKey}.answers`, {});
  const [resultState, setResultState] = useSessionStorageState<ApiState<ReadingAnswerResult> | null>(`${exerciseDraftKey}.resultState`, null);

  useEffect(() => {
    let cancelled = false;
    getReadingSession(MOCK_LEARNING_SERVICE_CHILD_ID)
      .then((session) => {
        if (!cancelled) setSessionState({ status: 'success', data: session });
      })
      .catch((error: unknown) => {
        if (!cancelled) setSessionState({ status: 'error', message: error instanceof Error ? error.message : 'Impossible de charger la lecture.' });
      });
    return () => { cancelled = true; };
  }, [dashboard.child.id]);

  async function validateReading() {
    if (sessionState.status !== 'success') return;
    setResultState({ status: 'loading' });
    try {
      const result = await submitReadingAnswers(MOCK_LEARNING_SERVICE_CHILD_ID, {
        sessionId: sessionState.data.id,
        answers: sessionState.data.questions.map((question) => ({ questionId: question.id, selectedOptionId: answers[question.id] ?? '' })),
      });
      const starsEarned = calculateRewardStars('reading', result.correctAnswers, result.totalQuestions - result.correctAnswers);
      setResultState({ status: 'success', data: result });
      appendActivityRecordToStorage(buildLearningActivityRecord({
        profileId: dashboard.child.id,
        profileName: dashboard.child.firstName,
        module: 'reading',
        moduleLabel: 'Lecture',
        exerciseLabel: sessionState.data.title,
        score: result.correctAnswers,
        totalQuestions: result.totalQuestions,
        correctCount: result.correctAnswers,
        wrongCount: result.totalQuestions - result.correctAnswers,
        starsEarned,
        status: result.correctAnswers === result.totalQuestions ? 'completed' : 'partial',
        details: { sessionId: sessionState.data.id, feedbackTitle: result.feedbackTitle },
      }));
      onRecordExercise({
        module: 'reading',
        moduleLabel: 'Lecture',
        exercise: sessionState.data.title,
        resultLabel: `${result.correctAnswers}/${result.totalQuestions}`,
        details: `${starsEarned} étoile${starsEarned > 1 ? 's' : ''}`,
        status: result.correctAnswers === result.totalQuestions ? 'success' : 'partial',
      });
    } catch (error: unknown) {
      setResultState({ status: 'error', message: error instanceof Error ? error.message : 'Lecture impossible à valider.' });
    }
  }

  return (
    <main className="child-main">
      <ChildTopBar dashboard={dashboard} title="Lecture" />
      {sessionState.status === 'loading' ? <div className="state-card">Préparation de l’histoire…</div> : null}
      {sessionState.status === 'error' ? <div className="state-card error">{sessionState.message}</div> : null}
      {sessionState.status === 'success' ? (
        <>
          <section className="language-card reading-card" aria-labelledby="reading-title">
            <div className="language-mascot" aria-hidden="true">📖</div>
            <div>
              <p className="eyebrow">Mission compréhension</p>
              <h2 id="reading-title">{sessionState.data.title}</h2>
              <p>{sessionState.data.instruction}</p>
              <button className="audio-button" type="button">🔊 {sessionState.data.audioLabel}</button>
              <div className="story-lines">
                {sessionState.data.text.map((line) => <p key={line}>{line}</p>)}
              </div>
            </div>
          </section>
          <section className="quiz-stack" aria-label="Questions de compréhension">
            {sessionState.data.questions.map((question) => (
              <article className="quiz-card" key={question.id}>
                <h3>{question.prompt}</h3>
                <div className="answer-grid compact">
                  {question.options.map((option, index) => (
                    <button
                      className={answers[question.id] === question.optionIds[index] ? 'selected' : ''}
                      key={option}
                      onClick={() => setAnswers((current) => ({ ...current, [question.id]: question.optionIds[index] }))}
                      type="button"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </article>
            ))}
            <button className="primary-action" type="button" onClick={validateReading}>Valider ma compréhension</button>
            {resultState?.status === 'loading' ? <p className="feedback-card">La mascotte relit tes réponses…</p> : null}
            {resultState?.status === 'error' ? <p className="feedback-card error">{resultState.message}</p> : null}
            {resultState?.status === 'success' ? (
              <div className="feedback-card success">
                <h3>{resultState.data.feedbackTitle}</h3>
                <p>{resultState.data.feedbackMessage}</p>
              </div>
            ) : null}
          </section>
        </>
      ) : null}
    </main>
  );
}

function MultiplicationView({
  dashboard,
  onRecordExercise,
}: {
  dashboard: ChildDashboard;
  onRecordExercise: (payload: {
    module: ExerciseHistoryModule;
    moduleLabel: string;
    exercise: string;
    resultLabel: string;
    status: ExerciseHistoryStatus;
    details: string;
  }) => void;
}) {
  const [sessionState, setSessionState] = useState<ApiState<MultiplicationSession>>({ status: 'loading' });
  const exerciseDraftKey = `devoirs.exerciseDraft.${dashboard.child.id}.multiplication`;
  const [questionIndex, setQuestionIndex] = useSessionStorageState(`${exerciseDraftKey}.questionIndex`, 0);
  const [answerState, setAnswerState] = useState<ApiState<MultiplicationAnswerResult> | null>(null);
  const [firstTryByQuestion, setFirstTryByQuestion] = useSessionStorageState<Record<string, boolean>>(`${exerciseDraftKey}.firstTryByQuestion`, {});
  const [attemptHistory, setAttemptHistory] = useSessionStorageState<MultiplicationAttemptRecord[]>(`${exerciseDraftKey}.attemptHistory`, []);
  const [completedTableHistory, setCompletedTableHistory] = useState<CompletedMultiplicationTable[]>(() => readMultiplicationTableHistoryFromStorage());
  const [timerStartedAt, setTimerStartedAt] = useSessionStorageState<number | null>(`${exerciseDraftKey}.timerStartedAt`, null);
  const [elapsedSeconds, setElapsedSeconds] = useSessionStorageState(`${exerciseDraftKey}.elapsedSeconds`, 0);

  useEffect(() => {
    let cancelled = false;
    getMultiplicationSession(DASHBOARD_CHILD_ID)
      .then((session) => {
        if (!cancelled) setSessionState({ status: 'success', data: session });
      })
      .catch((error: unknown) => {
        if (!cancelled) setSessionState({ status: 'error', message: error instanceof Error ? error.message : 'Impossible de charger les tables.' });
      });
    return () => { cancelled = true; };
  }, [dashboard.child.id]);

  useEffect(() => {
    if (!timerStartedAt || answerState?.status === 'success' && Boolean(answerState.data.sessionSummary)) return;
    const intervalId = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - timerStartedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [answerState, timerStartedAt]);

  const currentQuestion = sessionState.status === 'success' ? sessionState.data.questions[questionIndex] : null;
  const finalScore = attemptHistory.reduce((score, record) => score + record.scorePoint, 0);
  const goodAnswerCount = attemptHistory.filter((record) => record.scorePoint === 1).length;
  const activeTable = sessionState.status === 'success' ? sessionState.data.selectedTable : 7;

  function getTableFactClass(factor: number) {
    const record = attemptHistory.find((item) => item.rightFactor === factor);
    if (!record) return currentQuestion?.rightFactor === factor ? 'active' : 'pending';
    return record.scorePoint === 0 ? 'missed' : 'mastered';
  }

  function buildTableFacts(session: MultiplicationSession, history: MultiplicationAttemptRecord[] = attemptHistory): MultiplicationTableReviewFact[] {
    return MULTIPLICATION_REVIEW_FACTORS.map((rightFactor) => {
      return {
        rightFactor,
        line: `${rightFactor} × ${session.selectedTable} = ${session.selectedTable * rightFactor}`,
        status: history.find((item) => item.rightFactor === rightFactor)?.scorePoint === 0 ? 'missed' : 'mastered',
      };
    });
  }

  async function answerQuestion(selectedAnswer: number) {
    if (!currentQuestion || answerState?.status === 'success' && Boolean(answerState.data.sessionSummary)) return;
    const startedAt = timerStartedAt ?? Date.now();
    if (!timerStartedAt) {
      setTimerStartedAt(startedAt);
      setElapsedSeconds(0);
    }
    setAnswerState({ status: 'loading' });
    const selectedAnswerIsCorrect = selectedAnswer === currentQuestion.leftFactor * currentQuestion.rightFactor;
    const isIntermediateCorrectAnswer = selectedAnswerIsCorrect && questionIndex < (sessionState.status === 'success' ? sessionState.data.totalQuestions - 1 : 0);
    if (isIntermediateCorrectAnswer) {
      const scoredFirstTry = firstTryByQuestion[currentQuestion.id] !== false;
      const optimisticAttemptHistory = [
        ...attemptHistory.filter((record) => record.questionId !== currentQuestion.id),
        {
          questionId: currentQuestion.id,
          leftFactor: currentQuestion.leftFactor,
          rightFactor: currentQuestion.rightFactor,
          correctAnswer: selectedAnswer,
          scorePoint: scoredFirstTry ? 1 : 0,
        },
      ];
      writeSessionStateToStorage(`${exerciseDraftKey}.attemptHistory`, optimisticAttemptHistory);
      writeSessionStateToStorage(`${exerciseDraftKey}.questionIndex`, questionIndex + 1);
    }
    try {
      const result = await submitMultiplicationAnswer(DASHBOARD_CHILD_ID, { questionId: currentQuestion.id, selectedAnswer });
      if (!result.isCorrect) {
        setFirstTryByQuestion((current) => ({ ...current, [currentQuestion.id]: false }));
        setAnswerState({ status: 'success', data: result });
        return;
      }

      const scoredFirstTry = firstTryByQuestion[currentQuestion.id] !== false;
      const attemptRecord: MultiplicationAttemptRecord = {
        questionId: currentQuestion.id,
        leftFactor: currentQuestion.leftFactor,
        rightFactor: currentQuestion.rightFactor,
        correctAnswer: result.correctAnswer,
        scorePoint: scoredFirstTry ? 1 : 0,
      };
      const nextHistory = [
        ...attemptHistory.filter((record) => record.questionId !== currentQuestion.id),
        attemptRecord,
      ];
      setAttemptHistory(nextHistory);

      if (!result.sessionSummary) {
        setAnswerState({ status: 'success', data: result });
        writeSessionStateToStorage(`${exerciseDraftKey}.questionIndex`, questionIndex + 1);
        window.setTimeout(() => {
          setAnswerState(null);
          setQuestionIndex((index) => index + 1);
        }, 60);
        return;
      }

      const score = nextHistory.reduce((total, record) => total + record.scorePoint, 0);
      const correctCount = nextHistory.filter((record) => record.scorePoint === 1).length;
      const wrongCount = sessionState.status === 'success' ? sessionState.data.totalQuestions - correctCount : 0;
      const durationSeconds = Math.max(1, Math.floor((Date.now() - startedAt) / 1000));
      const completedAtIso = new Date().toISOString();
      const startedAtIso = new Date(startedAt).toISOString();
      const facts = sessionState.status === 'success' ? buildTableFacts(sessionState.data, nextHistory) : [];
      const totalQuestions = sessionState.status === 'success' ? sessionState.data.totalQuestions : nextHistory.length;
      const starsEarned = calculateRewardStars('multiplication', score, wrongCount);
      setElapsedSeconds(durationSeconds);
      const historyEntry = {
        module: 'multiplication' as const,
        moduleLabel: 'Multiplication',
        exercise: `Table de ${currentQuestion.table}`,
        resultLabel: `${score}/${totalQuestions}`,
        status: wrongCount === 0 ? ('success' as const) : ('partial' as const),
        details: `${wrongCount} erreur${wrongCount > 1 ? 's' : ''} • ${formatDuration(durationSeconds)}`,
      };

      onRecordExercise(historyEntry);

      appendActivityRecordToStorage(buildMultiplicationActivityRecord({
        profileId: dashboard.child.id,
        profileName: dashboard.child.firstName,
        table: currentQuestion.table,
        score,
        totalQuestions,
        correctCount,
        wrongCount,
        durationSeconds,
        startedAtIso,
        completedAtIso,
        facts,
        starsEarned,
      }));

      const completedRecord: CompletedMultiplicationTable = {
        id: `${currentQuestion.table}-${Date.now()}`,
        childName: dashboard.child.firstName,
        table: currentQuestion.table,
        correctCount,
        wrongCount,
        score,
        totalQuestions,
        durationSeconds,
        completedAtIso,
        facts,
      };

      setCompletedTableHistory((current) => {
        const next = [completedRecord, ...current];
        writeMultiplicationTableHistoryToStorage(next);
        return next;
      });
      setAnswerState({ status: 'success', data: result });
    } catch (error: unknown) {
      setAnswerState({ status: 'error', message: error instanceof Error ? error.message : 'Réponse impossible à envoyer.' });
    }
  }

  async function selectTable(table: number) {
    setSessionState({ status: 'loading' });
    setQuestionIndex(0);
    setAnswerState(null);
    setFirstTryByQuestion({});
    setAttemptHistory([]);
    setTimerStartedAt(null);
    setElapsedSeconds(0);
    try {
      const session = await getMultiplicationSession(DASHBOARD_CHILD_ID, table);
      setSessionState({ status: 'success', data: session });
    } catch (error: unknown) {
      setSessionState({ status: 'error', message: error instanceof Error ? error.message : 'Impossible de charger cette table.' });
    }
  }

  return (
    <main className="multiplication-screen magical-math-screen child-main">
      {sessionState.status === 'loading' ? <div className="state-card">Préparation des tables…</div> : null}
      {sessionState.status === 'error' ? <div className="state-card error">{sessionState.message}</div> : null}
      {sessionState.status === 'success' && currentQuestion ? (
        <>
          <header className="math-magic-header">
            <div>
              <p className="eyebrow">Mission calcul magique</p>
              <h1>Tables de multiplication</h1>
              <p>Entraîne-toi et deviens un champion !</p>
            </div>
            <div className="math-star-card" aria-label={`${dashboard.child.stars} étoiles`}>
              <span aria-hidden="true">⭐</span>
              <strong>{dashboard.child.stars}</strong>
              <span>Étoiles</span>
            </div>
          </header>

          <section className="magic-table-selector" aria-label="Choisis une table">
            {sessionState.data.availableTables.map((table) => (
              <button
                aria-label={table.label}
                aria-pressed={sessionState.data.selectedTable === table.value}
                className={sessionState.data.selectedTable === table.value ? 'active' : ''}
                key={table.value}
                onClick={() => selectTable(table.value)}
                type="button"
              >
                {table.value}
              </button>
            ))}
          </section>

          <section className="math-progress-grid" aria-label="Progression des tables">
            <article className="math-progress-card">
              <div className="progress-icon" aria-hidden="true">🎯</div>
              <div>
                <p className="eyebrow">Objectif du jour</p>
                <h2>Réussis {sessionState.data.totalQuestions} calculs</h2>
                <ProgressBar value={(attemptHistory.length / sessionState.data.totalQuestions) * 100} />
                <strong>{attemptHistory.length} / {sessionState.data.totalQuestions}</strong>
              </div>
            </article>
            <article className="math-progress-card">
              <div className="progress-icon" aria-hidden="true">🏆</div>
              <div>
                <p className="eyebrow">Série actuelle</p>
                <h2>{goodAnswerCount} bonnes réponses</h2>
                <div className="streak-dots" aria-label={`${goodAnswerCount} bonnes réponses`}>
                  {Array.from({ length: 5 }, (_, index) => <span key={index}>{index < goodAnswerCount ? '✅' : '○'}</span>)}
                </div>
              </div>
            </article>
            <article className="math-progress-card">
              <div className="progress-icon level" aria-hidden="true">{dashboard.child.level}</div>
              <div>
                <p className="eyebrow">Niveau joueur</p>
                <h2>Niveau {dashboard.child.level}</h2>
                <p>{dashboard.child.title}</p>
                <ProgressBar value={68} />
                <strong>680 / 1000 XP</strong>
              </div>
            </article>
          </section>

          <section className="magic-exercise-card question-card magic-question-card" aria-labelledby="multiplication-question">
            <div className="character-stage">
              <div className="encouragement-bubble">Réponds à la question de la table de {activeTable}.<br />Tu es capable ! 💪</div>
              <div className="characters" aria-hidden="true">
                <div className="kid-character">🧒👍</div>
                <div className="robot-character">🤖</div>
              </div>
              <div className="treasure-chest" aria-hidden="true">🧰🪙</div>
              <aside className="help-card">
                <strong>💡 Aide</strong>
                <p>{activeTable} × {currentQuestion.rightFactor} = c'est {currentQuestion.rightFactor} groupes de {activeTable}.</p>
                <p>{Array.from({ length: currentQuestion.rightFactor }, () => activeTable).join(' + ')} = {activeTable * currentQuestion.rightFactor}</p>
              </aside>
              <aside className="timer-card" aria-label="Chronomètre de la table">
                <span aria-hidden="true">⏱️</span>
                <div>
                  <strong>Chronomètre</strong>
                  <p className="timer-value">{formatDuration(elapsedSeconds)}</p>
                  <small>{timerStartedAt ? 'Chrono lancé' : 'Démarre à la première réponse'}</small>
                </div>
              </aside>
            </div>

            <div className="calculation-panel">
              <div className="table-ribbon">Table de {activeTable}</div>
              <p className="eyebrow">Question {questionIndex + 1} sur {sessionState.data.totalQuestions}</p>
              <h2 id="multiplication-question">{currentQuestion.prompt}</h2>
              <ProgressBar value={((questionIndex + 1) / sessionState.data.totalQuestions) * 100} />
              <div className="answer-grid magic-answer-grid" aria-label="Choix de réponse">
                {currentQuestion.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => answerQuestion(option)}
                    disabled={answerState?.status === 'loading' || Boolean(answerState?.status === 'success' && answerState.data.sessionSummary)}
                    type="button"
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div className="table-progress-strip" aria-label={`Avancement de la table de ${activeTable}`}>
                {MULTIPLICATION_REVIEW_FACTORS.map((factor) => {
                  return <span className={getTableFactClass(factor)} key={factor}>{factor}×</span>;
                })}
              </div>
              {answerState?.status === 'loading' ? <p className="feedback-card">Le robot vérifie…</p> : null}
              {answerState?.status === 'error' ? <p className="feedback-card error">{answerState.message}</p> : null}
              {answerState?.status === 'success' && !answerState.data.sessionSummary ? (
                <div className={answerState.data.isCorrect ? 'instant-reward success' : 'instant-reward retry'}>
                  <strong>{answerState.data.isCorrect ? 'Correct !' : answerState.data.feedbackTitle}</strong>
                  <span>{answerState.data.isCorrect ? `⭐ +${answerState.data.earnedStars}` : answerState.data.feedbackMessage}</span>
                </div>
              ) : null}
              {answerState?.status === 'success' && answerState.data.sessionSummary ? (
                <div className="multiplication-final-summary feedback-card success">
                  <p><strong>{answerState.data.sessionSummary.title}</strong> {answerState.data.sessionSummary.message}</p>
                  <p className="score-pill">Score : {finalScore} / {sessionState.data.totalQuestions}</p>
                  <div className="full-table-review" aria-label="Table complète avec erreurs">
                    <h3>Table complète de {sessionState.data.selectedTable}</h3>
                    <ul>
                      {buildTableFacts(sessionState.data).map((fact) => (
                        <li className={fact.status} key={fact.rightFactor}>{fact.line}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
              <button className="listen-button" type="button">🔊 Écouter la question</button>
            </div>
          </section>

          <section className="multiplication-history-card" aria-labelledby="multiplication-history-title">
            <div className="section-heading compact">
              <p className="eyebrow">Carnet de progrès</p>
              <h2 id="multiplication-history-title">Historique des tables réalisées</h2>
              <p>Retrouve tes tables terminées, tes réponses justes, celles à revoir et ton score.</p>
            </div>
            <div className="multiplication-history-table-wrap">
              <table aria-label="Historique des tables réalisées" className="multiplication-history-table">
                <thead>
                  <tr>
                    <th scope="col">Élève</th>
                    <th scope="col">Table</th>
                    <th scope="col">Date et heure</th>
                    <th scope="col">Réponses justes</th>
                    <th scope="col">Réponses fausses</th>
                    <th scope="col">Score</th>
                    <th scope="col">Temps</th>
                    <th scope="col">Détail des calculs</th>
                  </tr>
                </thead>
                <tbody>
                  {completedTableHistory.length === 0 ? (
                    <tr>
                      <td colSpan={8}>Termine une table pour remplir ton historique magique ✨</td>
                    </tr>
                  ) : completedTableHistory.map((record) => (
                    <tr key={record.id}>
                      <td>{record.childName}</td>
                      <td>Table de {record.table}</td>
                      <td><span className="history-date-time">{formatHistoryDateTime(record.completedAtIso)}</span></td>
                      <td><span className="history-pill success">{record.correctCount} justes</span></td>
                      <td><span className="history-pill retry">{record.wrongCount} {record.wrongCount > 1 ? 'fausses' : 'fausse'}</span></td>
                      <td><strong>{record.score} / {record.totalQuestions}</strong></td>
                      <td><span className="history-pill time">{formatDuration(record.durationSeconds)}</span></td>
                      <td>
                        <div className="history-fact-list" aria-label={`Détail de la table de ${record.table}`}>
                          {record.facts.map((fact) => (
                            <span className={`history-fact ${fact.status}`} key={fact.rightFactor}>{fact.line}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}

function DictationView({
  dashboard,
  onRecordExercise,
}: {
  dashboard: ChildDashboard;
  onRecordExercise: (payload: {
    module: ExerciseHistoryModule;
    moduleLabel: string;
    exercise: string;
    resultLabel: string;
    status: ExerciseHistoryStatus;
    details: string;
  }) => void;
}) {
  const [sessionState, setSessionState] = useState<ApiState<DictationSession>>({ status: 'loading' });
  const exerciseDraftKey = `devoirs.exerciseDraft.${dashboard.child.id}.dictation`;
  const [dictationMode, setDictationMode] = useSessionStorageState<DictationMode>(`${exerciseDraftKey}.dictationMode`, 'word_dictation');
  const [wordSeries, setWordSeries] = useSessionStorageState(`${exerciseDraftKey}.wordSeries`, '');
  const [verbSeries, setVerbSeries] = useSessionStorageState(`${exerciseDraftKey}.verbSeries`, '');
  const [ocrState, setOcrState] = useSessionStorageState<ApiState<WordDictationOcrResult> | null>(`${exerciseDraftKey}.ocrState`, null);
  const [selectedVerbTenses, setSelectedVerbTenses] = useSessionStorageState<VerbTense[]>(`${exerciseDraftKey}.selectedVerbTenses`, []);
  const [confirmedUnknownWords, setConfirmedUnknownWords] = useSessionStorageState<string[]>(`${exerciseDraftKey}.confirmedUnknownWords`, []);
  const [pendingUnknownWords, setPendingUnknownWords] = useSessionStorageState<string[]>(`${exerciseDraftKey}.pendingUnknownWords`, []);
  const [generatedTextState, setGeneratedTextState] = useSessionStorageState<ApiState<WordDictationTextResult> | null>(`${exerciseDraftKey}.generatedTextState`, null);
  const [answerText, setAnswerText] = useSessionStorageState(`${exerciseDraftKey}.answerText`, '');
  const [answerState, setAnswerState] = useSessionStorageState<ApiState<DictationAnswerResult> | null>(`${exerciseDraftKey}.answerState`, null);
  const [dictationCorrectionMode, setDictationCorrectionMode] = useSessionStorageState<DictationCorrectionMode>(`${exerciseDraftKey}.correctionMode`, 'off');
  const [llamaPrompt, setLlamaPrompt] = useState(() => getSavedLlamaDictationPrompt() ?? getDefaultOllamaDictationPromptTemplate());
  const [isLlamaPromptAuto, setIsLlamaPromptAuto] = useState(() => getSavedLlamaDictationPrompt() === null);
  const [isLlamaPromptSaved, setIsLlamaPromptSaved] = useState(false);
  const [isGeneratedTextHidden, setIsGeneratedTextHidden] = useState(false);
  const [isReadingDictation, setIsReadingDictation] = useState(false);
  const [dictationWordCursor, setDictationWordCursor] = useSessionStorageState(`${exerciseDraftKey}.wordCursor`, 0);
  const [dictationPlaybackSpeed, setDictationPlaybackSpeed] = useSessionStorageState<DictationPlaybackSpeed>(`${exerciseDraftKey}.playbackSpeed`, 'fast');
  const [childWordDictationAnswer, setChildWordDictationAnswer] = useSessionStorageState(`${exerciseDraftKey}.childAnswer`, '');
  const [childWordDictationReview, setChildWordDictationReview] = useSessionStorageState<ChildWordDictationReview | null>(`${exerciseDraftKey}.childReview`, null);
  const [dictationHelpLevel, setDictationHelpLevel] = useSessionStorageState<DictationHelpLevel>(`${exerciseDraftKey}.helpLevel`, 'none');
  const dictationSpeechInstance = useRef<number>(0);
  const dictationPlaybackTimeouts = useRef<number[]>([]);

  const dictationWords = useMemo(
    () => (generatedTextState?.status === 'success' ? splitTextForDictationWords(generatedTextState.data.text) : []),
    [generatedTextState],
  );
  const dictationTotalWords = dictationWords.length;
  const dictationCursorPercent = dictationTotalWords === 0 ? 0 : Math.min(100, (Math.min(dictationWordCursor, dictationTotalWords) / dictationTotalWords) * 100);
  const childWordDictationWordCount = splitTextForDictationWords(childWordDictationAnswer).length;
  const isSpeechSynthesisSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const preparedWordSeries = useMemo(
    () => wordSeries
      .split(',')
      .map((word) => word.trim())
      .filter(Boolean),
    [wordSeries],
  );
  const preparedVerbSeries = useMemo(
    () => verbSeries
      .split(',')
      .map((word) => word.trim())
      .filter(Boolean),
    [verbSeries],
  );
  const llamaPromptPreview = useMemo(
    () => buildOllamaDictationPromptFromTemplate(
      llamaPrompt.trim() || getDefaultOllamaDictationPromptTemplate(),
      preparedWordSeries,
      preparedVerbSeries,
      selectedVerbTenses.length > 0 ? selectedVerbTenses : ['present'],
    ),
    [llamaPrompt, preparedWordSeries, preparedVerbSeries, selectedVerbTenses],
  );

  const dictationWordFeedback = answerState?.status === 'success' ? answerState.data.wordFeedback : [];

  const dictationCorrectionRows = useMemo(() => {
    if (answerState?.status !== 'success' || dictationCorrectionMode === 'off') return [];

    const lines = answerText.split(/\r?\n/);
    let feedbackCursor = 0;

    return lines.map((line) => {
      const wordsInLine = extractDictationWords(line);
      const lineFeedback = dictationWordFeedback.slice(feedbackCursor, feedbackCursor + wordsInLine.length);
      feedbackCursor += wordsInLine.length;

      return {
        line,
        hasMistake: lineFeedback.some((entry) => entry.status !== 'correct'),
      };
    });
  }, [answerState, answerText, dictationCorrectionMode, dictationWordFeedback]);

  const dictationHighlightedLines = useMemo(() => {
    if (answerState?.status !== 'success' || dictationCorrectionMode !== 'advanced') return [];

    let feedbackCursor = 0;
    return answerText.split(/\r?\n/).map((line, lineIndex) => {
      const lineWords = extractDictationWords(line);
      const lineFeedback = dictationWordFeedback.slice(feedbackCursor, feedbackCursor + lineWords.length);
      feedbackCursor += lineWords.length;

      const wordIndexes = line.matchAll(dictationWordTokenRegex);
      const parts: Array<string | ReactNode> = [];
      let cursor = 0;

      Array.from(wordIndexes).forEach((entry) => {
        const word = entry[0];
        const start = entry.index ?? 0;
        const status = lineFeedback.shift()?.status;
        const isIncorrect = Boolean(status && status !== 'correct');

        if (start > cursor) {
          parts.push(line.slice(cursor, start));
        }

        parts.push(isIncorrect
          ? <span className={`dictation-error-word ${status ?? ''}`}>{word}</span>
          : word);
        cursor = start + word.length;
      });

      if (cursor < line.length) {
        parts.push(line.slice(cursor));
      }

      return {
        line: parts,
        hasMistake: dictationCorrectionRows[lineIndex]?.hasMistake ?? false,
      };
    });
  }, [answerState, answerText, dictationCorrectionMode, dictationWordFeedback, dictationCorrectionRows]);

  useEffect(() => {
    let cancelled = false;
    getDictationSession(MOCK_LEARNING_SERVICE_CHILD_ID)
      .then((session) => {
        if (!cancelled) setSessionState({ status: 'success', data: session });
      })
      .catch((error: unknown) => {
        if (!cancelled) setSessionState({ status: 'error', message: error instanceof Error ? error.message : 'Impossible de charger la dictée.' });
      });
    return () => { cancelled = true; };
  }, [dashboard.child.id]);

  useEffect(() => {
    if (!isLlamaPromptAuto) return;
    setLlamaPrompt(getDefaultOllamaDictationPromptTemplate());
  }, [isLlamaPromptAuto, preparedWordSeries, preparedVerbSeries, selectedVerbTenses]);

  useEffect(() => {
    if (generatedTextState?.status !== 'success') {
      setIsReadingDictation(false);
      return;
    }

    setIsGeneratedTextHidden(false);
    setDictationWordCursor(0);
    setChildWordDictationAnswer('');
    setChildWordDictationReview(null);
    setDictationHelpLevel('none');

    if (dictationSpeechInstance.current) {
      dictationSpeechInstance.current += 1;
    }
    clearDictationPlaybackTimers();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [generatedTextState]);

  useEffect(() => {
    if (dictationMode !== 'word_dictation') {
      setIsReadingDictation(false);
      setDictationWordCursor(0);
      clearDictationPlaybackTimers();
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
  }, [dictationMode]);

  function toggleVerbTense(verbTense: VerbTense) {
    setSelectedVerbTenses((current) => current.includes(verbTense)
      ? current.filter((item) => item !== verbTense)
      : [...current, verbTense]);
  }

  async function handleWordSourceUpload(file: File | undefined) {
    if (!file) return;
    setOcrState({ status: 'loading' });
    try {
      const extractedText = file.type.startsWith('text/') ? await file.text() : '';
      const result = await extractWordDictationWordsFromOcr(MOCK_LEARNING_SERVICE_CHILD_ID, {
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        extractedText,
      });
      setWordSeries(result.words.join(', '));
      setPendingUnknownWords(result.unknownWords);
      setConfirmedUnknownWords((current) => current.filter((word) => result.words.includes(word)));
      if (!getSavedLlamaDictationPrompt()) setIsLlamaPromptAuto(true);
      setOcrState({ status: 'success', data: result });
    } catch (error: unknown) {
      setOcrState({ status: 'error', message: error instanceof Error ? error.message : 'OCR impossible pour ce document.' });
    }
  }

  function extractUnknownWordsFromError(message: string) {
    const [, rawWords = ''] = message.split(' : ');
    return rawWords.split(',').map((word) => word.trim()).filter(Boolean);
  }

  async function prepareWordDictationText(wordsConfirmedForGeneration = confirmedUnknownWords) {
    setGeneratedTextState({ status: 'loading' });
    try {
      const result = await generateWordDictationText(MOCK_LEARNING_SERVICE_CHILD_ID, {
        words: preparedWordSeries,
        verbTenses: selectedVerbTenses,
        verbs: preparedVerbSeries,
        confirmedUnknownWords: wordsConfirmedForGeneration,
        prompt: llamaPrompt.trim() || getDefaultOllamaDictationPromptTemplate(),
      });

      setPendingUnknownWords([]);
      setGeneratedTextState({ status: 'success', data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Texte impossible à préparer.';
      if (message.startsWith('Confirme ces mots avant de générer')) {
        setPendingUnknownWords(extractUnknownWordsFromError(message));
        setGeneratedTextState(null);
        return;
      }
      setGeneratedTextState({ status: 'error', message });
    }
  }

  async function confirmUnknownWordsAndGenerate() {
    const nextConfirmedWords = Array.from(new Set([...confirmedUnknownWords, ...pendingUnknownWords]));
    setConfirmedUnknownWords(nextConfirmedWords);
    setPendingUnknownWords([]);
    await prepareWordDictationText(nextConfirmedWords);
  }

  function clearDictationPlaybackTimers() {
    if (typeof window === 'undefined') {
      dictationPlaybackTimeouts.current = [];
      return;
    }

    dictationPlaybackTimeouts.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    dictationPlaybackTimeouts.current = [];
  }

  function stopDictationPlayback() {
    dictationSpeechInstance.current += 1;
    clearDictationPlaybackTimers();
    setIsReadingDictation(false);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  function speakDictationWordRange(startIndex: number, endIndex: number) {
    if (!isSpeechSynthesisSupported || dictationTotalWords === 0) return;

    const safeStartIndex = Math.min(Math.max(startIndex, 0), dictationTotalWords - 1);
    const safeEndIndex = Math.min(Math.max(endIndex, safeStartIndex + 1), dictationTotalWords);
    const textToRead = buildDictationTextFromWordRange(dictationWords, safeStartIndex, safeEndIndex);
    if (!textToRead) return;

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    clearDictationPlaybackTimers();

    const instanceId = dictationSpeechInstance.current + 1;
    dictationSpeechInstance.current = instanceId;
    setIsReadingDictation(true);
    setDictationWordCursor(safeStartIndex);

    const wordPauseMs = getDictationPlaybackWordPauseMs(dictationPlaybackSpeed);

    if (wordPauseMs === 0) {
      const wordsToRead = dictationWords.slice(safeStartIndex, safeEndIndex);
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = 'fr-FR';
      utterance.rate = getDictationPlaybackRate(dictationPlaybackSpeed);
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.onboundary = (event) => {
        if (instanceId !== dictationSpeechInstance.current) return;
        const wordIndexInRange = getDictationWordIndexFromBoundary(wordsToRead, event.charIndex);
        setDictationWordCursor(Math.min(safeStartIndex + wordIndexInRange, dictationTotalWords));
      };
      utterance.onend = () => {
        if (instanceId !== dictationSpeechInstance.current) return;
        setDictationWordCursor(safeEndIndex);
        setIsReadingDictation(false);
      };
      utterance.onerror = () => {
        if (instanceId !== dictationSpeechInstance.current) return;
        setIsReadingDictation(false);
      };

      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.speak(utterance);
      }
      return;
    }

    const speakWordAtIndex = (wordIndex: number) => {
      if (instanceId !== dictationSpeechInstance.current) return;
      if (wordIndex >= safeEndIndex) {
        setDictationWordCursor(safeEndIndex);
        setIsReadingDictation(false);
        return;
      }

      setDictationWordCursor(wordIndex);
      const utterance = new SpeechSynthesisUtterance(dictationWords[wordIndex]);
      utterance.lang = 'fr-FR';
      utterance.rate = getDictationPlaybackRate(dictationPlaybackSpeed);
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.onend = () => {
        if (instanceId !== dictationSpeechInstance.current) return;
        const nextWordIndex = wordIndex + 1;
        setDictationWordCursor(Math.min(nextWordIndex, dictationTotalWords));
        const timeoutId = window.setTimeout(() => {
          dictationPlaybackTimeouts.current = dictationPlaybackTimeouts.current.filter((id) => id !== timeoutId);
          speakWordAtIndex(nextWordIndex);
        }, wordPauseMs);
        dictationPlaybackTimeouts.current.push(timeoutId);
      };
      utterance.onerror = () => {
        if (instanceId !== dictationSpeechInstance.current) return;
        setIsReadingDictation(false);
      };

      window.speechSynthesis.speak(utterance);
    };

    speakWordAtIndex(safeStartIndex);
  }

  function startDictationPlayback() {
    const startIndex = dictationWordCursor >= dictationTotalWords ? 0 : dictationWordCursor;
    speakDictationWordRange(startIndex, dictationTotalWords);
  }

  function playNextFiveDictationWords() {
    const startIndex = dictationWordCursor >= dictationTotalWords ? 0 : dictationWordCursor;
    speakDictationWordRange(startIndex, Math.min(startIndex + 5, dictationTotalWords));
  }

  function handleDictationTrackSeek(nextCursor: number) {
    stopDictationPlayback();
    setDictationWordCursor(Math.min(Math.max(nextCursor, 0), dictationTotalWords));
  }

  function finishChildWordDictation() {
    if (generatedTextState?.status !== 'success') return;
    setChildWordDictationReview(buildChildWordDictationReview(generatedTextState.data.text, childWordDictationAnswer));
    setDictationHelpLevel('none');
  }

  function renderChildWordDictationReview() {
    if (!childWordDictationReview) return null;

    return (
      <div className="dictation-child-review" aria-label="Correction guidée de la dictée">
        {childWordDictationReview.lines.map((line, lineIndex) => (
          <p
            className={`dictation-line-help ${dictationHelpLevel === 'line' && line.hasError ? 'line-has-error' : ''}`}
            key={`child-dictation-line-${lineIndex}`}
          >
            {dictationHelpLevel === 'word'
              ? line.words.map((word, wordIndex) => (
                <span
                  className={word.hasError ? 'dictation-word-error-highlight' : ''}
                  key={`child-dictation-word-${lineIndex}-${wordIndex}`}
                >
                  {word.actual || '∅'}{wordIndex < line.words.length - 1 ? ' ' : ''}
                </span>
              ))
              : (line.actualLine || 'Ligne vide')}
          </p>
        ))}
      </div>
    );
  }

  function toggleGeneratedTextVisibility() {
    setIsGeneratedTextHidden((value) => !value);
  }

  async function correctDictation() {
    if (sessionState.status !== 'success') return;
    setAnswerState({ status: 'loading' });
    try {
      const result = await submitDictationAnswer(MOCK_LEARNING_SERVICE_CHILD_ID, { sessionId: sessionState.data.id, answerText });
      const starsEarned = calculateRewardStars('dictation', result.isCorrect ? 1 : 0, result.isCorrect ? 0 : 1);
      setAnswerState({ status: 'success', data: result });
      appendActivityRecordToStorage(buildLearningActivityRecord({
        profileId: dashboard.child.id,
        profileName: dashboard.child.firstName,
        module: 'dictation',
        moduleLabel: 'Dictée',
        exerciseLabel: sessionState.data.title,
        score: result.isCorrect ? 1 : 0,
        totalQuestions: 1,
        correctCount: result.isCorrect ? 1 : 0,
        wrongCount: result.isCorrect ? 0 : 1,
        starsEarned,
        status: result.isCorrect ? 'completed' : 'partial',
        details: { sessionId: sessionState.data.id, feedbackTitle: result.feedbackTitle },
      }));
      onRecordExercise({
        module: 'dictation',
        moduleLabel: 'Dictée',
        exercise: sessionState.data.title,
        resultLabel: result.isCorrect ? 'Bien' : 'À améliorer',
        status: result.isCorrect ? 'success' : 'needs_review',
        details: result.feedbackTitle,
      });
    } catch (error: unknown) {
      setAnswerState({ status: 'error', message: error instanceof Error ? error.message : 'Correction impossible.' });
    }
  }

  return (
    <main className="child-main">
      <ChildTopBar dashboard={dashboard} title="Dictée magique" />
      {sessionState.status === 'loading' ? <div className="state-card">Préparation de la dictée…</div> : null}
      {sessionState.status === 'error' ? <div className="state-card error">{sessionState.message}</div> : null}
      {sessionState.status === 'success' ? (
        <>
          <section className="dictation-mode-card" aria-label="Choix du type de dictée">
            <button aria-pressed={dictationMode === 'word_dictation'} className={dictationMode === 'word_dictation' ? 'active' : ''} onClick={() => setDictationMode('word_dictation')} type="button">
              <strong>Dictée de mots</strong>
              <span>Je saisis une série de mots, l’app prépare un texte court.</span>
            </button>
            <button aria-pressed={dictationMode === 'classic_dictation'} className={dictationMode === 'classic_dictation' ? 'active' : ''} onClick={() => setDictationMode('classic_dictation')} type="button">
              <strong>Dictée normale</strong>
              <span>Phrase classique avec correction mot par mot.</span>
            </button>
          </section>

          {dictationMode === 'word_dictation' ? (
            <section className="language-card dictation-card word-dictation-card" aria-labelledby="word-dictation-title">
              <div className="language-mascot" aria-hidden="true">🪄</div>
              <div>
                <p className="eyebrow">Préparation parent</p>
                <h2 id="word-dictation-title">Dictée de mots</h2>
                <p>Tape les mots à travailler. L’application prépare un texte court qui les contient tous, l’affiche au parent, puis place les contrôles de lecture et de vérification dessous.</p>
                <label className="answer-field">
                  <span>Série de mots (séparateur virgule)</span>
                  <textarea
                    placeholder="Ex. dragon, cartable, rivière"
                    value={wordSeries}
                    onChange={(event) => {
                      setWordSeries(event.target.value);
                      if (!getSavedLlamaDictationPrompt()) setIsLlamaPromptAuto(true);
                      setPendingUnknownWords([]);
                      setGeneratedTextState(null);
                    }}
                    rows={3}
                  />
                </label>
                <label className="answer-field">
                  <span>Verbes (séparateur virgule)</span>
                  <textarea
                    placeholder="Ex. cueillir, courir, découvrir"
                    value={verbSeries}
                    onChange={(event) => {
                      setVerbSeries(event.target.value);
                      if (!getSavedLlamaDictationPrompt()) setIsLlamaPromptAuto(true);
                      setGeneratedTextState(null);
                    }}
                    rows={3}
                  />
                </label>
                <div className="word-source-actions" aria-label="Import OCR des mots">
                  <label>
                    <span>📎 Importer un fichier</span>
                    <input
                      accept="image/*,.pdf,.txt,.doc,.docx"
                      aria-label="Importer un fichier"
                      onChange={(event) => void handleWordSourceUpload(event.currentTarget.files?.[0])}
                      type="file"
                    />
                  </label>
                  <label>
                    <span>📷 Prendre une photo</span>
                    <input
                      accept="image/*"
                      aria-label="Prendre une photo"
                      capture="environment"
                      onChange={(event) => void handleWordSourceUpload(event.currentTarget.files?.[0])}
                      type="file"
                    />
                  </label>
                </div>
                {ocrState?.status === 'loading' ? <p className="feedback-card">OCR en cours : le hibou lit les mots…</p> : null}
                {ocrState?.status === 'error' ? <p className="feedback-card error">{ocrState.message}</p> : null}
                {ocrState?.status === 'success' ? <p className="ocr-feedback">{ocrState.data.helperText}</p> : null}
                {pendingUnknownWords.length > 0 ? (
                  <div className="unknown-words-card" aria-label="Mots à confirmer">
                    <strong>Mot à confirmer</strong>
                    <p>Le hibou n’a pas trouvé ce mot dans son petit dictionnaire. Vérifie l’orthographe avant de continuer.</p>
                    <div className="word-checklist">
                      {pendingUnknownWords.map((word) => <span key={word}>{word}</span>)}
                    </div>
                    <button type="button" onClick={() => void confirmUnknownWordsAndGenerate()}>Confirmer et générer</button>
                  </div>
                ) : null}
                <div className="ollama-generation-note" aria-label="Moteur de génération Ollama">
                  <strong>IA locale Ollama</strong>
                  <span>llama3.1:8b sur http://127.0.0.1:11434. L’app vérifie ensuite que tous les mots sont présents une seule fois.</span>
                </div>
                <label className="answer-field llama-prompt-editor">
                  <span>Template du prompt Llama (éditable)</span>
                  <textarea
                    value={llamaPrompt}
                    onChange={(event) => {
                      const nextPrompt = event.target.value;
                      setLlamaPrompt(nextPrompt);
                      saveLlamaDictationPrompt(nextPrompt);
                      setIsLlamaPromptSaved(nextPrompt.trim().length > 0);
                      setIsLlamaPromptAuto(false);
                    }}
                    rows={8}
                  />
                  <small>Garde les balises {`{{mots}}`}, {`{{verbes}}`} et {`{{temps}}`} : elles sont remplacées juste avant l’appel Ollama.</small>
                  {isLlamaPromptSaved ? <small className="prompt-saved-confirmation">Nouveau prompt enregistré</small> : null}
                </label>
                <details className="llama-prompt-preview">
                  <summary>Aperçu réel envoyé à Ollama</summary>
                  <pre>{llamaPromptPreview}</pre>
                </details>
                <button
                  className="prompt-reset-button"
                  type="button"
                  onClick={() => {
                    clearSavedLlamaDictationPrompt();
                    setLlamaPrompt(getDefaultOllamaDictationPromptTemplate());
                    setIsLlamaPromptAuto(true);
                    setIsLlamaPromptSaved(false);
                  }}
                >
                  Réinitialiser le prompt par défaut
                </button>
                <fieldset className="verb-tense-options">
                  <legend>Temps des verbes</legend>
                  <p>Sélection multiple possible.</p>
                  <div>
                    {dictationVerbTenseOptions.map((option) => (
                      <label key={option.value}>
                        <input
                          checked={selectedVerbTenses.includes(option.value)}
                          onChange={() => toggleVerbTense(option.value)}
                          type="checkbox"
                        />
                        <span><strong>{option.label}</strong><small>{option.helper}</small></span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <button className="primary-action" type="button" onClick={() => void prepareWordDictationText()} disabled={generatedTextState?.status === 'loading'}>
                  {generatedTextState?.status === 'loading' ? <>Génération en cours <LoadingDots /></> : 'Générer le texte'}
                </button>
                {generatedTextState?.status === 'loading' ? <p className="feedback-card loading-feedback">Ollama écrit puis l’app vérifie les mots <LoadingDots /></p> : null}
                {generatedTextState?.status === 'error' ? <p className="feedback-card error">{generatedTextState.message}</p> : null}
                {generatedTextState?.status === 'success' ? (
                  <div className="generated-dictation-card" aria-label="Texte généré pour la dictée de mots">
                    <p className="eyebrow">{generatedTextState.data.title}</p>
                    <h3>Texte produit par Ollama</h3>
                    <button className="tertiary-action" onClick={toggleGeneratedTextVisibility} type="button">
                      {isGeneratedTextHidden ? 'Afficher le texte' : 'Masquer le texte'}
                    </button>
                    <p className={`generated-dictation-text ${isGeneratedTextHidden ? 'masked-dictation-text' : ''}`}>
                      {isGeneratedTextHidden
                        ? maskDictationText(generatedTextState.data.text)
                        : generatedTextState.data.text}
                    </p>
                    <div className="dictation-parent-controls" role="group" aria-label="Contrôles parent">
                      <p>{generatedTextState.data.readingInstruction}</p>
                      <div className="dictation-playback-controls">
                        <div className="dictation-audio-track" role="group" aria-label="Piste audio de dictée">
                          <div className="dictation-track-header">
                            <strong>
                              {dictationWordCursor >= dictationTotalWords && dictationTotalWords > 0
                                ? `Fin : ${dictationTotalWords}/${dictationTotalWords}`
                                : dictationTotalWords > 0
                                  ? `Mot ${dictationWordCursor + 1} sur ${dictationTotalWords}`
                                  : 'Aucun mot à lire'}
                            </strong>
                            <span>{dictationTotalWords} mots au total</span>
                          </div>
                          <div className="dictation-track-rail" aria-hidden="true">
                            {dictationWords.map((word, wordIndex) => (
                              <span
                                className="dictation-word-marker"
                                data-testid="dictation-word-marker"
                                key={`${word}-${wordIndex}`}
                                style={{ left: `${((wordIndex + 0.5) / Math.max(dictationTotalWords, 1)) * 100}%` }}
                              />
                            ))}
                            <span className="dictation-track-cursor" style={{ left: `${dictationCursorPercent}%` }} />
                          </div>
                          <input
                            aria-label="Déplacer le curseur sur la piste audio"
                            className="dictation-track-slider"
                            disabled={dictationTotalWords === 0}
                            max={dictationTotalWords}
                            min={0}
                            onChange={(event) => handleDictationTrackSeek(Number(event.currentTarget.value))}
                            type="range"
                            value={dictationWordCursor}
                          />
                        </div>
                        <div className="dictation-speed-controls" role="group" aria-label="Vitesse de lecture">
                          <strong>Vitesse de lecture</strong>
                          <div>
                            {DICTATION_PLAYBACK_SPEEDS.map((option) => (
                              <button
                                aria-label={option.label}
                                aria-pressed={dictationPlaybackSpeed === option.value}
                                className={dictationPlaybackSpeed === option.value ? 'active' : ''}
                                key={option.value}
                                onClick={() => {
                                  stopDictationPlayback();
                                  setDictationPlaybackSpeed(option.value);
                                }}
                                type="button"
                              >
                                <span>{option.label}</span>
                                <small>{option.helper}</small>
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="dictation-actions" role="group" aria-label="Contrôles de dictée">
                          <button
                            type="button"
                            onClick={stopDictationPlayback}
                            disabled={!isReadingDictation}
                          >
                            ⏹️ Stop
                          </button>
                          <button
                            className="audio-button"
                            type="button"
                            onClick={startDictationPlayback}
                            disabled={isReadingDictation || !isSpeechSynthesisSupported || dictationTotalWords === 0}
                          >
                            ▶️ Lire le texte à l’élève
                          </button>
                          <button
                            type="button"
                            onClick={playNextFiveDictationWords}
                            disabled={isReadingDictation || !isSpeechSynthesisSupported || dictationTotalWords === 0}
                          >
                            ▶️ Lire 5 mots par 5 mots
                          </button>
                        </div>
                        {!isSpeechSynthesisSupported ? <p className="feedback-card error">La lecture vocale n’est pas disponible dans ce navigateur.</p> : null}
                      </div>
                      <section className="dictation-child-writing-card" aria-label="Zone de réponse enfant">
                        <label className="answer-field">
                          <span>Zone d'écriture de l'enfant</span>
                          <textarea
                            autoCapitalize="off"
                            autoComplete="off"
                            autoCorrect="off"
                            className="child-dictation-answer"
                            onChange={(event) => {
                              setChildWordDictationAnswer(event.target.value);
                              setChildWordDictationReview(null);
                              setDictationHelpLevel('none');
                            }}
                            placeholder="Écris ici ce que tu entends…"
                            rows={6}
                            spellCheck={false}
                            value={childWordDictationAnswer}
                          />
                          <small className="child-dictation-word-counter" aria-live="polite">
                            {childWordDictationWordCount} {childWordDictationWordCount > 1 ? 'mots écrits' : 'mot écrit'}
                          </small>
                        </label>
                        <div className="dictation-child-actions" role="group" aria-label="Aides de correction enfant">
                          <button className="primary-action" type="button" onClick={finishChildWordDictation}>
                            J'ai fini
                          </button>
                          <button type="button" onClick={() => setDictationHelpLevel('line')} disabled={!childWordDictationReview}>
                            Aide niveau 1
                          </button>
                          <button type="button" onClick={() => setDictationHelpLevel('word')} disabled={!childWordDictationReview}>
                            Aide niveau 2
                          </button>
                        </div>
                        {childWordDictationReview ? (
                          <div className="dictation-child-result" aria-live="polite">
                            <strong>{childWordDictationReview.mistakeCount} {childWordDictationReview.mistakeCount > 1 ? 'fautes réalisées' : 'faute réalisée'}</strong>
                            <p>Aide niveau 1 colore les lignes à revoir. Aide niveau 2 colore les mots à corriger.</p>
                            {renderChildWordDictationReview()}
                          </div>
                        ) : null}
                      </section>
                    <div className={`feedback-card ${generatedTextState.data.controlResult.isValid ? 'success' : 'retry'}`} aria-label="État des contrôles automatiques">
<p>Contrôles : {generatedTextState.data.controlResult.isValid ? 'bons ✅' : 'mauvais ⚠️'}</p>
                          <div className="dictation-control-checks">
                            {generatedTextState.data.controlResult.checks.length > 0
                              ? generatedTextState.data.controlResult.checks.map((check) => <span key={check}>{check}</span>)
                              : <span>Tous les contrôles passent.</span>}
                          </div>
                        </div>
                        <div className="word-checklist" aria-label="Mots inclus">
                          {generatedTextState.data.wordChecklist.map((word) => <span key={word}>{word}</span>)}
                        </div>
                      </div>
                    <button type="button" onClick={() => void prepareWordDictationText()} className="secondary-action">
                      Relancer Ollama
                    </button>
                  </div>
                ) : null}
              </div>
            </section>
          ) : (
            <section className="language-card dictation-card" aria-labelledby="dictation-title">
              <div className="language-mascot" aria-hidden="true">✍️</div>
              <div>
                <p className="eyebrow">Mission orthographe</p>
                <h2 id="dictation-title">{sessionState.data.title}</h2>
                <p>{sessionState.data.instruction}</p>
                <button className="audio-button" type="button">🔊 {sessionState.data.audioLabel}</button>
                <div className="hint-list" aria-label="Indices de dictée">
                  {sessionState.data.hints.map((hint) => <span key={hint}>{hint}</span>)}
                </div>
                <label className="answer-field">
                  <span>Ta phrase</span>
                  <textarea
                    value={answerText}
                    onChange={(event) => {
                      setAnswerText(event.target.value);
                      setAnswerState(null);
                    }}
                    rows={4}
                    spellCheck={false}
                    autoCorrect="off"
                    autoCapitalize="off"
                    autoComplete="off"
                  />
                </label>
                <fieldset className="dictation-correction-controls" aria-label="Mode d’aide à l’orthographe">
                  <legend>Mode d’aide à l’orthographe</legend>
                  <label>
                    <input
                      checked={dictationCorrectionMode === 'off'}
                      onChange={() => setDictationCorrectionMode('off')}
                      type="radio"
                      name="dictation-correction-mode"
                    />
                    Sans correcteur d’orthographe
                  </label>
                  <label>
                    <input
                      checked={dictationCorrectionMode === 'line'}
                      onChange={() => setDictationCorrectionMode('line')}
                      type="radio"
                      name="dictation-correction-mode"
                    />
                    Aide corrective
                  </label>
                  <label>
                    <input
                      checked={dictationCorrectionMode === 'advanced'}
                      onChange={() => setDictationCorrectionMode('advanced')}
                      type="radio"
                      name="dictation-correction-mode"
                    />
                    Aide corrective avancée
                  </label>
                </fieldset>
                {dictationCorrectionMode === 'line' ? (
                  <div className="dictation-line-review" aria-label="Indicateur de lignes">
                    {dictationCorrectionRows.length > 0 ? (
                      <>
                        {dictationCorrectionRows.map((line, lineIndex) => (
                          <p className={`dictation-line-indicator ${line.hasMistake ? 'line-has-error' : 'line-ok'}`} key={`line-check-${lineIndex}`}>
                            {line.hasMistake ? '⚠️' : '✅'} Ligne {lineIndex + 1} {line.hasMistake ? 'avec erreur' : 'correcte'}
                          </p>
                        ))}
                      </>
                    ) : <p className="dictation-line-indicator">Valide le texte pour obtenir l’indicateur ligne par ligne.</p>}
                  </div>
                ) : null}
                {dictationCorrectionMode === 'advanced' ? (
                  <div className="dictation-line-reviews" aria-label="Aide corrective avancée">
                    <p className="eyebrow">Mots à vérifier</p>
                    {dictationHighlightedLines.length > 0 ? (
                      <div className="dictation-advanced-preview">
                        {dictationHighlightedLines.map((line, lineIndex) => (
                          <p className={`dictation-line ${line.hasMistake ? 'line-has-error' : ''}`} key={`line-preview-${lineIndex}`}>
                            {line.line}
                          </p>
                        ))}
                      </div>
                    ) : <p className="dictation-line-indicator">Valide le texte pour afficher les mots soulignés.</p>}
                  </div>
                ) : null}
                <button className="primary-action" type="button" onClick={correctDictation} disabled={answerState?.status === 'loading'}>Corriger ma dictée</button>

                {answerState?.status === 'error' ? <p className="feedback-card error">{answerState.message}</p> : null}
                {answerState?.status === 'success' ? (
                  <div className={answerState.data.isCorrect ? 'feedback-card success' : 'feedback-card retry'}>
                    <h3>{answerState.data.feedbackTitle}</h3>
                    <p>{answerState.data.feedbackMessage}</p>
                    <p><strong>Correction :</strong> {answerState.data.correctedText}</p>
                    <div className="word-feedback" aria-label="Correction mot par mot">
                      {answerState.data.wordFeedback.map((word) => (
                        <span className={word.status} key={`${word.expected}-${word.actual}`}>{word.expected}<small>{word.hint}</small></span>
                      ))}
                    </div>
                    <button type="button" onClick={() => { setAnswerText(''); setAnswerState(null); }}>{answerState.data.retryLabel}</button>
                  </div>
                ) : null}
              </div>
            </section>
          )}
        </>
      ) : null}
    </main>
  );
}

function PoetryView({
  dashboard,
  onRecordExercise,
}: {
  dashboard: ChildDashboard;
  onRecordExercise: (payload: {
    module: ExerciseHistoryModule;
    moduleLabel: string;
    exercise: string;
    resultLabel: string;
    status: ExerciseHistoryStatus;
    details: string;
  }) => void;
}) {
  const [sessionState, setSessionState] = useState<ApiState<PoetrySession>>({ status: 'loading' });
  const [recitalState, setRecitalState] = useState<ApiState<PoetryRecitalResult> | null>(null);
  const [hideWords, setHideWords] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPoetrySession(MOCK_LEARNING_SERVICE_CHILD_ID)
      .then((session) => {
        if (!cancelled) setSessionState({ status: 'success', data: session });
      })
      .catch((error: unknown) => {
        if (!cancelled) setSessionState({ status: 'error', message: error instanceof Error ? error.message : 'Impossible de charger la poésie.' });
      });
    return () => { cancelled = true; };
  }, [dashboard.child.id]);

  async function validateRecital() {
    if (sessionState.status !== 'success') return;
    setRecitalState({ status: 'loading' });
    try {
      const result = await submitPoetryRecital(MOCK_LEARNING_SERVICE_CHILD_ID, { poemId: sessionState.data.poemId, confidence: 'ready' });
      const isCompleted = result.status === 'completed';
      const starsEarned = calculateRewardStars('poetry', isCompleted ? 1 : 0, isCompleted ? 0 : 1);
      setRecitalState({ status: 'success', data: result });
      appendActivityRecordToStorage(buildLearningActivityRecord({
        profileId: dashboard.child.id,
        profileName: dashboard.child.firstName,
        module: 'poetry',
        moduleLabel: 'Poésie',
        exerciseLabel: sessionState.data.title,
        score: isCompleted ? 1 : 0,
        totalQuestions: 1,
        correctCount: isCompleted ? 1 : 0,
        wrongCount: isCompleted ? 0 : 1,
        starsEarned,
        status: isCompleted ? 'completed' : 'partial',
        details: { poemId: sessionState.data.poemId, feedbackTitle: result.feedbackTitle },
      }));
      onRecordExercise({
        module: 'poetry',
        moduleLabel: 'Poésie',
        exercise: sessionState.data.title,
        resultLabel: result.status === 'completed' ? 'Complété' : result.status,
        status: result.status === 'completed' ? 'success' : 'partial',
        details: result.feedbackMessage,
      });
    } catch (error: unknown) {
      setRecitalState({ status: 'error', message: error instanceof Error ? error.message : 'Récitation impossible à valider.' });
    }
  }

  return (
    <main className="child-main">
      <ChildTopBar dashboard={dashboard} title="Poésie" />
      {sessionState.status === 'loading' ? <div className="state-card">Préparation de la poésie…</div> : null}
      {sessionState.status === 'error' ? <div className="state-card error">{sessionState.message}</div> : null}
      {sessionState.status === 'success' ? (
        <>
          <section className="language-card poetry-card" aria-labelledby="poetry-title">
            <div className="language-mascot" aria-hidden="true">🎙️</div>
            <div>
              <p className="eyebrow">Mission mémoire</p>
              <h2 id="poetry-title">{sessionState.data.title}</h2>
              <p>{sessionState.data.instruction}</p>
              <div className="poetry-mode-row">
                {sessionState.data.memoryModes.map((mode) => (
                  <button className="audio-button" key={mode} type="button" onClick={() => mode === 'Cacher des mots' && setHideWords((value) => !value)}>{mode}</button>
                ))}
              </div>
              <div className="poem-lines" aria-label="Texte de la poésie">
                {sessionState.data.practiceLines.map((line) => <p key={line.id}><strong>{line.label}</strong> — {hideWords ? line.hiddenText : line.text}</p>)}
              </div>
            </div>
          </section>
          <section className="poetry-steps" aria-label="Étapes de poésie">
            {sessionState.data.steps.map((step) => (
              <article className={`poetry-step ${step.status}`} key={step.id}>
                <strong>{step.label}</strong>
                <p>{step.description}</p>
              </article>
            ))}
          </section>
          <section className="page-card recital-card">
            <p className="eyebrow">Récitation simulée</p>
            <h2>Quand tu es prête, valide ta récitation.</h2>
            <button className="primary-action" type="button" onClick={validateRecital} disabled={recitalState?.status === 'loading'}>J’ai récité ma poésie</button>
            {recitalState?.status === 'loading' ? <p className="feedback-card">La mascotte écoute ton effort…</p> : null}
            {recitalState?.status === 'error' ? <p className="feedback-card error">{recitalState.message}</p> : null}
            {recitalState?.status === 'success' ? (
              <div className={recitalState.data.status === 'completed' ? 'feedback-card success' : 'feedback-card retry'}>
                <h3>{recitalState.data.feedbackTitle}</h3>
                <p>{recitalState.data.feedbackMessage}</p>
              </div>
            ) : null}
          </section>
        </>
      ) : null}
    </main>
  );
}

function getProfileDisplayMeta(profile: ChildProfileConfig) {
  const stars = profile.stars ?? 0;
  const badges = profile.badges ?? 0;
  const streakDays = profile.streakDays ?? 0;
  const progress = profile.progress ?? getDefaultProgressForRole(profile.role) ?? [];
  const currentMission = profile.currentMission ?? {
    title: 'Continuer l’aventure',
    description: 'Choisir la prochaine activité.',
    exercisesCount: 3,
  };

  return { stars, badges, streakDays, progress, currentMission };
}

function ProfileAvatar({ profile, size = 'medium' }: { profile: ChildProfileConfig; size?: 'small' | 'medium' | 'large' }) {
  return (
    <div
      className={`family-avatar ${size} ${profile.avatarPhotoUrl ? 'has-photo' : ''}`}
      style={{ background: profile.avatarPhotoUrl ? undefined : profile.avatarColor }}
      aria-hidden="true"
    >
      {profile.avatarPhotoUrl ? (
        <img src={profile.avatarPhotoUrl} alt="" />
      ) : (
        <span>{profile.name.slice(0, 1).toUpperCase()}</span>
      )}
    </div>
  );
}

function ActiveProfileSwitcher({
  profiles,
  activeProfile,
  onActivateProfile,
}: {
  profiles: ChildProfileConfig[];
  activeProfile: ChildProfileConfig;
  onActivateProfile: (profileId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  function selectProfile(profileId: string) {
    onActivateProfile(profileId);
    setIsOpen(false);
  }

  return (
    <section className="global-active-profile-switcher" aria-label="Sélecteur utilisateur actif">
      <button
        type="button"
        className="global-active-profile-button"
        aria-label={`Changer d’utilisateur actif : ${activeProfile.name}`}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <ProfileAvatar profile={activeProfile} size="small" />
        <span>{activeProfile.name}</span>
        <span aria-hidden="true" className="profile-switcher-chevron">⌄</span>
      </button>
      {isOpen ? (
        <section className="profile-switcher-menu" role="dialog" aria-label="Changer d’utilisateur actif">
          <div className="profile-switcher-header">
            <strong>Changer d’utilisateur</strong>
            <button type="button" className="modal-close-button" aria-label="Fermer le sélecteur utilisateur" onClick={() => setIsOpen(false)}>×</button>
          </div>
          <div className="profile-switcher-list">
            {profiles.map((profile) => {
              const isActive = profile.id === activeProfile.id;
              return (
                <button
                  type="button"
                  key={profile.id}
                  className={`profile-switcher-option ${isActive ? 'active' : ''}`}
                  aria-pressed={isActive}
                  onClick={() => selectProfile(profile.id)}
                >
                  <ProfileAvatar profile={profile} size="small" />
                  <span>
                    <strong>{profile.name}</strong>
                    <small>{getProfileSummaryText(profile).subtitle}</small>
                  </span>
                  <em>{isActive ? 'Actif' : `Utiliser ${profile.name}`}</em>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}
    </section>
  );
}

function ProfileView({
  profiles,
  activeProfile,
  activeProfileId,
  activeProfileHistory,
  onActivateProfile,
  onCreateProfile,
}: {
  dashboard: ChildDashboard;
  profiles: ChildProfileConfig[];
  activeProfile: ChildProfileConfig;
  activeProfileId: string;
  activeProfileHistory: ProfileExerciseHistoryRecord[];
  onActivateProfile: (profileId: string) => void;
  onCreateProfile: (profile: Omit<ChildProfileConfig, 'id'>, profileId?: string) => void;
}) {
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailProfileId, setDetailProfileId] = useState<string | null>(null);
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false);
  const [familySettings, setFamilySettings] = useState<FamilySettings>(() => readFamilySettingsFromStorage());
  const [familyForm, setFamilyForm] = useState<FamilySettings>(() => readFamilySettingsFromStorage());
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [formState, setFormState] = useState<NewProfileForm>(() => getDefaultProfileForm());
  const [formError, setFormError] = useState('');
  const [activationError, setActivationError] = useState('');
  const [switchingProfileId, setSwitchingProfileId] = useState<string | null>(null);
  const [activityPeriodDays, setActivityPeriodDays] = useState('7');
  const [historyFilters, setHistoryFilters] = useState<ActivityFilters>({ profileId: 'all', activity: 'all', subject: 'all', periodDays: '30' });
  const [historySort, setHistorySort] = useState<{ key: HistorySortKey; direction: SortDirection }>({ key: 'date', direction: 'desc' });
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(DEFAULT_HISTORY_PAGE_SIZE);

  const students = profiles.filter((profile) => profile.role === 'eleve');
  const parents = profiles.filter((profile) => profile.role === 'parent');
  const isStudent = formState.role === 'eleve';
  const photoSource = PROFILE_PHOTO_OPTIONS.find((photo) => photo.url === formState.avatarPhotoUrl);
  const detailProfile = profiles.find((profile) => profile.id === detailProfileId) ?? null;
  const profileActivityData = useMemo(() => buildProfileActivityData(profiles, students, Number(activityPeriodDays)), [profiles, students, activityPeriodDays]);
  const activityStats = profileActivityData.stats;
  const historyRows = profileActivityData.historyRows;
  const activityOptions = useMemo(() => Array.from(new Set(historyRows.map((row) => row.activity))).sort((a, b) => a.localeCompare(b, 'fr')), [historyRows]);
  const subjectOptions = useMemo(() => Array.from(new Set(historyRows.map((row) => row.subject))).sort((a, b) => a.localeCompare(b, 'fr')), [historyRows]);
  const childColorById = useMemo(() => students.reduce<Record<string, string>>((lookup, profile) => {
    lookup[profile.id] = getProfileColor(profile);
    return lookup;
  }, {}), [students]);

  const filteredHistoryRows = useMemo(() => {
    const periodDays = Number(historyFilters.periodDays);
    const now = Date.now();
    const minTime = now - periodDays * 24 * 60 * 60 * 1000;
    return historyRows
      .filter((row) => historyFilters.profileId === 'all' || row.profileId === historyFilters.profileId)
      .filter((row) => historyFilters.activity === 'all' || row.activity === historyFilters.activity)
      .filter((row) => historyFilters.subject === 'all' || row.subject === historyFilters.subject)
      .filter((row) => Date.parse(row.dateIso) >= minTime)
      .sort((a, b) => {
        const result = compareHistoryRows(a, b, historySort.key);
        return historySort.direction === 'asc' ? result : -result;
      });
  }, [historyRows, historyFilters, historySort]);

  const totalHistoryPages = Math.max(1, Math.ceil(filteredHistoryRows.length / historyPageSize));
  const currentHistoryPage = Math.min(historyPage, totalHistoryPages);
  const pagedHistoryRows = filteredHistoryRows.slice((currentHistoryPage - 1) * historyPageSize, currentHistoryPage * historyPageSize);
  const firstHistoryResultIndex = filteredHistoryRows.length === 0 ? 0 : (currentHistoryPage - 1) * historyPageSize + 1;
  const lastHistoryResultIndex = Math.min(filteredHistoryRows.length, currentHistoryPage * historyPageSize);

  useEffect(() => {
    setHistoryPage(1);
  }, [historyFilters, historyPageSize]);

  useEffect(() => {
    if (!detailProfile && !isFamilyModalOpen) return undefined;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setDetailProfileId(null);
        closeFamilyModal();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [detailProfile, isFamilyModalOpen, familySettings]);

  function openCreateModal(role: ProfileRole) {
    setEditingProfileId(null);
    setFormState(getDefaultProfileForm(undefined, role));
    setFormError('');
    setIsPhotoPickerOpen(false);
    setIsModalOpen(true);
  }

  function openFamilyModal() {
    setFamilyForm(familySettings);
    setIsFamilyModalOpen(true);
  }

  function closeFamilyModal() {
    setIsFamilyModalOpen(false);
    setFamilyForm(familySettings);
  }

  function saveFamilySettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextSettings = normalizeFamilySettings(familyForm);
    setFamilySettings(nextSettings);
    writeFamilySettingsToStorage(nextSettings);
    setIsFamilyModalOpen(false);
  }

  function openEditModal(profile: ChildProfileConfig) {
    if (activeProfile.role === 'eleve' && profile.role === 'parent') {
      setActivationError('Un enfant ne peut pas modifier les droits ou le profil d’un parent.');
      return;
    }
    setEditingProfileId(profile.id);
    setFormState(getDefaultProfileForm(profile));
    setFormError('');
    setIsPhotoPickerOpen(false);
    setDetailProfileId(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingProfileId(null);
    setFormState(getDefaultProfileForm());
    setFormError('');
    setIsPhotoPickerOpen(false);
  }

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formState.name.trim()) {
      setFormError('Le nom est obligatoire.');
      return;
    }

    if (formState.role === 'eleve') {
      const parsedAge = Number(formState.age);
      if (!Number.isFinite(parsedAge) || parsedAge < 3 || parsedAge > 120) {
        setFormError("L'âge est obligatoire pour un élève.");
        return;
      }

      if (!SCHOOL_LEVEL_OPTIONS.includes(formState.schoolLevel)) {
        setFormError('Choisis un niveau scolaire valide.');
        return;
      }
    }

    onCreateProfile(buildProfilePayloadFromForm(formState), editingProfileId ?? undefined);
    closeModal();
  }

  function activateProfile(profileId: string) {
    if (profileId === activeProfileId) return;
    setActivationError('');
    setSwitchingProfileId(profileId);
    try {
      onActivateProfile(profileId);
    } catch {
      setActivationError('Impossible de changer de profil pour le moment.');
    } finally {
      setSwitchingProfileId(null);
    }
  }

  function sortHistory(key: HistorySortKey) {
    setHistorySort((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  }

  function resetHistoryFilters() {
    setHistoryFilters({ profileId: 'all', activity: 'all', subject: 'all', periodDays: '30' });
    setHistorySort({ key: 'date', direction: 'desc' });
  }

  function renderGroupedBars(metric: 'minutes' | 'stars') {
    const days = getRecentDayLabels(Number(activityPeriodDays));
    const maxValue = Math.max(1, ...activityStats.map((item) => metric === 'minutes' ? item.minutes : item.stars));
    const axisTicks = [maxValue, maxValue / 2, 0].filter((tick, index, ticks) => ticks.indexOf(tick) === index);
    return (
      <div
        className="activity-chart-with-axis"
        aria-label={metric === 'minutes' ? 'Histogramme temps d’activité' : 'Histogramme étoiles gagnées'}
        data-series-count={students.length}
      >
        <div className="activity-y-axis" aria-label="Axe Y">
          {axisTicks.map((tick) => <span key={`${metric}-tick-${tick}`}>{formatChartAxisTick(tick)}</span>)}
        </div>
        <div className="activity-grouped-chart">
          {days.map((day) => (
            <div className="activity-chart-day" key={`${metric}-${day}`}>
              <div className="activity-bars-group">
                {students.map((profile) => {
                  const stat = activityStats.find((item) => item.profileId === profile.id && item.day === day);
                  const value = stat ? (metric === 'minutes' ? stat.minutes : stat.stars) : 0;
                  const scaledHeight = (value / maxValue) * ACTIVITY_CHART_HEIGHT_PX;
                  const barHeight = value === 0 ? 0 : Math.max(4, Math.round(scaledHeight * 10) / 10);
                  return (
                    <span
                      className={`activity-bar ${value === 0 ? 'is-zero' : ''}`}
                      data-profile-id={profile.id}
                      aria-label={`${profile.name} ${formatActivityDay(day)} : ${value} ${metric === 'minutes' ? 'minutes' : 'étoiles'}`}
                      key={`${profile.id}-${day}`}
                      style={{ height: `${barHeight}px`, background: childColorById[profile.id] }}
                      title={`${profile.name} · ${value}`}
                    />
                  );
                })}
              </div>
              <small>{formatActivityChartDay(day)}</small>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderSubjectBars() {
    const maxValue = Math.max(
      1,
      ...ACTIVITY_SUBJECTS.flatMap((subject) => students.map((profile) => activityStats
        .filter((item) => item.profileId === profile.id)
        .reduce((total, item) => total + (item.exercisesBySubject[subject] ?? 0), 0))),
    );
    return (
      <div className="subject-chart" aria-label="Histogramme exercices réalisés par matière">
        {ACTIVITY_SUBJECTS.map((subject) => (
          <div className="subject-chart-row" key={subject}>
            <strong>{subject}</strong>
            <div className="subject-bars-group">
              {students.map((profile) => {
                const value = activityStats
                  .filter((item) => item.profileId === profile.id)
                  .reduce((total, item) => total + (item.exercisesBySubject[subject] ?? 0), 0);
                return (
                  <span key={`${subject}-${profile.id}`}>
                    <i data-profile-id={profile.id} style={{ width: `${value === 0 ? 0 : Math.max(4, (value / maxValue) * 100)}%`, background: childColorById[profile.id] }} />
                    <em>{value}</em>
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderProfileCard(profile: ChildProfileConfig) {
    const isActive = profile.id === activeProfileId;
    const summary = getProfileSummaryText(profile);
    const isSwitching = switchingProfileId === profile.id;

    return (
      <article
        aria-label={`Profil de ${profile.name}`}
        className={`family-profile-card compact ${profile.role === 'parent' ? 'parent' : 'child'} ${isActive ? 'active' : ''}`}
        key={profile.id}
        onClick={() => !isActive && activateProfile(profile.id)}
      >
        <div className="family-profile-card-top compact-row">
          <ProfileAvatar profile={profile} />
          <div className="profile-row-main">
            <h3>{profile.name}</h3>
            <p><ProfileColorDot profile={profile} /> {summary.subtitle}</p>
          </div>
          <button
            type="button"
            className={`profile-state-pill ${isActive ? 'active' : ''}`}
            disabled={isActive || isSwitching}
            onClick={(event) => {
              event.stopPropagation();
              activateProfile(profile.id);
            }}
            aria-label={isActive ? `${profile.name} est le profil actif` : `Activer ${profile.name}`}
          >
            {isActive ? 'Actif' : isSwitching ? 'Activation…' : 'Inactif'}
          </button>
        </div>
        <div className="family-card-actions compact-actions">
          <button
            type="button"
            className="ghost-action"
            onClick={(event) => {
              event.stopPropagation();
              openEditModal(profile);
            }}
            aria-label={`Modifier ${profile.name}`}
          >
            Modifier
          </button>
        </div>
      </article>
    );
  }

  return (
    <main className="child-main profile-screen family-profile-screen">
      <section className="family-banner functional-family-header screenshot-family-header" aria-label="En-tête famille">
        <button
          type="button"
          className={`family-hero-visual editable family-hero-${familySettings.illustration}`}
          data-testid="family-house-visual"
          aria-label="Modifier l’image de la famille"
          onClick={openFamilyModal}
        >
          <span className="family-visual-sun" />
          <span className="family-visual-cloud cloud-left" />
          <span className="family-visual-cloud cloud-right" />
          <span className="family-visual-house" />
          <span className="family-visual-hill" />
        </button>
        <div className="family-banner-content">
          <div className="family-title-row">
            <button type="button" className="family-title-edit-button" onClick={openFamilyModal} aria-label="Modifier le nom de la famille">
              <h2>{familySettings.name}</h2>
            </button>
            <span className="family-level-tag">Niveau {FAMILY_LEVEL} <Star size={14} aria-hidden="true" /></span>
          </div>
        </div>
      </section>

      {activationError ? <p className="state-card error" role="alert">{activationError}</p> : null}

      <section className="profile-section" aria-label="Profils famille">
        <div className="section-heading compact-heading family-profiles-heading">
          <div>
            <p className="eyebrow">Profils famille</p>
            <h2>Enfants et parents</h2>
          </div>
          <button
            type="button"
            className="family-add-profile-button"
            aria-label="Ajouter un profil"
            title="Ajouter un profil"
            onClick={() => openCreateModal('eleve')}
          >
            +
          </button>
        </div>
        <div className="family-profiles-strip">
          {profiles.map((profile) => renderProfileCard(profile))}
        </div>
      </section>

      <section className="profile-section activity-overview activity-overview-panel" aria-label="Aperçu des activités">
        <div className="section-heading compact-heading activity-overview-heading">
          <div>
            <h2>Aperçu des activités</h2>
          </div>
          <label className="inline-filter period-pill">
            <span>Période</span>
            <select value={activityPeriodDays} onChange={(event) => setActivityPeriodDays(event.target.value)} aria-label="Période">
              <option value="7">7 derniers jours</option>
              <option value="14">14 derniers jours</option>
            </select>
          </label>
        </div>
        {students.length === 0 ? <p className="state-card empty">Aucun enfant à afficher.</p> : (
          <div className="activity-overview-grid">
            <article className="activity-card-panel kpi-card-connections">
              <div className="kpi-card-title"><span className="kpi-card-icon">↗</span><h3>Dernières connexions</h3></div>
              <ul className="last-connection-list">
                {students.map((profile) => (
                  <li key={profile.id}><ProfileAvatar profile={profile} size="small" /> <span><ProfileColorDot profile={profile} /> {profile.name}</span><strong>{getLastConnectionLabel(profile.id, activityStats)}</strong></li>
                ))}
              </ul>
            </article>
            <article className="activity-card-panel kpi-card-time wide">
              <div className="kpi-card-title"><span className="kpi-card-icon">◷</span><div><h3>Temps d’activité</h3><p>en minutes par jour</p></div></div>
              {renderGroupedBars('minutes')}
            </article>
            <article className="activity-card-panel kpi-card-subjects wide">
              <div className="kpi-card-title"><span className="kpi-card-icon">▦</span><div><h3>Exercices réalisés</h3><p>par matière</p></div></div>
              {renderSubjectBars()}
            </article>
            <article className="activity-card-panel kpi-card-stars wide">
              <div className="kpi-card-title"><span className="kpi-card-icon">★</span><div><h3>Étoiles gagnées</h3><p>par jour</p></div></div>
              {renderGroupedBars('stars')}
            </article>
          </div>
        )}
      </section>

      <section className="profile-section activity-history" aria-label="Historique détaillé des activités">
        <div className="section-heading compact-heading history-heading">
          <div>
            <h2>Historique détaillé des activités</h2>
            <p className="history-results-summary">
              Total des résultats : {historyRows.length} · Résultats filtrés : {filteredHistoryRows.length} {historyFilters.profileId !== 'all' ? profiles.find((profile) => profile.id === historyFilters.profileId)?.name : ''}
            </p>
          </div>
          <p className="history-sort-summary">Tri : {historySort.key === 'result' ? 'résultat' : historySort.key} {historySort.direction === 'asc' ? 'ascendant' : 'descendant'}</p>
        </div>
        <div className="history-filters">
          <label>Profil
            <select aria-label="Filtrer par profil" value={historyFilters.profileId} onChange={(event) => setHistoryFilters((current) => ({ ...current, profileId: event.target.value }))}>
              <option value="all">Tous</option>
              {profiles.map((profile) => <option value={profile.id} key={profile.id}>{profile.name}</option>)}
            </select>
          </label>
          <label>Activité
            <select aria-label="Filtrer par activité" value={historyFilters.activity} onChange={(event) => setHistoryFilters((current) => ({ ...current, activity: event.target.value }))}>
              <option value="all">Toutes</option>
              {activityOptions.map((activity) => <option value={activity} key={activity}>{activity}</option>)}
            </select>
          </label>
          <label>Matière
            <select aria-label="Filtrer par matière" value={historyFilters.subject} onChange={(event) => setHistoryFilters((current) => ({ ...current, subject: event.target.value }))}>
              <option value="all">Toutes</option>
              {subjectOptions.map((subject) => <option value={subject} key={subject}>{subject}</option>)}
            </select>
          </label>
          <label>Période/date
            <select aria-label="Filtrer par période" value={historyFilters.periodDays} onChange={(event) => setHistoryFilters((current) => ({ ...current, periodDays: event.target.value }))}>
              <option value="7">7 derniers jours</option>
              <option value="30">30 derniers jours</option>
            </select>
          </label>
          <button type="button" className="ghost-action" onClick={resetHistoryFilters}>Réinitialiser</button>
        </div>
        <div className="multiplication-history-table-wrap">
          <table className="multiplication-history-table activity-history-table" aria-label="Activités famille">
            <thead>
              <tr>
                <th scope="col"><button type="button" onClick={() => sortHistory('profile')}>Trier par profil</button></th>
                <th scope="col"><button type="button" onClick={() => sortHistory('activity')}>Trier par activité</button></th>
                <th scope="col"><button type="button" onClick={() => sortHistory('subject')}>Trier par matière</button></th>
                <th scope="col"><button type="button" onClick={() => sortHistory('date')}>Trier par date et heure</button></th>
                <th scope="col"><button type="button" onClick={() => sortHistory('result')}>Trier par résultat</button></th>
              </tr>
            </thead>
            <tbody>
              {pagedHistoryRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.profileName}</td>
                  <td>{row.activity}</td>
                  <td>{row.subject}</td>
                  <td>{formatHistoryDateTime(row.dateIso)}</td>
                  <td><span className={`result-pill ${row.resultPercent >= 85 ? 'strong' : row.resultPercent >= 70 ? 'medium' : 'low'}`}>{row.resultPercent}%</span></td>
                </tr>
              ))}
              {pagedHistoryRows.length === 0 ? <tr><td colSpan={5}>Aucune activité pour ces filtres.</td></tr> : null}
            </tbody>
          </table>
        </div>
        <div className="history-pagination">
          <span className="history-page-count">{firstHistoryResultIndex}–{lastHistoryResultIndex} sur {filteredHistoryRows.length} activités</span>
          <div className="history-page-controls">
            <button type="button" className="ghost-action" disabled={currentHistoryPage <= 1} onClick={() => setHistoryPage((page) => Math.max(1, page - 1))}>Page précédente</button>
            <span>Page {currentHistoryPage} / {totalHistoryPages}</span>
            <button type="button" className="ghost-action" disabled={currentHistoryPage >= totalHistoryPages} onClick={() => setHistoryPage((page) => Math.min(totalHistoryPages, page + 1))}>Page suivante</button>
          </div>
          <label>Éléments par page
            <select value={historyPageSize} onChange={(event) => setHistoryPageSize(Number(event.target.value))} aria-label="Éléments par page">
              <option value="5">5</option>
              <option value="10">10</option>
            </select>
          </label>
        </div>
      </section>

      {isFamilyModalOpen ? (
        <div className="profile-modal-backdrop" role="presentation" onMouseDown={closeFamilyModal}>
          <section
            className="profile-modal family-settings-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="family-settings-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="profile-modal-header">
              <div>
                <p className="eyebrow">Famille</p>
                <h2 id="family-settings-title">Modifier la famille</h2>
              </div>
              <button type="button" className="modal-close-button" onClick={closeFamilyModal} aria-label="Fermer la modale">×</button>
            </div>
            <form className="profile-form profile-modal-form" onSubmit={saveFamilySettings}>
              <label className="answer-field">
                <span>Nom de la famille</span>
                <input
                  value={familyForm.name}
                  onChange={(event) => setFamilyForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Ex: Famille Nedelec"
                />
              </label>
              <fieldset className="family-illustration-field answer-field" aria-label="Image de la famille">
                <legend>Image de la famille</legend>
                <div className="family-illustration-options">
                  {FAMILY_ILLUSTRATION_OPTIONS.map((option) => (
                    <label key={option.id}>
                      <input
                        checked={familyForm.illustration === option.id}
                        name="family-illustration"
                        onChange={() => setFamilyForm((current) => ({ ...current, illustration: option.id }))}
                        type="radio"
                        value={option.id}
                      />
                      <span className={`family-hero-visual miniature family-hero-${option.id}`} aria-hidden="true">
                        <span className="family-visual-sun" />
                        <span className="family-visual-cloud cloud-left" />
                        <span className="family-visual-cloud cloud-right" />
                        <span className="family-visual-house" />
                        <span className="family-visual-hill" />
                      </span>
                      <strong>{option.label}</strong>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="profile-form-actions modal-actions">
                <button className="secondary-action" type="button" onClick={closeFamilyModal}>Annuler</button>
                <button className="primary-action" type="submit">Enregistrer</button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {detailProfile ? (
        <div className="profile-modal-backdrop" role="presentation" onMouseDown={() => setDetailProfileId(null)}>
          <section
            className="profile-modal profile-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-detail-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="profile-modal-header">
              <div>
                <p className="eyebrow">Détail profil</p>
                <h2 id="profile-detail-title">Détail du profil {detailProfile.name}</h2>
              </div>
              <button type="button" className="modal-close-button" onClick={() => setDetailProfileId(null)} aria-label="Fermer la modale">×</button>
            </div>
            <div className="profile-detail-content">
              <ProfileAvatar profile={detailProfile} size="large" />
              <div>
                <h3>{detailProfile.name}</h3>
                <p>{getProfileSummaryText(detailProfile).subtitle}</p>
                <span className="profile-active-badge">{detailProfile.id === activeProfileId ? 'Actif' : 'Inactif'}</span>
              </div>
            </div>
            {detailProfile.role === 'eleve' ? (
              <div className="detail-grid">
                <article><strong>Classe</strong><span>{detailProfile.schoolLevel}</span></article>
                <article><strong>Âge</strong><span>{detailProfile.age} ans</span></article>
                <article><strong>Dernière connexion</strong><span>{getLastConnectionLabel(detailProfile.id, activityStats)}</span></article>
                <article><strong>Statistiques principales</strong><span>{activeProfileHistory.length} activité(s) récentes</span></article>
                <article className="wide"><strong>Progression</strong><span>{(detailProfile.progress ?? []).map((item) => `${item.subject} ${item.value}%`).join(' · ') || 'Résumé non disponible'}</span></article>
              </div>
            ) : (
              <div className="detail-grid">
                <article><strong>Rôle</strong><span>Parent</span></article>
                <article><strong>Email</strong><span>Non renseigné</span></article>
                <article><strong>Droits/permissions</strong><span>Gestion famille limitée côté UI — TODO backend permissions.</span></article>
              </div>
            )}
            <div className="profile-form-actions modal-actions">
              <button type="button" className="secondary-action" onClick={() => setDetailProfileId(null)}>Fermer</button>
              <button type="button" className="primary-action" onClick={() => openEditModal(detailProfile)}>Modifier</button>
            </div>
          </section>
        </div>
      ) : null}

      {isModalOpen ? (
        <div className="profile-modal-backdrop" role="presentation" onMouseDown={closeModal}>
          <section
            className="profile-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="profile-modal-header">
              <div>
                <p className="eyebrow">{editingProfileId ? 'Modification' : 'Création'}</p>
                <h2 id="profile-modal-title">
                  {editingProfileId ? 'Modifier le profil' : `Créer un profil ${formState.role === 'eleve' ? 'élève' : 'parent'}`}
                </h2>
              </div>
              <button type="button" className="modal-close-button" onClick={closeModal} aria-label="Fermer la modale">×</button>
            </div>

            {formError ? <p className="state-card error" role="alert">{formError}</p> : null}

            <form className="profile-form profile-modal-form" onSubmit={saveProfile}>
              <label className="answer-field">
                <span>Nom</span>
                <input
                  value={formState.name}
                  onChange={(event) => { setFormState((current) => ({ ...current, name: event.target.value })); setFormError(''); }}
                  placeholder={formState.role === 'eleve' ? 'Ex: Louane' : 'Ex: Camille'}
                />
              </label>

              <div className="answer-field profile-photo-field">
                <span>Photo de profil</span>
                <button
                  type="button"
                  className="profile-photo-trigger"
                  aria-expanded={isPhotoPickerOpen}
                  aria-controls="profile-photo-picker"
                  onClick={() => setIsPhotoPickerOpen((isOpen) => !isOpen)}
                >
                  <span className="profile-photo-preview" aria-hidden="true">
                    {formState.avatarPhotoUrl && photoSource ? (
                      <img src={formState.avatarPhotoUrl} alt="" />
                    ) : (
                      <span className="avatar-color-preview" />
                    )}
                  </span>
                  <span>
                    {photoSource ? `Photo sélectionnée : ${photoSource.label}` : 'Cliquer pour choisir une des 15 photos'}
                  </span>
                </button>

                {isPhotoPickerOpen ? (
                  <div className="profile-photo-picker" id="profile-photo-picker" aria-label="Choisir une photo de profil">
                    {PROFILE_PHOTO_OPTIONS.map((photo, index) => {
                      const isSelected = formState.avatarPhotoUrl === photo.url;
                      return (
                        <button
                          type="button"
                          className={`profile-photo-choice ${isSelected ? 'selected' : ''}`}
                          aria-label={`Choisir avatar ${index + 1}`}
                          aria-pressed={isSelected}
                          key={photo.id}
                          onClick={() => {
                            setFormState((current) => ({ ...current, avatarPhotoUrl: photo.url }));
                            setFormError('');
                            setIsPhotoPickerOpen(false);
                          }}
                        >
                          <img src={photo.url} alt="" />
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <fieldset className="role-radio-field answer-field" aria-label="Type de profil">
                <legend>Type</legend>
                <label>
                  <input
                    checked={formState.role === 'eleve'}
                    onChange={() => setFormState((current) => ({
                      ...current,
                      role: 'eleve',
                      schoolLevel: current.schoolLevel || FALLBACK_PROFILE.schoolLevel,
                      profileColor: STUDENT_PROFILE_COLOR_PALETTE.includes(current.profileColor) ? current.profileColor : STUDENT_PROFILE_COLOR_PALETTE[0]!,
                    }))}
                    type="radio"
                    name="profile-role"
                    value="eleve"
                  />
                  Élève
                </label>
                <label>
                  <input
                    checked={formState.role === 'parent'}
                    onChange={() => setFormState((current) => ({ ...current, role: 'parent', schoolLevel: '', age: '', profileColor: getDefaultProfileColor('', current.name, 'parent') }))}
                    type="radio"
                    name="profile-role"
                    value="parent"
                  />
                  Parent
                </label>
              </fieldset>

              {isStudent ? (
                <>
                  <label className="answer-field">
                    <span>Âge</span>
                    <input
                      type="number"
                      min="3"
                      max="18"
                      value={formState.age}
                      onChange={(event) => { setFormState((current) => ({ ...current, age: event.target.value })); setFormError(''); }}
                      placeholder="Ex: 9"
                    />
                  </label>

                  <label className="answer-field">
                    <span>Niveau scolaire</span>
                    <select
                      value={formState.schoolLevel}
                      onChange={(event) => { setFormState((current) => ({ ...current, schoolLevel: event.target.value })); setFormError(''); }}
                    >
                      <option value="">Choisir</option>
                      {SCHOOL_LEVEL_OPTIONS.map((level) => (
                        <option value={level} key={level}>{level}</option>
                      ))}
                    </select>
                  </label>

                  <fieldset className="profile-color-field answer-field" aria-label="Couleur associée aux graphiques">
                    <legend>Couleur des graphiques</legend>
                    <div className="profile-color-options">
                      {STUDENT_PROFILE_COLOR_PALETTE.map((color) => (
                        <label key={color} style={{ '--profile-choice-color': color } as CSSProperties}>
                          <input
                            checked={formState.profileColor === color}
                            name="profile-color"
                            onChange={() => setFormState((current) => ({ ...current, profileColor: color }))}
                            type="radio"
                            value={color}
                          />
                          <span aria-hidden="true" />
                          <em>{color}</em>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </>
              ) : (
                <p className="parent-modal-note"><User size={16} /> Rôle affiché : Parent</p>
              )}

              <div className="profile-form-actions modal-actions">
                <button className="secondary-action" type="button" onClick={closeModal}>Annuler</button>
                <button className="primary-action" type="submit">Enregistrer</button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function formatActivityDateTime(dateIso: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateIso));
}

function ActivityDatabaseView({ dashboard }: { dashboard: ChildDashboard }) {
  const [moduleFilter, setModuleFilter] = useState<StoredActivityModule | 'all'>('all');
  const [records] = useState<ActivityRecord[]>(() => readActivityRecordsFromStorage());
  const filteredRecords = moduleFilter === 'all' ? records : records.filter((record) => record.module === moduleFilter);
  const totalStars = filteredRecords.reduce((total, record) => total + record.starsEarned, 0);
  const totalDuration = filteredRecords.reduce((total, record) => total + record.durationSeconds, 0);

  return (
    <main className="child-main admin-data-page">
      <ChildTopBar dashboard={dashboard} title="Base de données" />
      <section className="hero-card admin-hero-card">
        <div>
          <p className="eyebrow">Données stockées</p>
          <h2>Activités enregistrées pour tous les profils</h2>
          <p>Cette vue parent/admin montre les lignes qui alimenteront les graphiques du profil.</p>
        </div>
        <div className="hero-stats admin-stat-stack">
          <strong>{filteredRecords.length}</strong>
          <span>activité{filteredRecords.length > 1 ? 's' : ''}</span>
          <small>{totalStars} ⭐ · {formatDuration(totalDuration)}</small>
        </div>
      </section>

      <section className="admin-panel" aria-labelledby="activity-database-title">
        <div className="section-heading compact">
          <p className="eyebrow">Contrôle des données</p>
          <h2 id="activity-database-title">Tableau des activités stockées</h2>
        </div>
        <label className="field-label compact-field">
          Filtrer par module
          <select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value as StoredActivityModule | 'all')}>
            <option value="all">Tous les modules</option>
            <option value="multiplication">Multiplication</option>
            <option value="dictation">Dictée</option>
            <option value="poetry">Poésie</option>
            <option value="reading">Lecture</option>
          </select>
        </label>

        <div className="multiplication-history-table-wrap">
          <table className="multiplication-history-table activity-database-table" aria-label="Données d'activité stockées">
            <thead>
              <tr>
                <th>DATE</th>
                <th>PROFIL</th>
                <th>MODULE</th>
                <th>EXERCICE</th>
                <th>DURÉE</th>
                <th>SCORE</th>
                <th>ÉTOILES</th>
                <th>STATUT</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr><td colSpan={8}>Aucune activité stockée pour ce filtre.</td></tr>
              ) : filteredRecords.map((record) => (
                <tr key={record.id}>
                  <td>{formatActivityDateTime(record.completedAtIso)}</td>
                  <td>{record.profileName}</td>
                  <td>{record.moduleLabel}</td>
                  <td>{record.exerciseLabel}</td>
                  <td>{formatDuration(record.durationSeconds)}</td>
                  <td><strong>{record.score} / {record.totalQuestions}</strong></td>
                  <td>{record.starsEarned} ⭐</td>
                  <td><span className="history-pill success">{record.status === 'completed' ? 'Terminé' : record.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

const rewardSettingOrder: RewardExerciseKey[] = ['multiplication', 'dictation', 'poetry', 'reading'];

function RewardSettingsView({ dashboard }: { dashboard: ChildDashboard }) {
  const [settings, setSettings] = useState<RewardSettings>(() => readRewardSettingsFromStorage());
  const [saveState, setSaveState] = useState<'idle' | 'saved'>('idle');

  function updateSetting(key: RewardExerciseKey, field: 'starsPerCompletedExercise' | 'perfectBonusStars', value: string) {
    const stars = Math.max(0, Number(value) || 0);
    setSettings((current) => ({
      ...current,
      [key]: {
        ...current[key],
        [field]: stars,
      },
    }));
    setSaveState('idle');
  }

  function saveSettings() {
    writeRewardSettingsToStorage(settings);
    setSaveState('saved');
  }

  return (
    <main className="child-main admin-data-page">
      <ChildTopBar dashboard={dashboard} title="Paramétrage" />
      <section className="hero-card admin-hero-card">
        <div>
          <p className="eyebrow">Règles de récompense</p>
          <h2>Définir les étoiles gagnées par exercice</h2>
          <p>Ces règles serviront aux prochaines activités. Les anciennes lignes gardent les étoiles réellement gagnées au moment de l’exercice.</p>
        </div>
        <div className="hero-stats admin-stat-stack">
          <strong>{rewardSettingOrder.length}</strong>
          <span>modules</span>
        </div>
      </section>

      <section className="admin-panel" aria-labelledby="reward-settings-title">
        <div className="section-heading compact">
          <p className="eyebrow">Étoiles</p>
          <h2 id="reward-settings-title">Paramétrage des récompenses</h2>
        </div>
        <div className="settings-grid">
          {rewardSettingOrder.map((key) => {
            const setting = settings[key];
            return (
              <article className="settings-card" key={key}>
                <h3>{setting.label}</h3>
                <label className="field-label">
                  Étoiles pour {setting.label.toLocaleLowerCase('fr-FR')}
                  <input
                    min={0}
                    type="number"
                    value={setting.starsPerCompletedExercise}
                    onChange={(event) => updateSetting(key, 'starsPerCompletedExercise', event.target.value)}
                  />
                </label>
                <label className="field-label">
                  Bonus sans erreur
                  <input
                    min={0}
                    type="number"
                    value={setting.perfectBonusStars}
                    onChange={(event) => updateSetting(key, 'perfectBonusStars', event.target.value)}
                  />
                </label>
              </article>
            );
          })}
        </div>
        <div className="form-actions">
          <button type="button" className="primary-action" onClick={saveSettings}>Enregistrer le paramétrage</button>
          {saveState === 'saved' ? <p className="form-feedback success">Paramétrage enregistré.</p> : null}
        </div>
      </section>
    </main>
  );
}

function ChildSideNav({
  activePage,
  isPinned,
  onNavigate,
  onTogglePinned,
}: {
  activePage: ChildPage;
  isPinned: boolean;
  onNavigate: (page: ChildPage) => void;
  onTogglePinned: () => void;
}) {
  return (
    <nav className={`child-side-nav ${isPinned ? 'expanded' : 'compact'}`} aria-label="Navigation enfant — menu latéral">
      <div className="side-nav-brand-row">
        <div className="side-nav-brand" aria-hidden="true">
          <span>🦉</span>
          <strong className="nav-label">Devoirs</strong>
        </div>
        <button
          type="button"
          className="side-nav-pin-button"
          aria-label={isPinned ? 'Désactiver l’épingle du menu' : 'Épingler le menu étendu'}
          aria-pressed={isPinned}
          title={isPinned ? 'Passer le menu en compact' : 'Maintenir le menu étendu'}
          onClick={onTogglePinned}
        >
          📌
        </button>
      </div>
      {navItems.map(({ id, label, icon: Icon }) => (
        <button aria-current={activePage === id ? 'page' : undefined} aria-label={label} className={activePage === id ? 'active' : ''} key={id} onClick={() => onNavigate(id)}>
          <Icon size={18} />
          <span className="nav-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}

function ActivePage({
  page,
  dashboard,
  onNavigate,
  profiles,
  activeProfileId,
  activeProfile,
  onActivateProfile,
  onCreateProfile,
  exerciseHistory,
  onRecordExercise,
}: {
  page: ChildPage;
  dashboard: ChildDashboard;
  onNavigate: (page: ChildPage) => void;
  profiles: ChildProfileConfig[];
  activeProfileId: string;
  activeProfile: ChildProfileConfig;
  onActivateProfile: (profileId: string) => void;
  onCreateProfile: (profile: Omit<ChildProfileConfig, 'id'>, profileId?: string) => void;
  exerciseHistory: ProfileExerciseHistoryRecord[];
  onRecordExercise: (payload: {
    module: ExerciseHistoryModule;
    moduleLabel: string;
    exercise: string;
    resultLabel: string;
    status: ExerciseHistoryStatus;
    details: string;
  }) => void;
}) {
  switch (page) {
    case 'path':
      return <LearningPathView dashboard={dashboard} />;
    case 'rewards':
      return <RewardsView dashboard={dashboard} />;
    case 'reading':
      return <ReadingView dashboard={dashboard} onRecordExercise={onRecordExercise} />;
    case 'multiplication':
      return <MultiplicationView dashboard={dashboard} onRecordExercise={onRecordExercise} />;
    case 'dictation':
      return <DictationView dashboard={dashboard} onRecordExercise={onRecordExercise} />;
    case 'poetry':
      return <PoetryView dashboard={dashboard} onRecordExercise={onRecordExercise} />;
    case 'profile':
      return <ProfileView
        dashboard={dashboard}
        profiles={profiles}
        activeProfile={activeProfile}
        activeProfileId={activeProfileId}
        activeProfileHistory={exerciseHistory}
        onActivateProfile={onActivateProfile}
        onCreateProfile={onCreateProfile}
      />;
    case 'database':
      return <ActivityDatabaseView dashboard={dashboard} />;
    case 'settings':
      return <RewardSettingsView dashboard={dashboard} />;
    case 'home':
    default:
      return <HomeView dashboard={dashboard} onNavigate={onNavigate} />;
  }
}

export default function App() {
  const [activePage, setActivePage] = useState<ChildPage>('home');
  const [isSideNavPinned, setIsSideNavPinned] = useState(true);
  const [profiles, setProfiles] = useState<ChildProfileConfig[]>(() => readProfilesFromStorage());
  const [activeProfileId, setActiveProfileId] = useState<string>(() => readActiveProfileIdFromStorage(FALLBACK_PROFILE.id));
  const [dashboardState, setDashboardState] = useState<ApiState<ChildDashboard>>({ status: 'loading' });
  const [profileExerciseHistory, setProfileExerciseHistory] = useState<ProfileExerciseHistoryMap>(() => readProfileExerciseHistoryFromStorage());

  const activeProfile = useMemo(() => {
    return profiles.find((profile) => profile.id === activeProfileId) ?? profiles[0] ?? FALLBACK_PROFILE;
  }, [profiles, activeProfileId]);

  const activeProfileHistory = profileExerciseHistory[activeProfile.id] ?? [];

  useEffect(() => {
    if (profiles.length === 0) return;

    if (!profiles.some((profile) => profile.id === activeProfileId)) {
      setActiveProfileId(profiles[0]!.id);
    }

    let cancelled = false;

    getChildDashboard(DASHBOARD_CHILD_ID)
      .then((dashboard) => {
        if (!cancelled) setDashboardState({ status: 'success', data: mergeProfileIntoDashboard(dashboard, activeProfile) });
      })
      .catch((error: unknown) => {
        if (!cancelled) setDashboardState({ status: 'error', message: error instanceof Error ? error.message : 'Impossible de charger le tableau de bord.' });
      });

    return () => { cancelled = true; };
  }, [activeProfile.id]);

  useEffect(() => {
    writeProfilesToStorage(profiles);
  }, [profiles]);

  useEffect(() => {
    writeActiveProfileIdToStorage(activeProfileId);
  }, [activeProfileId]);

  useEffect(() => {
    writeProfileExerciseHistoryToStorage(profileExerciseHistory);
  }, [profileExerciseHistory]);

  function createOrUpdateProfile(profile: Omit<ChildProfileConfig, 'id'>, profileId?: string) {
    const normalizedProfile = normalizeProfilePayload(profile);

    if (profileId) {
      setProfiles((currentProfiles) =>
        currentProfiles.map((currentProfile) =>
          currentProfile.id === profileId
            ? {
                ...currentProfile,
                ...normalizedProfile,
              }
            : currentProfile,
        ),
      );
      return;
    }

    const nextProfile: ChildProfileConfig = {
      id: cryptoSafeId(),
      ...normalizedProfile,
    };

    setProfiles((currentProfiles) => [...currentProfiles, nextProfile]);
    setActiveProfileId(nextProfile.id);
  }

  function logExerciseForActiveProfile(
    payload: {
      module: ExerciseHistoryModule;
      moduleLabel: string;
      exercise: string;
      resultLabel: string;
      status: ExerciseHistoryStatus;
      details: string;
    },
  ) {
    const normalizedProfileId = activeProfile.id;
    setProfileExerciseHistory((history) => addProfileHistoryRecord(history, normalizedProfileId, payload));
  }

  const shell = useMemo(() => {
    if (dashboardState.status === 'success') {
      return (
        <ActivePage
          page={activePage}
          dashboard={dashboardState.data}
          onNavigate={setActivePage}
          profiles={profiles}
          activeProfileId={activeProfileId}
          activeProfile={activeProfile}
          onActivateProfile={setActiveProfileId}
          onCreateProfile={createOrUpdateProfile}
          exerciseHistory={activeProfileHistory}
          onRecordExercise={logExerciseForActiveProfile}
        />
      );
    }
    if (dashboardState.status === 'loading') return <div className="state-card">Chargement de ton aventure…</div>;
    if (dashboardState.status === 'empty') return <div className="state-card">Aucune mission pour le moment.</div>;
    return <div className="state-card error">{dashboardState.message}</div>;
  }, [activePage, activeProfileId, activeProfile, dashboardState, profiles, activeProfileHistory]);

  const showSideNav = dashboardState.status === 'success';
  const layoutClassName = [
    activePage === 'multiplication'
      ? 'child-app-layout has-side-nav multiplication-app-layout'
      : activePage === 'dictation'
        ? 'child-app-layout has-side-nav dictation-app-layout'
        : showSideNav ? 'child-app-layout has-side-nav' : 'child-app-layout',
    showSideNav && !isSideNavPinned ? 'side-nav-compact-layout' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={layoutClassName}>
      {showSideNav ? (
        <ChildSideNav
          activePage={activePage}
          isPinned={isSideNavPinned}
          onNavigate={setActivePage}
          onTogglePinned={() => setIsSideNavPinned((isPinned) => !isPinned)}
        />
      ) : null}
      {showSideNav ? (
        <ActiveProfileSwitcher
          profiles={profiles}
          activeProfile={activeProfile}
          onActivateProfile={setActiveProfileId}
        />
      ) : null}
      <div className="child-app-shell">
        {shell}
      </div>
    </div>
  );
}
