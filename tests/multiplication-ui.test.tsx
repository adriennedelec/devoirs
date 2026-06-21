import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../src/App';

declare const process: { cwd: () => string };
declare function require(moduleName: string): { readFileSync?: (path: string, encoding: string) => string; resolve?: (...paths: string[]) => string };
const { readFileSync } = require('node:fs') as { readFileSync: (path: string, encoding: string) => string };
const { resolve } = require('node:path') as { resolve: (...paths: string[]) => string };

describe('Lot 3 multiplication module UI', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('opens the multiplication adventure from Accueil and advances after a correct QCM answer', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument();
    });

    const multiplicationCard = screen.getByRole('heading', { name: /tables de multiplication/i }).closest('article');
    expect(multiplicationCard).not.toBeNull();

    await user.click(within(multiplicationCard!).getByRole('button', { name: /continuer/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /tables de multiplication/i })).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByRole('region', { name: /choisis une table/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('img', { name: /illustration multiplication/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /choisis ta table/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /choix de table et question de multiplication/i })).toHaveClass('multiplication-main-grid');
    expect(screen.queryByRole('button', { name: /écouter la question/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /table de 7/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('button', { name: /table de 12/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /bibliothèque des tables de 11 à 20/i }));
    const libraryMenu = screen.getByRole('menu', { name: /tables de 11 à 20/i });
    expect(within(libraryMenu).getByRole('menuitem', { name: /12\s*table de 12/i })).toBeInTheDocument();
    await user.click(within(libraryMenu).getByRole('menuitem', { name: /table de 12/i }));
    expect(await screen.findByRole('heading', { name: /12 × 8 = \?/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /table de 7/i }));
    expect(await screen.findByRole('heading', { name: /7 × 8 = \?/i })).toBeInTheDocument();
    const navigation = screen.getByRole('navigation', { name: /navigation enfant/i });
    expect(navigation).toBeInTheDocument();
    expect(navigation).toHaveClass('child-side-nav');
    expect(within(navigation).getByRole('button', { name: /tables/i })).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByText(/objectif du jour/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/réussis 9 calculs/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/série actuelle/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/niveau joueur/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/réponds à la question/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/aide/i)).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /7 × 8 = \?/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '56' })).toBeInTheDocument();
    expect(screen.getByLabelText(/chronomètre/i)).toHaveTextContent('00:00');
    const progressStrip = screen.getByLabelText(/avancement de la table de 7/i);
    expect(within(progressStrip).getByText('7×8')).toBeInTheDocument();
    expect(within(progressStrip).queryByText('= 56')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/8 fois 7/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '56' }));

    await waitFor(() => {
      expect(screen.getByText(/question 2 sur 9/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: /7 × 6 = \?/i })).toBeInTheDocument();
    expect(within(screen.getByLabelText(/avancement de la table de 7/i)).getByText('= 56')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /question suivante/i })).not.toBeInTheDocument();
  });

  it('garde temporairement une table en cours quand on change de menu puis revient', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument();
    });

    const navigation = screen.getByRole('navigation', { name: /navigation enfant/i });
    await user.click(within(navigation).getByRole('button', { name: /tables/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /7 × 8 = \?/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: '56' }));

    await waitFor(() => {
      expect(screen.getByText(/question 2 sur 9/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: /7 × 6 = \?/i })).toBeInTheDocument();

    await user.click(within(navigation).getByRole('button', { name: /profil/i }));
    await screen.findByRole('heading', { name: /famille nedelec/i });
    await user.click(within(navigation).getByRole('button', { name: /tables/i }));

    expect(await screen.findByText(/question 2 sur 9/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /7 × 6 = \?/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /7 × 8 = \?/i })).not.toBeInTheDocument();
  });

  it('persists the multiplication history with the child name when leaving and reopening Tables', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument();
    });

    const navigation = screen.getByRole('navigation', { name: /navigation enfant/i });
    await user.click(within(navigation).getByRole('button', { name: /tables/i }));

    const correctAnswers = ['56', '42', '63', '28', '49', '14', '35', '21', '70'];
    for (let index = 0; index < correctAnswers.length; index += 1) {
      await waitFor(() => {
        expect(screen.getByText(new RegExp(`Question ${index + 1} sur 9`, 'i'))).toBeInTheDocument();
      });
      await user.click(screen.getByRole('button', { name: correctAnswers[index] }));
    }

    await waitFor(() => {
      expect(screen.getByText(/score : 9 \/ 9/i)).toBeInTheDocument();
    });
    const firstHistory = screen.getByRole('table', { name: /historique des tables que tu as réalisées/i });
    expect(screen.queryByText(/carnet de progrès/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/retrouve tes tables/i)).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /historique des tables que tu as réalisées/i })).toBeInTheDocument();
    expect(firstHistory).toHaveClass('activity-history-table');
    expect(within(firstHistory).getByText('Emma')).toBeInTheDocument();
    expect(within(firstHistory).getByText('Table de 7')).toBeInTheDocument();

    const storedActivities = JSON.parse(window.localStorage.getItem('devoirs.activityRecords.v1') ?? '[]');
    expect(storedActivities).toHaveLength(1);
    expect(storedActivities[0]).toMatchObject({
      profileId: 'emma-demo',
      profileName: 'Emma',
      module: 'multiplication',
      moduleLabel: 'Multiplication',
      exerciseLabel: 'Table de 7',
      durationSeconds: expect.any(Number),
      status: 'completed',
      score: 9,
      totalQuestions: 9,
      correctCount: 9,
      wrongCount: 0,
      starsEarned: 1,
      details: {
        table: 7,
      },
    });
    expect(storedActivities[0].details.facts).toHaveLength(9);

    await user.click(within(navigation).getByRole('button', { name: /accueil/i }));
    await user.click(within(navigation).getByRole('button', { name: /tables/i }));

    await waitFor(() => {
      const reopenedHistory = screen.getByRole('table', { name: /historique des tables que tu as réalisées/i });
      expect(within(reopenedHistory).getByText('Emma')).toBeInTheDocument();
      expect(within(reopenedHistory).getByText('Table de 7')).toBeInTheDocument();
    });
  });

  it('filtre automatiquement l’historique des tables sur le profil utilisateur actif', async () => {
    window.localStorage.setItem('devoirs.childProfiles.v1', JSON.stringify([
      {
        id: 'enora-demo',
        name: 'Enora',
        avatarEmoji: '👧',
        avatarPhotoUrl: '',
        profileColor: '#20B486',
        age: 9,
        role: 'eleve',
        schoolLevel: 'CM1',
      },
      {
        id: 'louane-demo',
        name: 'Louane',
        avatarEmoji: '👧',
        avatarPhotoUrl: '',
        profileColor: '#F25CA2',
        age: 7,
        role: 'eleve',
        schoolLevel: 'CE1',
      },
    ]));
    window.localStorage.setItem('devoirs.activeProfileId.v1', 'enora-demo');
    window.localStorage.setItem('devoirs.multiplicationTableHistory.v1', JSON.stringify([
      {
        id: 'enora-table-7',
        profileId: 'enora-demo',
        childName: 'Enora',
        table: 7,
        correctCount: 9,
        wrongCount: 0,
        score: 9,
        totalQuestions: 9,
        durationSeconds: 61,
        completedAtIso: '2026-06-14T10:00:00.000Z',
        facts: [],
      },
      {
        id: 'louane-table-8',
        profileId: 'louane-demo',
        childName: 'Louane',
        table: 8,
        correctCount: 8,
        wrongCount: 1,
        score: 8,
        totalQuestions: 9,
        durationSeconds: 72,
        completedAtIso: '2026-06-14T09:00:00.000Z',
        facts: [],
      },
    ]));

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /bonjour enora/i })).toBeInTheDocument();
    });

    const navigation = screen.getByRole('navigation', { name: /navigation enfant/i });
    await user.click(within(navigation).getByRole('button', { name: /tables/i }));

    const history = await screen.findByRole('table', { name: /historique des tables que tu as réalisées/i });
    expect(within(history).getByText('Enora')).toBeInTheDocument();
    expect(within(history).getByText('Table de 7')).toBeInTheDocument();
    expect(within(history).queryByText('Louane')).not.toBeInTheDocument();
    expect(within(history).queryByText('Table de 8')).not.toBeInTheDocument();
  });

  it('enregistre une table terminée sur le profil actif Enora et rafraîchit les données du Profil', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem('devoirs.childProfiles.v1', JSON.stringify([
      {
        id: 'enora-demo',
        name: 'Enora',
        avatarEmoji: '👧',
        avatarPhotoUrl: '',
        profileColor: '#20B486',
        age: 9,
        role: 'eleve',
        schoolLevel: 'CM1',
        stars: 0,
        badges: 0,
        streakDays: 0,
      },
      {
        id: 'louane-demo',
        name: 'Louane',
        avatarEmoji: '👧',
        avatarPhotoUrl: '',
        profileColor: '#F25CA2',
        age: 7,
        role: 'eleve',
        schoolLevel: 'CE1',
        stars: 0,
        badges: 0,
        streakDays: 0,
      },
    ]));
    window.localStorage.setItem('devoirs.activeProfileId.v1', 'enora-demo');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /bonjour enora/i })).toBeInTheDocument();
    });

    const navigation = screen.getByRole('navigation', { name: /navigation enfant/i });
    await user.click(within(navigation).getByRole('button', { name: /tables/i }));

    const correctAnswers = ['56', '42', '63', '28', '49', '14', '35', '21', '70'];
    for (let index = 0; index < correctAnswers.length; index += 1) {
      await waitFor(() => {
        expect(screen.getByText(new RegExp(`Question ${index + 1} sur 9`, 'i'))).toBeInTheDocument();
      });
      await user.click(screen.getByRole('button', { name: correctAnswers[index] }));
    }

    await waitFor(() => {
      expect(screen.getByText(/score : 9 \/ 9/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/temps : \d{2}:\d{2}/i)).toBeInTheDocument();
    const finalResult = screen.getByLabelText(/résultat final de la table/i);
    expect(finalResult).not.toHaveClass('feedback-card');
    expect(finalResult).not.toHaveClass('success');
    expect(screen.queryByText(/série terminée/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/table complète de 7/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/table complète avec erreurs/i)).not.toBeInTheDocument();

    const storedActivities = JSON.parse(window.localStorage.getItem('devoirs.activityRecords.v1') ?? '[]');
    expect(storedActivities).toHaveLength(1);
    expect(storedActivities[0]).toMatchObject({
      profileId: 'enora-demo',
      profileName: 'Enora',
      exerciseLabel: 'Table de 7',
      starsEarned: 1,
    });

    await user.click(within(navigation).getByRole('button', { name: /profil/i }));

    const overview = await screen.findByRole('region', { name: /aperçu des activités/i });
    expect(within(overview).getByLabelText(/Enora .*1 étoiles?/i)).toBeInTheDocument();
    expect(within(overview).getByLabelText(/Enora .*1 minutes?/i)).toBeInTheDocument();
    expect(within(overview).queryByLabelText(/Louane .*1 étoiles?/i)).not.toBeInTheDocument();

    const history = screen.getByRole('region', { name: /historique détaillé des activités/i });
    const table = within(history).getByRole('table', { name: /activités famille/i });
    const row = within(table).getAllByText('Table de 7').find((element) => element.closest('tbody'))?.closest('tr');
    expect(row).not.toBeNull();
    expect(within(row!).getByText('Enora')).toBeInTheDocument();
    expect(within(row!).queryByText('Louane')).not.toBeInTheDocument();
  });

  it('keeps the sidebar fixed and lets multiplication use the full remaining width', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/child-app.css'), 'utf8');

    expect(css).toContain('.has-side-nav.multiplication-app-layout .child-app-shell');
    expect(css).toContain('width: calc(100vw - 250px);');
    expect(css).toContain('margin-left: 250px;');
    expect(css).toContain('max-width: none;');
    expect(css).toMatch(/\.math-magic-header[\s\S]*?width: 100%;[\s\S]*?max-width: none;/);
    expect(css).toMatch(/\.magic-exercise-card[\s\S]*?width: 100%;[\s\S]*?max-width: none;/);
    expect(css).toContain('.multiplication-history-table.activity-history-table');
    expect(css).toMatch(/\.multiplication-history-table\.activity-history-table,[\s\S]*?\.multiplication-history-table\.activity-history-table \.history-fact \{[\s\S]*?font-weight: 400;/);
  });

  it('uses one continuous magical background and a denser multiplication layout', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/child-app.css'), 'utf8');

    expect(css).toMatch(/\.multiplication-app-layout\s*{[\s\S]*?background:\s*transparent;[\s\S]*?}/);
    expect(css).toMatch(/\.has-side-nav\.multiplication-app-layout \.child-app-shell\s*{[\s\S]*?padding: 0;[\s\S]*?}/);
    expect(css).toMatch(/\.multiplication-screen\s*{[\s\S]*?padding: 22px clamp\(16px, 3vw, 36px\) 32px;[\s\S]*?border-radius: 0;[\s\S]*?}/);
    expect(css).toMatch(/\.math-magic-header h1\s*{[\s\S]*?font-size: clamp\(2\.2rem, 4vw, 3\.4rem\);[\s\S]*?}/);
    expect(css).toMatch(/\.math-progress-card\s*{[\s\S]*?min-height: 104px;[\s\S]*?padding: 16px;[\s\S]*?}/);
    expect(css).toMatch(/\.magic-answer-grid button\s*{[\s\S]*?min-height: 58px;[\s\S]*?}/);
  });
});
