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

Lot 1 démarré : socle React/Vite TypeScript API-ready.

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
    └── reward.ts

tests/
├── App.test.tsx
└── childService.test.ts
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
- `src/services/childService.ts` expose `getChildDashboard(childId)`.
- `src/services/mockData.ts` contient des fixtures structurées comme des réponses API.
- `src/types/` contient les contrats métier.
- `src/App.tsx` consomme le service asynchrone et gère les états `loading`, `success`, `empty`, `error`.

Prochaine étape recommandée : **Lot 3 — Tables de multiplication** avec hub des tables, exercice QCM et soumission d’une tentative via service mock API.

## Lot 2 réalisé

Le shell enfant est maintenant navigable :

- `Accueil` : dashboard enfant existant ;
- `Parcours` : première vue de chemin pédagogique ;
- `Récompenses` : badges, niveau et récompense verrouillée ;
- `Lecture` : page placeholder API-ready pour futur module lecture orale ;
- `Profil` : carte enfant sécurisée.

La navigation est encore locale côté React, volontairement simple pour le MVP. Elle garde néanmoins un contrat API-ready : les pages consomment le même `ChildDashboard` chargé par `childService.ts`, et pourront ensuite être séparées en routes/services dédiés.
