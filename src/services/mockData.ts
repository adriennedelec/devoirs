import type { ChildDashboard } from '../types/api';
import type { DictationSession, PoetrySession } from '../types/language';
import type { MultiplicationSession } from '../types/multiplication';

export const childDashboardMock: ChildDashboard = {
  child: {
    id: 'emma-demo',
    firstName: 'Emma',
    avatarEmoji: '🧒',
    level: 7,
    title: 'Exploratrice des mots',
    stars: 125,
    streakDays: 7,
  },
  progress: {
    percent: 68,
    starsEarned: 125,
    objectivesCompleted: 17,
    streakDays: 7,
  },
  dailyGoal: {
    id: 'goal-two-activities',
    title: 'Mon objectif du jour',
    description: 'Termine 2 activités et gagne 20 étoiles !',
    currentCount: 1,
    targetCount: 2,
    rewardStars: 20,
  },
  activities: [
    {
      id: 'mental-math',
      subject: 'math',
      title: 'Calcul mental',
      description: 'Réchauffe ton cerveau avec des petits calculs.',
      progressPercent: 72,
      status: 'in_progress',
      rewardStars: 8,
      route: '/activites/calcul-mental',
      icon: '🧮',
    },
    {
      id: 'multiplication-tables',
      subject: 'multiplication',
      title: 'Tables de multiplication',
      description: 'Révise les tables et deviens championne.',
      progressPercent: 68,
      status: 'in_progress',
      rewardStars: 10,
      route: '/activites/tables-multiplication',
      icon: '✖️',
    },
    {
      id: 'poetry',
      subject: 'poetry',
      title: 'Poésie',
      description: 'Écoute, mémorise puis récite en douceur.',
      progressPercent: 42,
      status: 'in_progress',
      rewardStars: 12,
      route: '/activites/poesie',
      icon: '🎙️',
    },
    {
      id: 'dictation',
      subject: 'dictation',
      title: 'Dictée',
      description: 'Écoute la phrase puis écris-la dans ton cahier magique.',
      progressPercent: 28,
      status: 'not_started',
      rewardStars: 6,
      route: '/activites/dictee',
      icon: '✍️',
    },
  ],
  recentBadges: [
    { id: 'fast', title: 'Rapide', description: '3 réponses justes de suite', icon: '⚡', unlocked: true },
    { id: 'persistent', title: 'Persévérante', description: '7 jours de suite', icon: '🔥', unlocked: true },
    { id: 'apprentice', title: 'Apprentie', description: 'Première mission terminée', icon: '🌟', unlocked: true },
  ],
  activeChallenge: {
    id: 'champions',
    title: 'Défi des champions',
    description: 'Réussis 5 défis cette semaine.',
    currentCount: 3,
    targetCount: 5,
    rewardStars: 30,
  },
  reminders: [
    { id: 'quiz', title: 'Quiz du jour', description: 'Un mini quiz t’attend.', kind: 'quiz' },
    { id: 'homework', title: 'À ne pas oublier', description: 'Revoir la table de 7.', kind: 'homework' },
  ],
};

export const multiplicationSessionMock: MultiplicationSession = {
  childId: 'emma-demo',
  title: 'Tables de multiplication',
  mascotTip: 'Le hibou magique t’aide à retrouver le bon résultat. Respire, observe, choisis !',
  selectedTable: 7,
  availableTables: [
    { value: 2, label: 'Table de 2', progressPercent: 100, status: 'mastered', rewardStars: 2 },
    { value: 3, label: 'Table de 3', progressPercent: 82, status: 'in_progress', rewardStars: 2 },
    { value: 4, label: 'Table de 4', progressPercent: 64, status: 'in_progress', rewardStars: 2 },
    { value: 5, label: 'Table de 5', progressPercent: 72, status: 'in_progress', rewardStars: 2 },
    { value: 6, label: 'Table de 6', progressPercent: 24, status: 'not_started', rewardStars: 3 },
    { value: 7, label: 'Table de 7', progressPercent: 45, status: 'in_progress', rewardStars: 3 },
    { value: 8, label: 'Table de 8', progressPercent: 18, status: 'not_started', rewardStars: 3 },
    { value: 9, label: 'Table de 9', progressPercent: 10, status: 'not_started', rewardStars: 3 },
  ],
  currentQuestion: {
    id: 'q-7-8',
    table: 7,
    leftFactor: 7,
    rightFactor: 8,
    prompt: '7 × 8 = ?',
    options: [54, 56, 63, 48],
    rewardStars: 3,
  },
};

export const dictationSessionMock: DictationSession = {
  childId: 'emma-demo',
  id: 'dictation-forest-1',
  title: 'Dictée de la forêt magique',
  instruction: 'Écoute la phrase puis écris-la dans ton cahier magique.',
  audioLabel: 'Écouter la phrase',
  expectedText: 'Le petit renard traverse la forêt.',
  hints: ['La phrase commence par une majuscule.', 'Il y a un accent circonflexe dans forêt.', 'N’oublie pas le point final.'],
  rewardStars: 4,
};

export const poetrySessionMock: PoetrySession = {
  childId: 'emma-demo',
  poemId: 'poem-seasons-1',
  title: 'Poésie des saisons',
  instruction: 'Écoute, comprends, mémorise puis récite quand tu te sens prête.',
  lines: [
    'Le printemps réveille les jardins,',
    'L’été fait danser la lumière,',
    'L’automne colore les chemins,',
    'L’hiver chuchote près de la terre.',
  ],
  steps: [
    { id: 'listen', label: 'Écouter', description: 'Lis la poésie à voix basse ou écoute un adulte.', status: 'completed' },
    { id: 'understand', label: 'Comprendre', description: 'Repère les saisons et les images.', status: 'completed' },
    { id: 'memorize', label: 'Mémoriser', description: 'Cache une ligne puis essaie de la redire.', status: 'current' },
    { id: 'recite', label: 'Réciter', description: 'Récite calmement, sans chrono.', status: 'locked' },
  ],
  rewardStars: 6,
};
