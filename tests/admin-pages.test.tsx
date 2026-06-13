import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../src/App';

describe('menus Base de données et Paramétrage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('affiche le menu Base de données avec un tableau des activités stockées', async () => {
    window.localStorage.setItem('devoirs.activityRecords.v1', JSON.stringify([
      {
        id: 'activity-table-7',
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
        starsEarned: 8,
        details: { table: 7 },
      },
      {
        id: 'activity-dictation',
        profileId: 'louane-demo',
        profileName: 'Louane',
        module: 'dictation',
        moduleLabel: 'Dictée',
        exerciseLabel: 'Dictée des mots doux',
        startedAtIso: '2026-06-10T08:00:00.000Z',
        completedAtIso: '2026-06-10T08:03:00.000Z',
        durationSeconds: 180,
        status: 'completed',
        score: 6,
        totalQuestions: 8,
        correctCount: 6,
        wrongCount: 2,
        starsEarned: 3,
        details: { mode: 'word-dictation' },
      },
    ]));

    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: /base de données/i }));

    expect(screen.getByRole('heading', { name: /base de données/i })).toBeInTheDocument();
    const table = screen.getByRole('table', { name: /données d'activité stockées/i });
    expect(within(table).getByText('Emma')).toBeInTheDocument();
    expect(within(table).getByText('Table de 7')).toBeInTheDocument();
    expect(within(table).getByText('8 / 9')).toBeInTheDocument();
    expect(within(table).getByText('8 ⭐')).toBeInTheDocument();
    expect(within(table).getByText('Louane')).toBeInTheDocument();
    expect(within(table).getByText('Dictée des mots doux')).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: /filtrer par module/i }), 'multiplication');
    expect(within(table).getByText('Table de 7')).toBeInTheDocument();
    expect(within(table).queryByText('Dictée des mots doux')).not.toBeInTheDocument();
  });

  it('affiche le menu Paramétrage et persiste les étoiles par exercice', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: /paramétrage/i }));

    expect(screen.getByRole('heading', { name: /paramétrage/i, level: 1 })).toBeInTheDocument();
    const multiplicationStarsInput = screen.getByRole('spinbutton', { name: /étoiles pour tables de multiplication/i });
    expect(multiplicationStarsInput).toHaveValue(1);

    await user.clear(multiplicationStarsInput);
    await user.type(multiplicationStarsInput, '5');
    await user.click(screen.getByRole('button', { name: /enregistrer le paramétrage/i }));

    await waitFor(() => {
      expect(screen.getByText(/paramétrage enregistré/i)).toBeInTheDocument();
    });

    const storedSettings = JSON.parse(window.localStorage.getItem('devoirs.rewardSettings.v1') ?? '{}');
    expect(storedSettings.multiplication.starsPerCompletedExercise).toBe(5);
  });
});
