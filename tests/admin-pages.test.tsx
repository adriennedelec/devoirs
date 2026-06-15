import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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

  it('exporte et importe les données locales avec clés primaires et suppressions', async () => {
    window.localStorage.setItem('devoirs.childProfiles.v1', JSON.stringify([
      {
        id: 'emma-demo',
        name: 'Emma',
        avatarEmoji: '🧒',
        avatarPhotoUrl: '',
        role: 'eleve',
        schoolLevel: 'CM1',
        age: 9,
        profileColor: '#6D5DFC',
      },
    ]));
    window.localStorage.setItem('devoirs.activeProfileId.v1', 'emma-demo');
    window.localStorage.setItem('devoirs.activityRecords.v1', JSON.stringify([
      {
        id: 'activity-existing',
        profileId: 'emma-demo',
        profileName: 'Emma',
        module: 'reading',
        moduleLabel: 'Lecture',
        exerciseLabel: 'Ancienne lecture',
        startedAtIso: '2026-06-10T08:00:00.000Z',
        completedAtIso: '2026-06-10T08:02:00.000Z',
        durationSeconds: 120,
        status: 'completed',
        score: 4,
        totalQuestions: 5,
        correctCount: 4,
        wrongCount: 1,
        starsEarned: 4,
      },
      {
        id: 'activity-to-delete',
        profileId: 'emma-demo',
        profileName: 'Emma',
        module: 'dictation',
        moduleLabel: 'Dictée',
        exerciseLabel: 'À supprimer',
        startedAtIso: '2026-06-09T08:00:00.000Z',
        completedAtIso: '2026-06-09T08:02:00.000Z',
        durationSeconds: 120,
        status: 'completed',
        score: 1,
        totalQuestions: 5,
        correctCount: 1,
        wrongCount: 4,
        starsEarned: 1,
      },
    ]));

    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: /base de données/i }));

    await user.click(screen.getByRole('button', { name: /préparer l'export/i }));
    const exportBox = screen.getByLabelText(/données exportées/i) as HTMLTextAreaElement;
    expect(exportBox.value).toContain('devoirs.childProfiles.v1');
    expect(exportBox.value).toContain('primaryKey');
    expect(exportBox.value).toContain('activity-existing');

    const importPayload = JSON.stringify({
      schemaVersion: 1,
      tables: [
        {
          storageKey: 'devoirs.childProfiles.v1',
          primaryKey: 'id',
          mode: 'upsert-delete',
          records: [
            { id: 'emma-demo', name: 'Emma Vercel', avatarEmoji: '🧒', avatarPhotoUrl: '', role: 'eleve', schoolLevel: 'CM2', age: 10, profileColor: '#20B486' },
            { id: 'enora-demo', name: 'Enora', avatarEmoji: '👧', avatarPhotoUrl: '', role: 'eleve', schoolLevel: 'CE2', age: 8, profileColor: '#F25CA2' },
          ],
        },
        {
          storageKey: 'devoirs.activeProfileId.v1',
          primaryKey: 'key',
          mode: 'singleton',
          records: [{ key: 'activeProfileId', value: 'enora-demo' }],
        },
        {
          storageKey: 'devoirs.activityRecords.v1',
          primaryKey: 'id',
          mode: 'upsert-delete',
          records: [
            { id: 'activity-existing', exerciseLabel: 'Lecture mise à jour', profileId: 'emma-demo', profileName: 'Emma Vercel', module: 'reading', moduleLabel: 'Lecture', startedAtIso: '2026-06-10T08:00:00.000Z', completedAtIso: '2026-06-10T08:02:00.000Z', durationSeconds: 120, status: 'completed', score: 5, totalQuestions: 5, correctCount: 5, wrongCount: 0, starsEarned: 5 },
            { id: 'activity-new', exerciseLabel: 'Nouvelle lecture', profileId: 'enora-demo', profileName: 'Enora', module: 'reading', moduleLabel: 'Lecture', startedAtIso: '2026-06-11T08:00:00.000Z', completedAtIso: '2026-06-11T08:02:00.000Z', durationSeconds: 120, status: 'completed', score: 5, totalQuestions: 5, correctCount: 5, wrongCount: 0, starsEarned: 5 },
            { id: 'activity-to-delete', _deleted: true },
          ],
        },
      ],
    });

    fireEvent.change(screen.getByLabelText(/coller un export devoirs/i), { target: { value: importPayload } });
    await user.click(screen.getByRole('button', { name: /importer les données/i }));

    expect(await screen.findByText(/import terminé/i)).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem('devoirs.childProfiles.v1') ?? '[]')).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'emma-demo', name: 'Emma Vercel', schoolLevel: 'CM2' }),
      expect.objectContaining({ id: 'enora-demo', name: 'Enora' }),
    ]));
    expect(window.localStorage.getItem('devoirs.activeProfileId.v1')).toBe('enora-demo');
    const activities = JSON.parse(window.localStorage.getItem('devoirs.activityRecords.v1') ?? '[]');
    expect(activities).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'activity-existing', exerciseLabel: 'Lecture mise à jour' }),
      expect.objectContaining({ id: 'activity-new' }),
    ]));
    expect(activities).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: 'activity-to-delete' })]));
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
