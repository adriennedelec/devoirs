import type { ChildDashboard } from '../types/api';
import type { DictationSession, PoetryLibraryText, PoetrySession } from '../types/language';
import type { MultiplicationSession } from '../types/multiplication';
import type { ReadingSession } from '../types/reading';

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
  welcomeMessage: 'Aujourd’hui, tu deviens gardienne des devoirs : une mission courte, un sourire, puis une récompense.',
  primaryMission: {
    id: 'mission-table-7',
    title: 'Mission principale',
    description: 'Réussis une mini-série de table de 7 pour illuminer ton parcours.',
    subject: 'multiplication',
    ctaLabel: 'Je commence ma mission',
    rewardStars: 10,
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
      description: 'Révise les tables avec 10 calculs magiques.',
      progressPercent: 68,
      status: 'in_progress',
      rewardStars: 10,
      route: '/activites/tables-multiplication',
      icon: '✖️',
    },
    {
      id: 'reading-story',
      subject: 'reading',
      title: 'Lecture',
      description: 'Lis une histoire courte puis réponds à 3 questions.',
      progressPercent: 35,
      status: 'in_progress',
      rewardStars: 8,
      route: '/activites/lecture',
      icon: '📖',
    },
    {
      id: 'poetry',
      subject: 'poetry',
      title: 'Poésie',
      description: 'Écoute, mémorise ligne par ligne puis récite en douceur.',
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
      description: 'Écoute la phrase puis observe la correction mot par mot.',
      progressPercent: 28,
      status: 'not_started',
      rewardStars: 6,
      route: '/activites/dictee',
      icon: '✍️',
    },
  ],
  learningWorlds: [
    { id: 'math-island', title: 'Île des calculs', description: 'Tables, calcul mental et petits défis numériques.', icon: '🏝️', status: 'in_progress', progressPercent: 74, unlockedBadges: 3 },
    { id: 'word-world', title: 'Monde des mots', description: 'Dictées, orthographe et phrases magiques.', icon: '🌈', status: 'available', progressPercent: 36, unlockedBadges: 1 },
    { id: 'story-forest', title: 'Forêt des histoires', description: 'Lecture, compréhension et imagination.', icon: '🌳', status: 'available', progressPercent: 25, unlockedBadges: 0 },
    { id: 'poetry-stage', title: 'Scène des poètes', description: 'Mémorisation et récitation sans stress.', icon: '🎭', status: 'locked', progressPercent: 10, unlockedBadges: 0 },
  ],
  recentBadges: [
    { id: 'fast', title: 'Rapide', description: '3 réponses justes de suite', icon: '⚡', unlocked: true },
    { id: 'persistent', title: 'Persévérante', description: '7 jours de suite', icon: '🔥', unlocked: true },
    { id: 'apprentice', title: 'Apprentie', description: 'Première mission terminée', icon: '🌟', unlocked: true },
  ],
  rewardShelf: [
    { id: 'owl-hat', title: 'Chapeau du hibou', description: 'Accessoire débloqué pour ta mascotte.', icon: '🎩', costStars: 80, status: 'unlocked' },
    { id: 'magic-pencil', title: 'Crayon magique', description: 'Débloqué après 3 dictées.', icon: '✏️', costStars: 140, status: 'unlocked' },
    { id: 'castle', title: 'Château des mots', description: 'À débloquer avec 200 étoiles.', icon: '🏰', costStars: 200, status: 'locked' },
  ],
  rewardHistory: [
    { id: 'hist-math', title: 'Table de 7 réussie', description: 'Tu as gagné 3 étoiles en tables.', earnedStars: 3, activityTitle: 'Tables de multiplication' },
    { id: 'hist-streak', title: 'Série de 7 jours', description: 'Tu as gardé ton élan toute la semaine.', earnedStars: 10, activityTitle: 'Objectif du jour' },
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

const multiplicationQuestions = [
  { id: 'q-7-8', table: 7, leftFactor: 7, rightFactor: 8, prompt: '7 × 8 = ?', options: [54, 56, 63, 48], rewardStars: 1 },
  { id: 'q-7-6', table: 7, leftFactor: 7, rightFactor: 6, prompt: '7 × 6 = ?', options: [36, 42, 49, 40], rewardStars: 1 },
  { id: 'q-7-9', table: 7, leftFactor: 7, rightFactor: 9, prompt: '7 × 9 = ?', options: [63, 56, 72, 64], rewardStars: 1 },
  { id: 'q-7-4', table: 7, leftFactor: 7, rightFactor: 4, prompt: '7 × 4 = ?', options: [21, 28, 32, 35], rewardStars: 1 },
  { id: 'q-7-7', table: 7, leftFactor: 7, rightFactor: 7, prompt: '7 × 7 = ?', options: [42, 48, 49, 56], rewardStars: 1 },
];

export const multiplicationSessionMock: MultiplicationSession = {
  childId: 'emma-demo',
  title: 'Tables de multiplication',
  mascotTip: 'Le hibou magique t’aide à retrouver le bon résultat. Respire, observe, choisis !',
  selectedTable: 7,
  availableTables: [
    { value: 2, label: 'Table de 2', progressPercent: 100, status: 'mastered', rewardStars: 1 },
    { value: 3, label: 'Table de 3', progressPercent: 82, status: 'in_progress', rewardStars: 1 },
    { value: 4, label: 'Table de 4', progressPercent: 64, status: 'in_progress', rewardStars: 1 },
    { value: 5, label: 'Table de 5', progressPercent: 72, status: 'in_progress', rewardStars: 1 },
    { value: 6, label: 'Table de 6', progressPercent: 24, status: 'not_started', rewardStars: 1 },
    { value: 7, label: 'Table de 7', progressPercent: 45, status: 'in_progress', rewardStars: 1 },
    { value: 8, label: 'Table de 8', progressPercent: 18, status: 'not_started', rewardStars: 1 },
    { value: 9, label: 'Table de 9', progressPercent: 10, status: 'not_started', rewardStars: 1 },
    { value: 10, label: 'Table de 10', progressPercent: 8, status: 'not_started', rewardStars: 1 },
  ],
  currentQuestion: multiplicationQuestions[0],
  questions: multiplicationQuestions,
  totalQuestions: multiplicationQuestions.length,
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


export const poetryLibraryTexts: PoetryLibraryText[] = [
  {
    id: 'la-cigale-et-la-fourmi',
    title: 'La Cigale et la Fourmi',
    author: 'Jean de La Fontaine',
    text: `La Cigale, ayant chanté
Tout l’été,
Se trouva fort dépourvue
Quand la bise fut venue.
Pas un seul petit morceau
De mouche ou de vermisseau.
Elle alla crier famine
Chez la Fourmi sa voisine,
La priant de lui prêter
Quelque grain pour subsister
Jusqu’à la saison nouvelle.
« Je vous paierai, lui dit-elle,
Avant l’août, foi d’animal,
Intérêt et principal. »
La Fourmi n’est pas prêteuse :
C’est là son moindre défaut.
« Que faisiez-vous au temps chaud ?
Dit-elle à cette emprunteuse.
— Nuit et jour à tout venant
Je chantais, ne vous déplaise.
— Vous chantiez ? j’en suis fort aise.
Eh bien ! dansez maintenant. »`,
  },
  {
    id: 'le-corbeau-et-le-renard',
    title: 'Le Corbeau et le Renard',
    author: 'Jean de La Fontaine',
    text: `Maître Corbeau, sur un arbre perché,
Tenait en son bec un fromage.
Maître Renard, par l’odeur alléché,
Lui tint à peu près ce langage :
« Hé ! bonjour, Monsieur du Corbeau.
Que vous êtes joli ! que vous me semblez beau !
Sans mentir, si votre ramage
Se rapporte à votre plumage,
Vous êtes le Phénix des hôtes de ces bois. »
À ces mots le Corbeau ne se sent pas de joie ;
Et pour montrer sa belle voix,
Il ouvre un large bec, laisse tomber sa proie.
Le Renard s’en saisit, et dit : « Mon bon Monsieur,
Apprenez que tout flatteur
Vit aux dépens de celui qui l’écoute.
Cette leçon vaut bien un fromage, sans doute. »
Le Corbeau honteux et confus
Jura, mais un peu tard, qu’on ne l’y prendrait plus.`,
  },
  {
    id: 'le-loup-et-lagneau',
    title: 'Le Loup et l’Agneau',
    author: 'Jean de La Fontaine',
    text: `La raison du plus fort est toujours la meilleure :
Nous l’allons montrer tout à l’heure.
Un Agneau se désaltérait
Dans le courant d’une onde pure.
Un Loup survient à jeun qui cherchait aventure,
Et que la faim en ces lieux attirait.
« Qui te rend si hardi de troubler mon breuvage ?
Dit cet animal plein de rage :
Tu seras châtié de ta témérité.
— Sire, répond l’Agneau, que Votre Majesté
Ne se mette pas en colère ;
Mais plutôt qu’elle considère
Que je me vas désaltérant
Dans le courant,
Plus de vingt pas au-dessous d’Elle ;
Et que par conséquent, en aucune façon,
Je ne puis troubler sa boisson.
— Tu la troubles, reprit cette bête cruelle,
Et je sais que de moi tu médis l’an passé.
— Comment l’aurais-je fait si je n’étais pas né ?
Reprit l’Agneau ; je tette encor ma mère.
— Si ce n’est toi, c’est donc ton frère.
— Je n’en ai point. — C’est donc quelqu’un des tiens :
Car vous ne m’épargnez guère,
Vous, vos bergers et vos chiens.
On me l’a dit : il faut que je me venge. »
Là-dessus, au fond des forêts
Le Loup l’emporte, et puis le mange,
Sans autre forme de procès.`,
  },
  {
    id: 'le-lievre-et-la-tortue',
    title: 'Le Lièvre et la Tortue',
    author: 'Jean de La Fontaine',
    text: `Rien ne sert de courir ; il faut partir à point.
Le Lièvre et la Tortue en sont un témoignage.
« Gageons, dit celle-ci, que vous n’atteindrez point
Sitôt que moi ce but. — Sitôt ? Êtes-vous sage ?
Repartit l’animal léger.
Ma commère, il vous faut purger
Avec quatre grains d’ellébore.
— Sage ou non, je parie encore. »
Ainsi fut fait ; et de tous deux
On mit près du but les enjeux.
Savoir quoi, ce n’est pas l’affaire,
Ni de quel juge l’on convint.
Notre Lièvre n’avait que quatre pas à faire ;
J’entends de ceux qu’il fait lorsque prêt d’être atteint
Il s’éloigne des chiens, les renvoie aux calendes,
Et leur fait arpenter les landes.
Ayant, dis-je, du temps de reste pour brouter,
Pour dormir et pour écouter
D’où vient le vent, il laisse la Tortue
Aller son train de Sénateur.
Elle part, elle s’évertue ;
Elle se hâte avec lenteur.
Lui cependant méprise une telle victoire,
Tient la gageure à peu de gloire,
Croit qu’il y va de son honneur
De partir tard. Il broute, il se repose,
Il s’amuse à toute autre chose
Qu’à la gageure. À la fin quand il vit
Que l’autre touchait presque au bout de la carrière,
Il partit comme un trait ; mais les élans qu’il fit
Furent vains : la Tortue arriva la première.`,
  },
  {
    id: 'la-grenouille-et-le-boeuf',
    title: 'La Grenouille qui veut se faire aussi grosse que le Bœuf',
    author: 'Jean de La Fontaine',
    text: `Une Grenouille vit un Bœuf
Qui lui sembla de belle taille.
Elle qui n’était pas grosse en tout comme un œuf,
Envieuse, s’étend, et s’enfle, et se travaille,
Pour égaler l’animal en grosseur,
Disant : « Regardez bien, ma sœur ;
Est-ce assez ? dites-moi ; n’y suis-je point encore ?
— Nenni. — M’y voici donc ? — Point du tout. — M’y voilà ?
— Vous n’en approchez point. » La chétive pécore
S’enfla si bien qu’elle creva.
Le monde est plein de gens qui ne sont pas plus sages :
Tout bourgeois veut bâtir comme les grands seigneurs,
Tout petit prince a des ambassadeurs,
Tout marquis veut avoir des pages.`,
  },
];

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
  practiceLines: [
    { id: 'line-1', label: 'Ligne 1', text: 'Le printemps réveille les jardins,', hiddenText: 'Le printemps réveille les …', status: 'known' },
    { id: 'line-2', label: 'Ligne 2', text: 'L’été fait danser la lumière,', hiddenText: 'L’été fait danser la …', status: 'practice' },
    { id: 'line-3', label: 'Ligne 3', text: 'L’automne colore les chemins,', hiddenText: 'L’automne colore les …', status: 'practice' },
    { id: 'line-4', label: 'Ligne 4', text: 'L’hiver chuchote près de la terre.', hiddenText: 'L’hiver chuchote près de …', status: 'locked' },
  ],
  memoryModes: ['Lire', 'Cacher des mots', 'Réciter'],
  rewardStars: 6,
};

export const readingSessionMock: ReadingSession = {
  childId: 'emma-demo',
  id: 'reading-dragon-1',
  title: 'Le dragon qui aimait les livres',
  instruction: 'Lis l’histoire courte, puis réponds aux questions de compréhension.',
  audioLabel: 'Écouter l’histoire',
  text: [
    'Dans la bibliothèque du village, un petit dragon gardait les livres rares.',
    'Chaque soir, il soufflait une flamme toute douce pour éclairer les pages.',
    'Un jour, Emma lui prêta un livre d’aventure et le dragon devint plus gentil avec tous les lecteurs.',
  ],
  questions: [
    { id: 'reading-q1', prompt: 'Où vit le dragon ?', options: ['Dans la bibliothèque', 'Dans la mer', 'Dans une fusée'], optionIds: ['library', 'sea', 'rocket'], correctOptionId: 'library' },
    { id: 'reading-q2', prompt: 'Qu’est-ce qu’Emma prête au dragon ?', options: ['Un livre', 'Un ballon', 'Une couronne'], optionIds: ['book', 'ball', 'crown'], correctOptionId: 'book' },
    { id: 'reading-q3', prompt: 'Que se passe-t-il à la fin ?', options: ['Il devient plus gentil', 'Il casse les livres', 'Il s’endort pour toujours'], optionIds: ['kindness', 'breaks', 'sleep'], correctOptionId: 'kindness' },
  ],
  rewardStars: 8,
};
