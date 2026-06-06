# Devoirs — application d’aide aux devoirs pour enfants

## Objectif

Créer une application web qui aide les enfants à faire leurs devoirs avec plaisir, en transformant les exercices scolaires en missions guidées, ludiques et progressives.

L’application doit rester :

- **enfant-first** : interface rassurante, claire, colorée, tactile ;
- **pédagogique** : progression réelle, feedback utile, correction compréhensible ;
- **gamifiée sans excès** : étoiles, badges, niveaux et défis au service des devoirs ;
- **parent / enseignant compatible** : suivi, préparation et accompagnement possibles ;
- **API-compatible dès le départ** : l’interface ne doit jamais être codée en logique fermée ; toute donnée affichée doit pouvoir venir d’une API.

## Dossier projet

Chemin local :

```txt
/Users/nedelecadrien/Documents/REPO/devoirs
```

Structure initiale :

```txt
devoirs/
├── README.md
├── DESIGN.md
├── CADRAGE.md
└── sources/
    ├── interface enfant/
    │   ├── dashboard enfant.png
    │   ├── parcours.png
    │   ├── dashboard table multiplication.png
    │   ├── table multiplication revision.png
    │   ├── multiplication.png
    │   ├── apprendre poesie.png
    │   ├── recite poesie.png
    │   ├── lecture.png
    │   ├── dictee.png
    │   ├── defi parents.png
    │   ├── gamification.png
    │   ├── gamification2.png
    │   └── vraie vie.png
    ├── dashboard parents.png
    ├── dashboard enseignant.png
    ├── enseignant_preparer un devoir.png
    ├── teacher dashboard.png
    ├── evaluation DYS.png
    └── compere comere.jpg
```

## Principes permanents du projet

### 1. Toujours documenter

Chaque évolution importante doit maintenir :

- `README.md` : vision produit, installation, architecture, commandes, état du projet ;
- `DESIGN.md` : direction visuelle, composants, écrans, règles UX/UI ;
- `CADRAGE.md` : décisions produit, MVP, périmètre, roadmap, contraintes.

### 2. API-compatible obligatoire

Même si la première version utilise des données mockées, elle doit être conçue comme si elle consommait déjà une API.

Règles :

- aucune donnée métier codée directement dans les composants visuels ;
- utiliser des types / schémas de données stables ;
- prévoir une couche `services` ou `apiClient` ;
- séparer UI, logique métier et données ;
- prévoir les états `loading`, `success`, `empty`, `error` ;
- éviter les structures impossibles à brancher à une API plus tard.

Exemples de ressources API à anticiper :

```txt
GET /api/children/:childId/dashboard
GET /api/children/:childId/activities
GET /api/children/:childId/progress
GET /api/children/:childId/rewards
GET /api/children/:childId/learning-path
GET /api/exercises/multiplication/tables/:table
POST /api/exercises/:exerciseId/attempts
GET /api/poems/:poemId
POST /api/reading-sessions
POST /api/dictations/:dictationId/attempts
```

## MVP recommandé

Première version fonctionnelle :

1. Dashboard enfant
2. Parcours pédagogique
3. Tables de multiplication
4. Exercice multiplication choix multiple
5. Dictée simple
6. Poésie : écouter / lire / mémoriser, récitation simulée
7. Progression / étoiles / badges simples

Phase suivante :

- reconnaissance vocale réelle ;
- lecture orale évaluée ;
- récitation corrigée ;
- compte parent ;
- compte enseignant ;
- défis famille ;
- missions dans la vraie vie ;
- univers personnalisable.

## Contraintes importantes

- Public : enfants, probablement primaire.
- UI : mobile/tablette-first, gros boutons, lisibilité maximale.
- Ton : encourageant, jamais culpabilisant.
- Confidentialité : prudence forte sur prénom, voix, photo, vidéo, suivi scolaire.
- Accessibilité : prévoir enfants DYS / difficultés de lecture dès la conception.
- API : tous les écrans doivent pouvoir être alimentés par backend ou mocks interchangeables.

## État actuel

Lots 1 à 11 réalisés : socle React/Vite TypeScript API-ready, shell enfant navigable avec **menu latéral fixe**, modules multiplication/dictée/poésie, puis validation renforcée de l’interface enfant avec cockpit quotidien, parcours gamifié, récompenses dynamiques, vraie lecture-compréhension, session multiplication complète, correction dictée mot par mot et mémorisation poésie ligne par ligne.

Évolution dictée validée ensuite : le module `Dictée magique` propose maintenant deux modes explicites, **Dictée de mots** et **Dictée normale**. La dictée de mots est le mode prioritaire et utilise toute la largeur disponible à droite du menu latéral : le parent saisit une série de mots ou les importe via **fichier/photo** ; un flux OCR API-ready détecte automatiquement les mots et remplit le champ `Série de mots`. La saisie est découpée en mots distincts dès qu’un séparateur apparaît (espace, retour ligne, virgule, point, slash, tiret, etc.), puis chaque mot est comparé au dictionnaire local/API-ready. Si un mot saisi ou OCRisé paraît inconnu, une carte **Mot à confirmer** demande au parent de vérifier/valider avant de continuer. Le parent choisit ensuite un ou plusieurs temps verbaux (`Présent`, `Imparfait`, `Passé composé`, `Futur`), puis l’app génère un **texte court, en bon français, contenant tous les mots une seule fois chacun**. Le texte généré reste **masqué par défaut pour l’élève** ; l’action principale côté enfant est `Lire le texte à l’élève`, avec une option `Afficher pour le parent` uniquement pour préparer/vérifier.

Évolution multiplication validée ensuite : l’écran `Tables de multiplication` garde le **design magique/premium** (fond violet→bleu pastel nuageux **continu sur toute la page**, étoiles, header compact, carte d’étoiles, sélecteur 2 à 10, cartes de progression condensées, personnages/robot/coffre et aide pédagogique) tout en conservant les fonctionnalités cœur : **menu latéral fixe visible**, navigation directe vers Tables/Dictée/Poésie, exercice par **question QCM** avec 4 réponses, auto-avance après bonne réponse et feedback doux en cas d’erreur. Chaque table de 2 à 10 lance désormais 10 calculs couvrant les facteurs 1 à 10 dans le désordre. Une erreur laisse l’enfant sur la même question jusqu’à réussite. Le score final compte uniquement les réussites du premier coup (`1` ou `0` par calcul), affiche la table complète avec les calculs à retravailler en rouge et ajoute en bas de l’écran un **historique des tables réalisées** avec date/heure, réponses justes, réponses fausses, score obtenu, temps passé et détail des calculs `1 × table` à `10 × table` en vert/rouge.

Le projet contient maintenant :

```txt
src/
├── main.tsx
├── App.tsx
├── services/
│   ├── apiClient.ts
│   ├── childService.ts
│   └── mockData.ts
├── styles/
│   ├── tokens.css
│   ├── base.css
│   └── child-app.css
└── types/
    ├── activity.ts
    ├── api.ts
    ├── child.ts
    ├── language.ts
    ├── learningPath.ts
    ├── multiplication.ts
    ├── reading.ts
    └── reward.ts

tests/
├── App.test.tsx
├── child-experience-lots.test.ts
├── child-interface-lots-ui.test.tsx
├── childService.test.ts
├── language-modules.test.ts
├── language-modules-ui.test.tsx
├── multiplication.test.ts
├── multiplication-ui.test.tsx
└── navigation.test.tsx
```

## Commandes

Installer les dépendances :

```bash
npm install
```

Lancer l’app localement :

```bash
npm run dev
```

URL locale prévue :

```txt
http://127.0.0.1:5175
```

Lancer les tests :

```bash
npm test
```

Vérifier le build :

```bash
npm run build
```

## Architecture API-compatible actuelle

- `src/services/apiClient.ts` contient la couche API simulée.
- `src/services/childService.ts` expose `getChildDashboard(childId)`, `getMultiplicationSession(childId, table?)`, `submitMultiplicationAnswer(childId, submission)`, `getDictationSession(childId)`, `submitDictationAnswer(childId, submission)`, `getPoetrySession(childId)`, `submitPoetryRecital(childId, submission)`, `getReadingSession(childId)` et `submitReadingAnswers(childId, submission)`.
- `src/services/mockData.ts` contient des fixtures structurées comme des réponses API : cockpit enfant, mondes de parcours, boutique de récompenses, sessions multiplication/dictée/poésie/lecture.
- `src/types/` contient les contrats métier, dont `multiplication.ts`, `language.ts`, `reading.ts` et `learningPath.ts`.
- `src/App.tsx` consomme les services asynchrones et gère les états `loading`, `success`, `empty`, `error`.

Prochaine étape recommandée : **Lot 12 — robustesse UX transversale** (`loading`, `empty`, `error`, `success` harmonisés sur toutes les pages), puis accessibilité/confort et polish final enfant avant parents/enseignants.

## Lot 2 réalisé

Le shell enfant est maintenant navigable :

- `Accueil` : dashboard enfant existant ;
- `Parcours` : première vue de chemin pédagogique ;
- `Récompenses` : badges, niveau et récompense verrouillée ;
- `Lecture` : page placeholder API-ready pour futur module lecture orale ;
- `Profil` : carte enfant sécurisée.

La navigation est encore locale côté React, volontairement simple pour le MVP. Elle garde néanmoins un contrat API-ready : les pages consomment le même `ChildDashboard` chargé par `childService.ts`, et pourront ensuite être séparées en routes/services dédiés.

## Lot 3 réalisé

Premier module pédagogique interactif disponible depuis la carte `Tables de multiplication` de l’accueil :

- hub des tables 2 à 9 avec état de progression ;
- table 7 sélectionnée dans la fixture initiale ;
- exercice QCM `7 × 8 = ?` ;
- soumission de réponse via `submitMultiplicationAnswer` ;
- feedback immédiat positif ou correctif ;
- étoiles gagnées via le résultat de tentative ;
- tests service + UI pour verrouiller le contrat API et l’expérience enfant.

La donnée métier reste dans `mockData.ts` et passe par `childService.ts`. L’écran pourra donc évoluer vers un vrai backend sans réécrire l’interface.

## Lot 4 réalisé

Deux modules guidés ont été ajoutés depuis les cartes de l’accueil :

- **Dictée magique** : session audio simulée, indices, zone de saisie, correction douce et étoiles ;
- **Poésie des saisons** : texte en lignes, étapes écouter/comprendre/mémoriser/réciter et récitation simulée ;
- services mock API dédiés pour charger les sessions et soumettre les résultats ;
- type `language.ts` pour les contrats dictée/poésie ;
- tests service + UI pour verrouiller le comportement enfant-first.

La reconnaissance vocale et l’audio réel restent simulés en V1, conformément au cadrage confidentialité / MVP.

## Lots 5 à 11 réalisés — validation complète interface enfant

Adrien a demandé de finaliser l’expérience enfant avant de passer aux parents/enseignants. Les lots 5 à 11 renforcent donc toute la partie enfant :

- **Lot 5 — Accueil cockpit quotidien** : message du jour, mission principale, CTA `Je commence ma mission`, progression et mascotte.
- **Lot 6 — Parcours gamifié** : mondes pédagogiques (`Île des calculs`, `Monde des mots`, `Forêt des histoires`, `Scène des poètes`) avec statut, progression et badges.
- **Lot 7 — Récompenses dynamiques** : boutique magique, objets débloqués/verrouillés et historique récent des étoiles.
- **Lot 8 — Lecture** : module `Le dragon qui aimait les livres`, histoire courte, audio simulé, 3 questions de compréhension et feedback.
- **Lot 9 — Multiplication enrichie** : mini-série de 5 questions, progression `Question 1 sur 5`, bouton question suivante et résumé final de série.
- **Lot 10 — Dictée enrichie** : correction mot par mot, détection accent/ponctuation, bouton `Réessayer doucement`.
- **Lot 11 — Poésie enrichie** : mémorisation ligne par ligne, modes `Lire`, `Cacher des mots`, `Réciter`.

Tests ajoutés :

```txt
tests/child-experience-lots.test.ts
tests/child-interface-lots-ui.test.tsx
```

Ces lots restent API-compatibles : les nouvelles données sont typées, mockées dans `mockData.ts` et consommées via `childService.ts`.
