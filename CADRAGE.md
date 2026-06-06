# CADRAGE.md — Devoirs

## Décision de cadrage

Ce projet est une application web destinée à aider les enfants à faire leurs devoirs.

Le projet vit dans :

```txt
/Users/nedelecadrien/Documents/REPO/devoirs
```

Cette session / ce topic Telegram est réservé exclusivement à ce projet.

## Vision produit

Créer une application qui transforme les devoirs en parcours ludique : l’enfant avance dans des activités courtes, reçoit de l’aide, gagne des étoiles, débloque des badges et peut réviser sans sensation de punition.

L’application doit pouvoir accompagner plusieurs types de devoirs :

- calcul mental ;
- tables de multiplication ;
- dictée ;
- poésie ;
- lecture à voix haute ;
- orthographe ;
- conjugaison ;
- grammaire ;
- missions pédagogiques dans la vraie vie ;
- défis avec les parents ;
- préparation / suivi côté parents et enseignants.

## Positionnement

Phrase courte :

> L’app qui aide les enfants à faire leurs devoirs avec plaisir, en transformant chaque exercice en mission guidée, encourageante et récompensante.

Différenciation :

- plus engageant qu’une fiche d’exercices ;
- moins froid qu’un logiciel scolaire ;
- plus guidé qu’un simple chatbot ;
- conçu pour enfant, parent et enseignant ;
- pensé dès le départ comme une application API-compatible.

## Publics

### Enfant

Objectif : faire ses devoirs, comprendre, progresser, rester motivé.

Besoins :

- interface simple ;
- encouragement ;
- feedback immédiat ;
- récompenses ;
- activités courtes ;
- consignes audio / visuelles ;
- sentiment de progression.

### Parent

Objectif : suivre, aider, encourager, comprendre les difficultés.

Besoins probables :

- voir ce qui a été fait ;
- voir les points faibles ;
- lancer des défis ;
- paramétrer les devoirs ;
- recevoir un résumé ;
- éviter que l’enfant soit seul face à l’écran.

### Enseignant

Objectif : préparer ou recommander des exercices / devoirs.

Besoins probables :

- créer un devoir ;
- choisir une matière / niveau ;
- suivre une classe ou un groupe ;
- détecter des difficultés ;
- adapter pour DYS / besoins spécifiques.

## Sources visuelles déjà analysées

Dossier :

```txt
sources/interface enfant/
```

Images analysées :

- dashboard enfant ;
- parcours ;
- dashboard table multiplication ;
- exercice table multiplication ;
- révision table multiplication ;
- apprendre poésie ;
- réciter poésie ;
- lecture ;
- dictée ;
- défi parents ;
- progression gamifiée ;
- univers personnalisable ;
- missions vraie vie.

Les autres visuels du dossier `sources/` devront être analysés ensuite pour cadrer les interfaces parent, enseignant et DYS.

## Principes non négociables

### 1. Documentation permanente

Le projet doit toujours contenir et maintenir :

- `README.md`
- `DESIGN.md`
- `CADRAGE.md`

### 2. API-compatible permanent

L’application doit être conçue pour pouvoir passer de données mockées à une API sans refonte.

Règles obligatoires :

- types de données explicites ;
- services séparés des composants ;
- composants pilotés par props ;
- aucun contenu métier codé en dur dans les composants ;
- mocks structurés comme des réponses API ;
- états loading / empty / error / success prévus ;
- endpoints pensés dès le cadrage ;
- actions utilisateur modélisées comme requêtes ou mutations.

### 3. Enfant-first

L’interface enfant prime sur une logique de back-office.

Règles :

- gros boutons ;
- cartes visuelles ;
- phrases courtes ;
- feedback positif ;
- mascotte / aide ;
- navigation simple ;
- progression visible ;
- pas de surcharge analytique côté enfant.

### 4. Pédagogie avant jeu

La gamification sert la progression, elle ne doit pas remplacer l’apprentissage.

Les étoiles, badges et niveaux doivent récompenser :

- l’effort ;
- la régularité ;
- la compréhension ;
- l’amélioration ;
- la persévérance.

Pas seulement la vitesse.

### 5. Confidentialité enfant

Attention forte sur :

- prénom ;
- voix ;
- photo ;
- vidéo ;
- performance scolaire ;
- suivi parent / enseignant.

Toute fonctionnalité vocale ou photo doit prévoir consentement, minimisation des données et logique parentale.

## MVP recommandé

### Objectif MVP

Construire une première maquette web crédible et navigable, avec une vraie structure API-ready, centrée sur l’interface enfant.

### Périmètre MVP

#### 1. Accueil enfant

- Bonjour prénom ;
- étoiles ;
- progression globale ;
- objectif du jour ;
- activités ;
- badges ;
- défi / rappel ;
- navigation.

#### 2. Parcours

- chemin d’étapes ;
- étapes complétées / disponibles / verrouillées ;
- progression globale ;
- encouragement.

#### 3. Tables de multiplication

- hub des tables 2 à 10 ;
- état de maîtrise ;
- modes d’entraînement ;
- records ;
- astuces.

#### 4. Exercice multiplication

- question QCM ;
- correction immédiate ;
- étoiles ;
- astuce ;
- progression de série.

#### 5. Dictée

- audio ;
- zone d’écriture ;
- indice ;
- correction ;
- récompense.

#### 6. Poésie

- étape écouter ;
- texte ;
- mémorisation ;
- récitation simulée ;
- score fictif ou feedback simple.

#### 7. Progression / récompenses

- avatar ;
- niveau ;
- étoiles ;
- badges ;
- streak ;
- objets débloqués simples.

## Hors MVP / phase 2

- reconnaissance vocale réelle ;
- lecture orale évaluée ;
- récitation corrigée automatiquement ;
- dashboard parent complet ;
- dashboard enseignant complet ;
- création de devoir enseignant ;
- mode DYS complet ;
- défis parent/enfant persistants ;
- univers personnalisable drag & drop ;
- upload photo / vidéo ;
- IA générative de devoirs.

## Architecture API-compatible recommandée

Même avec un frontend seul, prévoir :

```txt
src/
├── app/
│   ├── routes ou pages
│   └── providers
├── components/
│   ├── ui/
│   └── layout/
├── features/
│   ├── child-dashboard/
│   ├── learning-path/
│   ├── multiplication/
│   ├── dictation/
│   ├── poetry/
│   ├── reading/
│   ├── rewards/
│   └── shared/
├── services/
│   ├── apiClient.ts
│   ├── childService.ts
│   ├── exerciseService.ts
│   └── mockData.ts
├── types/
│   ├── child.ts
│   ├── activity.ts
│   ├── exercise.ts
│   ├── progress.ts
│   ├── reward.ts
│   └── api.ts
└── tests/
```

## Modèles de données à prévoir

### Enfant

```ts
type ChildProfile = {
  id: string;
  firstName: string;
  avatarUrl?: string;
  level: number;
  title: string;
  stars: number;
  streakDays: number;
};
```

### Dashboard

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

### Activité

```ts
type ActivitySummary = {
  id: string;
  subject: 'math' | 'dictation' | 'poetry' | 'reading' | 'orthography' | 'grammar';
  title: string;
  description: string;
  progressPercent: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'locked';
  rewardStars: number;
  route: string;
};
```

### Exercice

```ts
type Exercise = {
  id: string;
  type: 'multiple_choice' | 'text_input' | 'audio_reading' | 'dictation' | 'poetry_recital';
  subject: string;
  instruction: string;
  question?: string;
  choices?: AnswerChoice[];
  expectedAnswer?: string;
  hint?: string;
  rewardStars: number;
};
```

### Tentative

```ts
type ExerciseAttempt = {
  exerciseId: string;
  childId: string;
  answer: string | string[];
  durationMs?: number;
  score?: number;
};
```

## Endpoints API à anticiper

```txt
GET    /api/children/:childId/dashboard
GET    /api/children/:childId/learning-path
GET    /api/children/:childId/rewards
GET    /api/children/:childId/progress

GET    /api/activities
GET    /api/activities/:activityId

GET    /api/exercises/:exerciseId
POST   /api/exercises/:exerciseId/attempts

GET    /api/multiplication/tables
GET    /api/multiplication/tables/:table
POST   /api/multiplication/attempts

GET    /api/dictations/:dictationId
POST   /api/dictations/:dictationId/attempts

GET    /api/poems/:poemId
POST   /api/poems/:poemId/recitals

GET    /api/parents/:parentId/children
GET    /api/teachers/:teacherId/classes
```

## Critères d’acceptation pour toute première implémentation

- Le projet contient `README.md`, `DESIGN.md`, `CADRAGE.md`.
- Les écrans sont alimentés par mocks structurés comme API.
- Les types métier existent.
- Les composants ne contiennent pas de données métier figées.
- Le design respecte les visuels source enfant.
- L’interface est responsive mobile/tablette.
- Les états loading / error / empty existent au moins au niveau structurel.
- La navigation enfant est claire.
- Les fonctionnalités vocales complexes sont simulées si nécessaire.

## Roadmap proposée

### Lot 1 — Cadrage et socle

Statut : démarré.

Réalisé :

- README / DESIGN / CADRAGE ;
- socle React/Vite TypeScript ;
- tests Vitest + Testing Library ;
- types métier initiaux ;
- service mock API `getChildDashboard(childId)` ;
- shell enfant initial ;
- dashboard enfant initial alimenté par données mockées ;
- états `loading`, `success`, `empty`, `error` prévus dans le modèle UI.

À compléter dans les prochains lots :

- navigation réelle entre pages ;
- séparation progressive en composants/fonctionnalités ;
- parcours, récompenses, multiplication, dictée, poésie.

### Lot 2 — Maquette enfant navigable

Statut : réalisé.

Réalisé :

- navigation basse interactive ;
- page `Accueil` ;
- page `Parcours` ;
- page `Récompenses` ;
- page `Lecture` placeholder ;
- page `Profil` ;
- test de navigation utilisateur ;
- maintien du chargement API mock unique via `childService.ts`.

À approfondir plus tard :

- extraction des pages dans `features/` ;
- routing URL réel si nécessaire ;
- données dédiées par page quand les services API seront séparés.

### Lot 3 — Tables de multiplication

- hub tables ;
- exercice QCM ;
- correction ;
- progression ;
- étoiles.

### Lot 4 — Dictée et poésie

- dictée simple ;
- poésie écouter / mémoriser ;
- récitation simulée.

### Lot 5 — Parent / enseignant

- analyse des sources parent / enseignant ;
- cadrage dashboards ;
- suivi enfant ;
- préparation devoir.

### Lot 6 — Fonctions avancées

- voix réelle ;
- lecture orale ;
- DYS ;
- défis famille ;
- missions vraie vie ;
- univers personnalisable.

## Décisions ouvertes

À décider avant développement complet :

1. Stack : React/Vite, Next.js, autre ?
2. Auth : enfant seul, parent-enfant, enseignant-classe ?
3. Âge cible précis : CP/CE1/CE2/CM1/CM2 ?
4. Priorité métier : devoir maison, entraînement autonome, suivi parent, usage enseignant ?
5. Données : local-first, backend simple, Supabase/Firebase, API custom ?
6. IA : absente au début, aide contextuelle, correction, génération d’exercices ?
7. Vocale : simulée en V1 ou intégrée tôt ?

## Décision actuelle recommandée

Pour avancer vite :

- commencer par une **maquette web enfant API-ready** ;
- utiliser des mocks typés ;
- ne pas intégrer encore voix réelle / auth complexe ;
- reproduire l’univers visuel des sources enfant ;
- garder les dashboards parent / enseignant pour le cadrage suivant.
