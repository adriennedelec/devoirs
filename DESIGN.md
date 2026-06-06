# DESIGN.md — Devoirs

## Intention visuelle

L’application doit ressembler à une **aventure éducative douce**, pas à un logiciel scolaire adulte.

Les visuels sources du dossier `sources/interface enfant/` montrent une direction forte :

- univers magique, pastel, rassurant ;
- mascottes et personnages cartoon ;
- cartes blanches arrondies ;
- couleurs violettes, bleues, jaunes et vertes ;
- progression visible ;
- récompenses immédiates ;
- écrans conçus pour tablette / mobile.

Le design doit donner à l’enfant l’impression de :

> “Je pars en mission, je progresse, je gagne des étoiles, et je comprends mes devoirs.”

## Public cible

Priorité : enfants du primaire.

Conséquences UI :

- textes courts ;
- vocabulaire simple ;
- boutons larges ;
- icônes explicites ;
- feedback immédiat ;
- peu d’options simultanées ;
- contraste suffisant ;
- typographie arrondie et lisible ;
- animations légères, non distrayantes.

## Références visuelles analysées

### Interface enfant

- `dashboard enfant.png` : écran d’accueil principal enfant.
- `parcours.png` : chemin de progression pédagogique.
- `dashboard table multiplication.png` : hub de matière / tables de multiplication.
- `table multiplication revision.png` : exercice QCM avec feedback.
- `multiplication.png` : exercice de complétion de table.
- `apprendre poesie.png` : apprentissage guidé d’une poésie.
- `recite poesie.png` : récitation avec détection d’erreurs.
- `lecture.png` : lecture à voix haute avec score.
- `dictee.png` : dictée avec audio et zone d’écriture.
- `defi parents.png` : défi enfant vs parents.
- `gamification.png` : progression, niveaux, avatar, badges.
- `gamification2.png` : univers personnalisable.
- `vraie vie.png` : missions pédagogiques dans le quotidien.

### Autres sources à analyser ensuite

- `dashboard parents.png`
- `dashboard enseignant.png`
- `enseignant_preparer un devoir.png`
- `teacher dashboard.png`
- `evaluation DYS.png`
- `compere comere.jpg`

## Palette recommandée

Tokens de départ :

```css
:root {
  --color-bg: #f3efff;
  --color-bg-soft: #eef6ff;
  --color-card: #ffffff;
  --color-card-tint: #fff8ef;

  --color-primary: #7c5cff;
  --color-primary-dark: #4b3bc4;
  --color-secondary: #4cc9f0;

  --color-star: #ffbf3f;
  --color-success: #45c486;
  --color-warning: #ff9f43;
  --color-error: #ff6b6b;

  --color-text: #24324b;
  --color-text-muted: #6f7890;
  --color-border: #e4def8;
}
```

## Typographie

Direction : police arrondie, enfantine mais propre.

Recommandations possibles :

- `Nunito`
- `Quicksand`
- `Baloo 2` pour certains titres
- fallback : `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

Règles :

- titres très lisibles ;
- éviter les textes fins ;
- taille minimum confortable ;
- lignes courtes ;
- utiliser gras / couleurs pour guider l’œil.

## Structure d’écran enfant

### Layout mobile/tablette-first

Les écrans doivent être conçus d’abord pour un format portrait.

Structure recommandée :

```txt
AppShellEnfant
├── TopBar
│   ├── avatar / prénom
│   ├── étoiles
│   └── notifications
├── MainContent
│   ├── cartes / mission / exercice
│   └── mascotte / conseil
└── BottomNav
    ├── Accueil
    ├── Parcours
    ├── Récompenses
    ├── Progression
    └── Profil
```

Sur desktop :

- conserver un conteneur central façon tablette ;
- éviter d’étirer les cartes sur toute la largeur ;
- éventuellement ajouter un fond décoratif.

## Composants UI obligatoires

### Composants shell

- `ChildAppShell`
- `ChildTopBar`
- `ChildBottomNav`
- `PageHeader`
- `MascotTip`

### Composants progression

- `StarCounter`
- `ProgressRing`
- `ProgressBar`
- `DailyGoalCard`
- `LevelBadge`
- `StreakBadge`
- `AchievementBadge`

### Composants activités

- `ActivityCard`
- `LearningPathMap`
- `LearningPathStep`
- `SubjectHubCard`
- `ExerciseModeCard`

### Composants exercices

- `ExerciseCard`
- `AnswerChoice`
- `CorrectionFeedback`
- `HintCard`
- `AudioPlayerCard`
- `StepProgress`
- `RewardToast`

### Composants gamification

- `AvatarCard`
- `TreasureChestCard`
- `RewardGrid`
- `InventoryItem`
- `UniverseCard`
- `MissionCard`

## États UI à prévoir partout

Chaque écran API-compatible doit avoir :

- `loading` : chargement avec squelette doux ;
- `success` : contenu normal ;
- `empty` : aucun devoir / aucune mission ;
- `error` : message rassurant + action réessayer ;
- `locked` : contenu verrouillé ;
- `completed` : succès visible ;
- `inProgress` : progression claire.

## Écrans prioritaires

### 1. Dashboard enfant

Rôle : entrée principale.

Contenu :

- accueil personnalisé ;
- étoiles ;
- progression globale ;
- objectif du jour ;
- activités ;
- badges récents ;
- défi en cours ;
- rappels ;
- navigation basse.

### 2. Parcours

Rôle : montrer la progression long terme.

Contenu :

- étapes complétées ;
- étapes verrouillées ;
- matières ;
- étoiles ;
- objectif final ;
- encouragement mascotte.

### 3. Tables de multiplication

Rôle : hub matière.

Contenu :

- tables 2 à 10 ;
- état de maîtrise ;
- modes d’entraînement ;
- records ;
- astuces ;
- bouton continuer.

### 4. Exercice multiplication

Rôle : activité courte.

Contenu :

- question centrale ;
- réponses larges ;
- feedback immédiat ;
- étoiles gagnées ;
- astuce ;
- prochaine question.

Implémentation Lot 3 :

- entrée depuis la carte `Tables de multiplication` ;
- hub de tables en chips larges avec progression ;
- carte QCM centrale avec mascotte hibou ;
- réponses sous forme de gros boutons tactiles ;
- feedback `Bravo` / `Presque` jamais culpabilisant ;
- état `loading` pendant la préparation et la soumission.

### 5. Dictée

Rôle : écouter, écrire, corriger.

Contenu :

- audio ;
- consigne ;
- zone d’écriture ;
- indice ;
- correction ;
- récompense.

### 6. Poésie

Rôle : apprentissage en étapes.

Étapes :

1. écouter ;
2. comprendre ;
3. mémoriser ;
4. réciter.

La reconnaissance vocale réelle peut être simulée en V1.

### 7. Récompenses / progression

Rôle : motivation.

Contenu :

- avatar ;
- niveau ;
- étoiles ;
- badges ;
- streak ;
- objets débloqués.

## Règles de feedback enfant

### Succès

- message court ;
- animation douce ;
- couleur verte / jaune ;
- étoiles visibles ;
- encouragement précis.

Exemple :

```txt
Bravo ! Tu as trouvé 7 × 8 = 56. +10 étoiles
```

### Erreur

Ne jamais dire seulement “faux”.

Préférer :

```txt
Presque ! Regarde : 7 × 8, c’est 7 × 4 puis encore ×2.
```

### Progression

Toujours montrer le prochain pas :

```txt
Encore 2 bonnes réponses et tu débloques le badge Champion des tables.
```

## Accessibilité et DYS

Le projet devra intégrer tôt des options adaptées :

- police lisible / éventuellement OpenDyslexic en option ;
- interlignage augmenté ;
- consignes audio ;
- réduction des animations ;
- contraste renforcé ;
- texte segmenté ;
- mode sans timer ;
- correction bienveillante ;
- pictogrammes en plus du texte.

## API compatibility côté design

Aucun écran ne doit dépendre de contenu figé.

Tous les composants doivent recevoir des props issues de structures proches API :

```ts
type ChildDashboard = {
  child: ChildProfile;
  progress: GlobalProgress;
  dailyGoal: DailyGoal;
  activities: ActivitySummary[];
  recentBadges: Badge[];
  activeChallenge?: ChallengeSummary;
  reminders: Reminder[];
};
```

Les composants UI doivent ignorer la provenance des données :

```txt
mockData → service → composant
API réelle → service → composant
```

## À éviter

- UI adulte type dashboard SaaS ;
- trop de texte ;
- trop de statistiques visibles pour l’enfant ;
- gamification punitive ;
- timers obligatoires ;
- stockage voix/photo sans réflexion parentale ;
- composants qui contiennent directement les données métier ;
- pages impossibles à brancher à une API.

## Phrase de référence design

> Une interface magique, claire et rassurante, qui transforme les devoirs en petites missions guidées et récompensantes, tout en restant pédagogiquement sérieuse et techniquement branchable à une API.
