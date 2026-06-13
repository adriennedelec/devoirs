import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../src/App';

const storedActivities = [
  {
    id: 'emma-table-7',
    profileId: 'emma-demo',
    profileName: 'Emma',
    module: 'multiplication',
    moduleLabel: 'Multiplication',
    exerciseLabel: 'Table de 7',
    startedAtIso: '2026-06-11T08:00:00.000Z',
    completedAtIso: '2026-06-11T08:02:00.000Z',
    durationSeconds: 120,
    status: 'completed',
    score: 8,
    totalQuestions: 9,
    correctCount: 8,
    wrongCount: 1,
    starsEarned: 16,
    details: { table: 7 },
  },
  {
    id: 'louane-reading',
    profileId: 'louane-demo',
    profileName: 'Louane',
    module: 'reading',
    moduleLabel: 'Lecture',
    exerciseLabel: 'Le dragon qui aimait les livres',
    startedAtIso: '2026-06-10T08:00:00.000Z',
    completedAtIso: '2026-06-10T08:05:00.000Z',
    durationSeconds: 300,
    status: 'completed',
    score: 3,
    totalQuestions: 3,
    correctCount: 3,
    wrongCount: 0,
    starsEarned: 6,
    details: { sessionId: 'reading-dragon' },
  },
];

describe('Profil et modules branchés sur la base activité', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('alimente les graphiques et l’historique Profil depuis les vraies activités stockées', async () => {
    window.localStorage.setItem('devoirs.activityRecords.v1', JSON.stringify(storedActivities));

    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: /profil/i }));

    const overview = screen.getByRole('region', { name: /aperçu des activités/i });
    expect(within(overview).getByLabelText(/Emma .*2 minutes/i)).toBeInTheDocument();
    expect(within(overview).getByLabelText(/Louane .*5 minutes/i)).toBeInTheDocument();
    expect(within(overview).getByLabelText(/Emma .*16 étoiles/i)).toBeInTheDocument();
    expect(within(overview).getByLabelText(/Louane .*6 étoiles/i)).toBeInTheDocument();

    const history = screen.getByRole('region', { name: /historique détaillé des activités/i });
    expect(within(history).getByText(/total des résultats : 2/i)).toBeInTheDocument();
    const table = within(history).getByRole('table', { name: /activités famille/i });
    expect(within(table).getByText('Table de 7')).toBeInTheDocument();
    expect(within(table).getByText('Le dragon qui aimait les livres')).toBeInTheDocument();
    expect(within(table).getByText('89%')).toBeInTheDocument();
    expect(within(table).getByText('100%')).toBeInTheDocument();
  });

  it('enregistre une activité Dictée dans la base commune après correction', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: /dictée/i }));

    await user.click(await screen.findByRole('button', { name: /dictée normale/i }));
    await screen.findByRole('heading', { name: /dictée de la forêt magique/i });
    await user.type(screen.getByRole('textbox', { name: /ta phrase/i }), 'Le petit renard traverse la forêt.');
    await user.click(screen.getByRole('button', { name: /corriger ma dictée/i }));

    await waitFor(() => {
      const records = JSON.parse(window.localStorage.getItem('devoirs.activityRecords.v1') ?? '[]');
      expect(records).toHaveLength(1);
      expect(records[0]).toMatchObject({
        profileId: 'emma-demo',
        module: 'dictation',
        moduleLabel: 'Dictée',
        exerciseLabel: 'Dictée de la forêt magique',
        status: 'completed',
        score: 1,
        totalQuestions: 1,
        starsEarned: expect.any(Number),
      });
    });
  });

  it('enregistre une activité Poésie dans la base commune après récitation', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: /poésie/i }));

    await screen.findByRole('heading', { name: /poésie des saisons/i });
    await user.click(screen.getByRole('button', { name: /j’ai récité ma poésie/i }));

    await waitFor(() => {
      const records = JSON.parse(window.localStorage.getItem('devoirs.activityRecords.v1') ?? '[]');
      expect(records).toHaveLength(1);
      expect(records[0]).toMatchObject({
        profileId: 'emma-demo',
        module: 'poetry',
        moduleLabel: 'Poésie',
        exerciseLabel: 'Poésie des saisons',
        status: 'completed',
        score: 1,
        totalQuestions: 1,
        starsEarned: expect.any(Number),
      });
    });
  });

  it('enregistre une activité Lecture dans la base commune après validation', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: /lecture/i }));

    await screen.findByRole('heading', { name: /le dragon qui aimait les livres/i });
    const firstQuestion = (await screen.findByRole('heading', { name: /où vit le dragon/i })).closest('article');
    const secondQuestion = screen.getByRole('heading', { name: /qu’est-ce qu’Emma prête au dragon/i }).closest('article');
    const thirdQuestion = screen.getByRole('heading', { name: /que se passe-t-il à la fin/i }).closest('article');
    expect(firstQuestion).not.toBeNull();
    expect(secondQuestion).not.toBeNull();
    expect(thirdQuestion).not.toBeNull();

    await user.click(within(firstQuestion!).getAllByRole('button')[0]);
    await user.click(within(secondQuestion!).getAllByRole('button')[0]);
    await user.click(within(thirdQuestion!).getAllByRole('button')[0]);
    await user.click(screen.getByRole('button', { name: /valider ma compréhension/i }));

    await waitFor(() => {
      const records = JSON.parse(window.localStorage.getItem('devoirs.activityRecords.v1') ?? '[]');
      expect(records).toHaveLength(1);
      expect(records[0]).toMatchObject({
        profileId: 'emma-demo',
        profileName: 'Emma',
        module: 'reading',
        moduleLabel: 'Lecture',
        exerciseLabel: 'Le dragon qui aimait les livres',
        status: 'completed',
        totalQuestions: 3,
        starsEarned: expect.any(Number),
      });
    });
  });
});
