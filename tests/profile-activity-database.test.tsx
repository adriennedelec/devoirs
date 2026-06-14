import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

    const timeChart = within(overview).getByLabelText(/Histogramme temps d’activité/i);
    const starChart = within(overview).getByLabelText(/Histogramme étoiles gagnées/i);
    expect(within(timeChart).getByText('5')).toBeInTheDocument();
    expect(within(timeChart).getByText('2,5')).toBeInTheDocument();
    expect(within(timeChart).getByText('0')).toBeInTheDocument();
    expect(within(starChart).getByText('16')).toBeInTheDocument();
    expect(within(starChart).getByText('8')).toBeInTheDocument();
    expect(within(starChart).getByText('0')).toBeInTheDocument();

    expect(within(timeChart).getByLabelText(/Louane .*: 5 minutes/i)).toHaveStyle({ height: '96px' });
    expect(within(timeChart).getByLabelText(/Emma .*: 2 minutes/i)).toHaveStyle({ height: '38.4px' });
    expect(within(starChart).getByLabelText(/Emma .*: 16 étoiles/i)).toHaveStyle({ height: '96px' });
    expect(within(starChart).getByLabelText(/Louane .*: 6 étoiles/i)).toHaveStyle({ height: '36px' });

    const zeroMinuteBars = within(timeChart).getAllByLabelText(/Emma .*: 0 minutes/i);
    const zeroStarBars = within(starChart).getAllByLabelText(/Emma .*: 0 étoiles/i);
    expect(zeroMinuteBars.length).toBeGreaterThan(0);
    expect(zeroStarBars.length).toBeGreaterThan(0);
    zeroMinuteBars.forEach((bar) => expect(bar).toHaveStyle({ height: '0px' }));
    zeroStarBars.forEach((bar) => expect(bar).toHaveStyle({ height: '0px' }));

    const subjectChart = within(overview).getByLabelText(/Histogramme exercices réalisés par matière/i);
    const poetryRow = within(subjectChart).getByText('Poésie').closest('.subject-chart-row');
    expect(poetryRow).not.toBeNull();
    const zeroSubjectBars = Array.from(poetryRow!.querySelectorAll('i'));
    expect(zeroSubjectBars.length).toBeGreaterThan(0);
    zeroSubjectBars.forEach((bar) => expect(bar).toHaveStyle({ width: '0%' }));

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

  it('enregistre une dictée de mots terminée dans l’historique et les statistiques du profil actif Enora', async () => {
    window.localStorage.setItem('devoirs.childProfiles.v1', JSON.stringify([
      {
        id: 'enora-custom',
        name: 'Enora',
        avatarEmoji: '👧',
        avatarPhotoUrl: '',
        age: 7,
        role: 'eleve',
        schoolLevel: 'CE1',
        profileColor: '#F25CA2',
      },
    ]));
    window.localStorage.setItem('devoirs.activeProfileId.v1', 'enora-custom');

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      response: 'Enora range dragon cartable rivière. Puis elle avance avec calme.',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: /dictée/i }));
    await user.type(await screen.findByLabelText(/série de mots/i), 'dragon, cartable, rivière');
    await user.click(screen.getByRole('button', { name: /générer le texte/i }));
    await screen.findByText(/Enora range dragon cartable rivière/i);

    await user.type(screen.getByLabelText(/zone d'écriture de l'enfant/i), 'Enora range dragon cartable rivière. Puis elle avance avec calme.');
    await user.click(screen.getByRole('button', { name: /j'ai fini/i }));

    await waitFor(() => {
      const records = JSON.parse(window.localStorage.getItem('devoirs.activityRecords.v1') ?? '[]');
      expect(records).toHaveLength(1);
      expect(records[0]).toMatchObject({
        profileId: 'enora-custom',
        profileName: 'Enora',
        module: 'dictation',
        moduleLabel: 'Dictée',
        exerciseLabel: 'Dictée de mots',
        status: 'completed',
        score: 10,
        totalQuestions: 10,
      });
    });

    await waitFor(() => {
      const historyByProfile = JSON.parse(window.localStorage.getItem('devoirs.profileExerciseHistory.v1') ?? '{}');
      expect(historyByProfile['enora-custom']).toHaveLength(1);
      expect(historyByProfile['enora-custom'][0]).toMatchObject({
        module: 'dictation',
        moduleLabel: 'Dictée',
        exercise: 'Dictée de mots',
        resultLabel: '10/10',
        status: 'success',
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
