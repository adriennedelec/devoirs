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
├── SideNav
│   ├── mascotte / marque
│   ├── Accueil
│   ├── Parcours
│   ├── Récompenses
│   ├── Lecture
│   └── Profil
├── TopBar
│   ├── avatar / prénom
│   ├── étoiles
│   └── notifications
└── MainContent
    ├── cartes / mission / exercice
    └── mascotte / conseil
```

Règle actuelle : la navigation principale est un **menu latéral fixe**, plus lisible sur desktop/tablette et compactée en rail vertical sur petits écrans. Il ne doit plus revenir en barre basse sauf demande explicite.

Sur desktop :

- conserver un conteneur central façon tablette ;
- placer le contenu à droite du rail latéral ;
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

### Écran Tables de multiplication — refonte magique

L’écran `Tables de multiplication` doit garder le **design magique premium** tout en restant dans le shell enfant standard : le **menu latéral fixe reste visible** pour ne pas casser la navigation globale.

Structure visuelle :

- fond dégradé violet pastel `#7A5AF8` / lavande / bleu clair `#DFF2FF`, texture nuageuse légère et étoiles scintillantes ;
- header très grand (`48px+`) avec titre `Tables de multiplication`, sous-titre encourageant et carte `⭐ 125 Étoiles` ;
- sélecteur horizontal de tables `2` à `10`, boutons blancs arrondis, état actif en dégradé violet ;
- trois cartes de progression : objectif du jour, série actuelle, niveau joueur ;
- grande carte exercice blanche `32px` avec personnage enfant, robot, coffre, bulle BD et carte aide ;
- fond magique violet → bleu pastel appliqué à tout le layout multiplication pour éviter tout effet de “bloc” ou délimitation blanche autour de la zone ;
- header plus compact que la première version XXL afin de réduire le scroll sans perdre l’effet premium ;
- sélecteur de table horizontal 2 à 10 avec boutons condensés ;
- trois cartes de progression condensées en ligne ;
- grande carte d’exercice en 2 colonnes mais avec espacements réduits : bulle d’encouragement + personnages + aide/chrono à gauche, question QCM à droite ;
- une **question de multiplication à la fois** (`7 × 8 = ?`) avec 4 boutons QCM larges et rassurants ;
- bande de progression `1×` à `10×` pour montrer les facteurs déjà réussis / à revoir ;
- bouton `Écouter la question` violet ;
- chronomètre latéral qui affiche `00:00` au départ et démarre dès le premier clic de réponse ;
- tableau bas `Historique des tables réalisées` listant, pour chaque table terminée, la date/heure, les réponses justes, les réponses fausses, le score obtenu, le temps passé et les calculs `1 × table` à `10 × table` avec chips vertes/rouges ;
- conservation de la navigation directe vers `Tables`, `Dictée`, `Poésie` dans le menu latéral.

Règle UX : une bonne réponse avance automatiquement à la question suivante ; une erreur garde la même question active. Le chrono ne démarre pas au chargement de l’écran mais au premier essai de réponse. Le fond magique doit se prolonger sur toute la page (y compris derrière le shell à droite du menu) sans bordure visuelle de conteneur. Le score final reste basé sur la réussite du premier coup, la table complète marque les calculs à revoir en rouge, puis le tableau d’historique sert de carnet de progrès lisible sans transformer l’écran enfant en dashboard adulte.

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
- mission principale avec CTA immédiat ;
- activités ;
- badges récents ;
- défi en cours ;
- rappels ;
- navigation basse.

Implémentation Lot 5 : cockpit quotidien avec message `Aujourd’hui...`, carte mission principale, CTA `Je commence ma mission`, mascotte et progression claire.

### 2. Parcours

Rôle : montrer la progression long terme.

Contenu :

- étapes complétées ;
- étapes verrouillées ;
- matières ;
- étoiles ;
- objectif final ;
- encouragement mascotte.

Implémentation Lot 6 : parcours par mondes (`Île des calculs`, `Monde des mots`, `Forêt des histoires`, `Scène des poètes`) avec progression, statut et badges débloqués.

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

Implémentation Lot 3 puis Lot 9 :

- entrée depuis la carte `Tables de multiplication` ;
- hub de tables en chips larges avec progression ;
- mini-série de 8 questions avec indicateur `Question N sur 8` ;
- chaque série couvre toute la table de `2 × table` à `9 × table`, dans un ordre mélangé ;
- carte QCM centrale avec mascotte hibou ;
- réponses sous forme de gros boutons tactiles ;
- feedback `Bravo` / `Presque` jamais culpabilisant ;
- une erreur garde la même question active jusqu’à ce que l’enfant trouve juste ;
- une bonne réponse intermédiaire fait avancer automatiquement, sans bouton manuel `Question suivante` ;
- résumé final `Série terminée !` avec score sur 8 ;
- table complète affichée en fin de session, avec calculs manqués au premier essai en rouge ;
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

Implémentation Lot 4 puis Lot 10 :

- bouton `Écouter la phrase` simulé ;
- indices visibles en pastilles ;
- grande zone `Ta phrase` ;
- correction douce avec texte corrigé ;
- correction mot par mot avec statuts `correct`, accent/ponctuation, mot différent ou manquant ;
- bouton `Réessayer doucement` ;
- feedback `Super dictée !` ou `Très proche !` ;
- pas d’audio réel ni stockage vocal en V1.


### 6. Lecture

Rôle : lire, comprendre, répondre.

Implémentation Lot 8 : module `Le dragon qui aimait les livres`, audio simulé `Écouter l’histoire`, texte court en paragraphes, 3 questions de compréhension et feedback final.

### 7. Poésie

Rôle : apprentissage en étapes.

Étapes :

1. écouter ;
2. comprendre ;
3. mémoriser ;
4. réciter.

La reconnaissance vocale réelle peut être simulée en V1.

Implémentation Lot 4 puis Lot 11 :

- poésie affichée en lignes courtes dans une carte douce ;
- étapes visibles `Écouter`, `Comprendre`, `Mémoriser`, `Réciter` ;
- mémorisation ligne par ligne (`Ligne 1`, `Ligne 2`, etc.) ;
- modes `Lire`, `Cacher des mots`, `Réciter` ;
- bouton `J’ai récité ma poésie` ;
- feedback immédiat et étoiles ;
- récitation simulée sans enregistrement vocal.


### 7. Récompenses / progression

Rôle : motivation.

Contenu :

- avatar ;
- niveau ;
- étoiles ;
- badges ;
- streak ;
- objets débloqués.

Implémentation Lot 7 : boutique magique avec récompenses débloquées/verrouillées, coûts en étoiles et historique récent des gains.

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
