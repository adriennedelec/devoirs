import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App';

describe('Lots 5-11 complete child interface', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows a final child cockpit and starts the primary mission', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument());

    expect(screen.getByText(/aujourd’hui, tu deviens gardienne des devoirs/i)).toBeInTheDocument();
    expect(screen.getByText(/mission principale/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /je commence ma mission/i }));

    await waitFor(() => expect(screen.getByRole('heading', { name: /tables de multiplication/i })).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText(/question 1 sur 9/i)).toBeInTheDocument());
  });

  it('renders gamified path worlds, global progress gauges and dynamic rewards', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem('devoirs.activityRecords.v1', JSON.stringify([
      {
        id: 'activity-table-7',
        profileId: 'emma-demo',
        profileName: 'Emma',
        module: 'multiplication',
        moduleLabel: 'Multiplication',
        exerciseLabel: 'Table de 7',
        startedAtIso: '2026-06-21T10:00:00.000Z',
        completedAtIso: '2026-06-21T10:02:00.000Z',
        durationSeconds: 120,
        status: 'completed',
        score: 8,
        totalQuestions: 9,
        correctCount: 8,
        wrongCount: 1,
        starsEarned: 10,
        details: {
          table: 7,
          facts: Array.from({ length: 8 }, (_, index) => ({ rightFactor: index + 2, line: `${index + 2} × 7`, status: 'mastered' })),
        },
      },
      {
        id: 'activity-table-8',
        profileId: 'emma-demo',
        profileName: 'Emma',
        module: 'multiplication',
        moduleLabel: 'Multiplication',
        exerciseLabel: 'Table de 8',
        startedAtIso: '2026-06-21T11:00:00.000Z',
        completedAtIso: '2026-06-21T11:01:00.000Z',
        durationSeconds: 60,
        status: 'completed',
        score: 3,
        totalQuestions: 9,
        correctCount: 3,
        wrongCount: 6,
        starsEarned: 3,
        details: { table: 8 },
      },
      {
        id: 'activity-reading',
        profileId: 'emma-demo',
        profileName: 'Emma',
        module: 'reading',
        moduleLabel: 'Lecture',
        exerciseLabel: 'Lecture courte',
        startedAtIso: '2026-06-21T12:00:00.000Z',
        completedAtIso: '2026-06-21T12:04:00.000Z',
        durationSeconds: 240,
        status: 'completed',
        score: 4,
        totalQuestions: 5,
        correctCount: 4,
        wrongCount: 1,
        starsEarned: 4,
        details: {},
      },
      {
        id: 'activity-dictation',
        profileId: 'emma-demo',
        profileName: 'Emma',
        module: 'dictation',
        moduleLabel: 'Dictée',
        exerciseLabel: 'Dictée des mots',
        startedAtIso: '2026-06-21T13:00:00.000Z',
        completedAtIso: '2026-06-21T13:04:00.000Z',
        durationSeconds: 240,
        status: 'completed',
        score: 2,
        totalQuestions: 3,
        correctCount: 2,
        wrongCount: 1,
        starsEarned: 2,
        details: {},
      },
      {
        id: 'activity-poetry',
        profileId: 'emma-demo',
        profileName: 'Emma',
        module: 'poetry',
        moduleLabel: 'Poésie',
        exerciseLabel: 'Récitation',
        startedAtIso: '2026-06-21T14:00:00.000Z',
        completedAtIso: '2026-06-21T14:04:00.000Z',
        durationSeconds: 240,
        status: 'completed',
        score: 1,
        totalQuestions: 1,
        correctCount: 1,
        wrongCount: 0,
        starsEarned: 1,
        details: {},
      },
    ]));
    render(<App />);

    await waitFor(() => expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /parcours/i }));
    expect(screen.getByRole('heading', { name: /mon parcours/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /progression de emma/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /^mathématiques$/i })).toBeInTheDocument();
    const mathRegion = screen.getByRole('region', { name: /^mathématiques$/i });
    const frenchRegion = screen.getByRole('region', { name: /^français$/i });
    expect(within(mathRegion).getByRole('heading', { name: /tables de multiplication/i })).toBeInTheDocument();
    expect(within(mathRegion).getByRole('meter', { name: /mathématiques.*0 sur 10000/i })).toHaveAttribute('aria-valuenow', '0');
    expect(within(mathRegion).getByRole('meter', { name: /table de 7.*0 sur 10/i })).toHaveAttribute('aria-valuenow', '0');
    expect(within(mathRegion).getByRole('meter', { name: /table de 8.*0 sur 10/i })).toHaveAttribute('aria-valuenow', '0');
    expect(within(mathRegion).getByRole('meter', { name: /table de 10.*0 sur 10/i })).toHaveAttribute('aria-valuenow', '0');
    expect(within(frenchRegion).getByRole('heading', { name: /exercices de français/i })).toBeInTheDocument();
    expect(within(frenchRegion).getByRole('meter', { name: /français.*7 sur 10/i })).toHaveAttribute('aria-valuenow', '7');
    expect(within(frenchRegion).getByRole('meter', { name: /lecture.*4 sur 10/i })).toHaveAttribute('aria-valuenow', '4');
    expect(within(frenchRegion).getByRole('meter', { name: /dictée.*2 sur 10/i })).toHaveAttribute('aria-valuenow', '2');
    expect(within(frenchRegion).getByRole('meter', { name: /poésie.*1 sur 10/i })).toHaveAttribute('aria-valuenow', '1');
    expect(screen.queryByText(/chaque étape te rapproche de la réussite/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/aventure pédagogique/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/île des calculs/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/monde des mots/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/forêt des histoires/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/scène des poètes/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /récompenses/i }));
    expect(screen.getByRole('heading', { name: /mes récompenses/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/125 étoiles disponibles/i)).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /avatar et étoiles/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /rubriques de récompenses/i })).toBeInTheDocument();
    expect(screen.getByText(/photo de profils/i)).toBeInTheDocument();
    expect(screen.getByText(/vêtements et accessoires/i)).toBeInTheDocument();
    expect(screen.getByText(/^lieux$/i)).toBeInTheDocument();
    expect(screen.queryByText(/boutique magique/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/tu as gagné 3 étoiles/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/verrouillé/i)).not.toBeInTheDocument();
  });

  it('turns reading into a comprehension activity with feedback', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /lecture/i }));

    await waitFor(() => expect(screen.getByRole('heading', { name: /le dragon qui aimait les livres/i })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /écouter l’histoire/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /dans la bibliothèque/i }));
    await user.click(screen.getByRole('button', { name: /un livre/i }));
    await user.click(screen.getByRole('button', { name: /il devient plus gentil/i }));
    await user.click(screen.getByRole('button', { name: /valider ma compréhension/i }));

    await waitFor(() => expect(screen.getByText(/bravo, tu as compris l’histoire/i)).toBeInTheDocument());
  });

  it('enriches multiplication into a 2-to-10 magical mastery session', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument());
    const multiplicationCard = screen.getByRole('heading', { name: /tables de multiplication/i }).closest('article');
    await user.click(within(multiplicationCard!).getByRole('button', { name: /continuer/i }));

    await waitFor(() => expect(screen.getByText(/question 1 sur 9/i)).toBeInTheDocument());
    expect(screen.getByRole('navigation', { name: /navigation enfant/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '49' }));

    await waitFor(() => expect(screen.getByText(/on retente/i)).toBeInTheDocument());
    expect(screen.getByRole('heading', { name: /7 × 8 = \?/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '56' }));
    await waitFor(() => expect(screen.getByText(/question 2 sur 9/i)).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /question suivante/i })).not.toBeInTheDocument();
  });

  it('shows the final score and highlights missed table facts in red', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument());
    const multiplicationCard = screen.getByRole('heading', { name: /tables de multiplication/i }).closest('article');
    await user.click(within(multiplicationCard!).getByRole('button', { name: /continuer/i }));

    await waitFor(() => expect(screen.getByText(/question 1 sur 9/i)).toBeInTheDocument());
    expect(screen.getByLabelText(/chronomètre/i)).toBeInTheDocument();
    expect(screen.getByText(/00:00/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '49' }));
    await waitFor(() => expect(screen.getByText(/on retente/i)).toBeInTheDocument());
    expect(screen.getByLabelText(/chronomètre/i)).toHaveClass('is-running');
    await user.click(screen.getByRole('button', { name: '56' }));

    for (const [question, answer] of [
      [/7 × 6 = \?/i, '42'],
      [/7 × 9 = \?/i, '63'],
      [/7 × 4 = \?/i, '28'],
      [/7 × 7 = \?/i, '49'],
      [/7 × 2 = \?/i, '14'],
      [/7 × 5 = \?/i, '35'],
      [/7 × 3 = \?/i, '21'],
      [/7 × 10 = \?/i, '70'],
    ] as const) {
      await waitFor(() => expect(screen.getByRole('heading', { name: question })).toBeInTheDocument());
      await user.click(screen.getByRole('button', { name: answer }));
    }

    await waitFor(() => expect(screen.getByText(/score : 8 \/ 9/i)).toBeInTheDocument());
    expect(screen.getByLabelText(/résultat final de la table/i)).toBeInTheDocument();

    const history = screen.getByRole('table', { name: /historique des tables.*réalisées/i });
    expect(within(history).getByText(/table de 7/i)).toBeInTheDocument();
    expect(within(history).getByText(/8 justes/i)).toBeInTheDocument();
    expect(within(history).getByText(/1 fausse/i)).toBeInTheDocument();
    expect(within(history).getByText(/8 \/ 9/i)).toBeInTheDocument();
    expect(within(history).getByText(/temps/i)).toBeInTheDocument();
    expect(within(history).getByText(/date et heure/i)).toBeInTheDocument();
    expect(within(history).getByText(/\d{2}\/\d{2}\/\d{4}.*\d{2}:\d{2}/i)).toBeInTheDocument();
    expect(within(history).getByText(/00:0[1-9]/i)).toBeInTheDocument();
    const masteredDetail = within(history).getByText('2 × 7 = 14');
    expect(masteredDetail).toHaveClass('mastered');
    const missedDetail = within(history).getByText('8 × 7 = 56');
    expect(missedDetail).toHaveClass('missed');
  });

  it('lets the child launch every available multiplication table from the picker', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument());
    const multiplicationCard = screen.getByRole('heading', { name: /tables de multiplication/i }).closest('article');
    await user.click(within(multiplicationCard!).getByRole('button', { name: /continuer/i }));

    await waitFor(() => expect(screen.getByText(/question 1 sur 9/i)).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /table de 8/i }));

    await waitFor(() => expect(screen.getByRole('heading', { name: /8 × 8 = \?/i })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: '64' })).toBeEnabled();
  });

  it('shows dictation word feedback and poetry memorisation helpers', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument());
    const dictationCard = screen.getByRole('heading', { name: /dictée/i }).closest('article');
    await user.click(within(dictationCard!).getByRole('button', { name: /continuer/i }));
    await waitFor(() => expect(screen.getByLabelText(/série de mots/i)).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /accueil/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument());
    const poetryCard = screen.getByRole('heading', { name: /poésie/i }).closest('article');
    await user.click(within(poetryCard!).getByRole('button', { name: /continuer/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /la cigale et la fourmi/i })).toBeInTheDocument());
    const speechSpeak = vi.fn((utterance: SpeechSynthesisUtterance) => utterance.onend?.call(utterance, {} as SpeechSynthesisEvent));
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: { speak: speechSpeak, cancel: vi.fn() },
    });
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: class MockSpeechSynthesisUtterance {
        text: string;
        lang = '';
        rate = 1;
        pitch = 1;
        onend: ((event: SpeechSynthesisEvent) => void) | null = null;
        onerror: ((event: SpeechSynthesisErrorEvent) => void) | null = null;
        constructor(text: string) {
          this.text = text;
        }
      },
    });

    await user.click(screen.getByRole('button', { name: /écouter/i }));
    expect(speechSpeak).toHaveBeenCalledTimes(1);
    expect(speechSpeak.mock.calls[0][0].text).toContain('La Cigale, ayant chanté');

    const lineOneButton = screen.getByRole('button', { name: /^Ligne 1$/i });
    expect(screen.getByLabelText(/ligne 1 affichée/i)).toHaveTextContent(/La Cigale/);
    await user.click(lineOneButton);
    expect(lineOneButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText(/ligne 1 masquée/i)).toHaveTextContent(/••/);
    await user.click(lineOneButton);
    expect(lineOneButton).toHaveAttribute('aria-pressed', 'false');

    await user.click(screen.getByRole('button', { name: /tout afficher/i }));
    const topMaskSlider = screen.getByRole('slider', { name: /masquer les lignes du haut/i });
    const bottomMaskSlider = screen.getByRole('slider', { name: /masquer les lignes du bas/i });
    expect(topMaskSlider).toHaveAttribute('aria-valuenow', '0');
    expect(bottomMaskSlider).toHaveAttribute('aria-valuenow', '0');
    fireEvent.keyDown(topMaskSlider, { key: 'ArrowDown' });
    fireEvent.keyDown(topMaskSlider, { key: 'ArrowDown' });
    expect(screen.getByLabelText(/ligne 1 masquée/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ligne 2 masquée/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ligne 3 affichée/i)).toBeInTheDocument();
    expect(topMaskSlider).toHaveAttribute('aria-valuenow', '2');
    await user.click(lineOneButton);
    expect(lineOneButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText(/ligne 1 masquée/i)).toBeInTheDocument();

    fireEvent.keyDown(bottomMaskSlider, { key: 'ArrowUp' });
    expect(bottomMaskSlider).toHaveAttribute('aria-valuenow', '1');
    fireEvent.keyDown(bottomMaskSlider, { key: 'Home' });
    expect(bottomMaskSlider).toHaveAttribute('aria-valuenow', '20');
    fireEvent.keyDown(topMaskSlider, { key: 'ArrowDown' });
    expect(topMaskSlider).toHaveAttribute('aria-valuenow', '2');
    expect(screen.getByLabelText(/ligne 2 masquée/i)).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /réciter la poésie/i })).toBeInTheDocument();

    const recognitionInstances: Array<{
      start: ReturnType<typeof vi.fn>;
      stop: ReturnType<typeof vi.fn>;
      abort: ReturnType<typeof vi.fn>;
      onresult: ((event: unknown) => void) | null;
      onerror: ((event: unknown) => void) | null;
      onend: (() => void) | null;
      lang: string;
      continuous: boolean;
      interimResults: boolean;
    }> = [];
    class MockSpeechRecognition {
      start = vi.fn();
      stop = vi.fn();
      abort = vi.fn();
      onresult: ((event: unknown) => void) | null = null;
      onerror: ((event: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      lang = '';
      continuous = false;
      interimResults = false;
      constructor() {
        recognitionInstances.push(this);
      }
    }
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      configurable: true,
      value: MockSpeechRecognition,
    });

    await user.click(screen.getByRole('button', { name: /démarrer l’enregistrement/i }));
    expect(recognitionInstances[0].start).toHaveBeenCalledTimes(1);
    expect(recognitionInstances[0].lang).toBe('fr-FR');
    act(() => {
      recognitionInstances[0].onresult?.({ results: [[{ transcript: 'La Cigale ayant chanté tout l été' }]] });
    });
    expect(screen.getByLabelText(/transcription de la récitation/i)).toHaveValue('La Cigale ayant chanté tout l été');

    await user.click(screen.getByRole('button', { name: /arrêter/i }));
    await user.click(screen.getByRole('button', { name: /analyser la récitation/i }));
    expect(await screen.findByRole('heading', { name: /analyse de la récitation/i })).toBeInTheDocument();
    expect(screen.getByText(/précision/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/transcription corrigée avec erreurs en couleur/i)).toBeInTheDocument();
  });
});
