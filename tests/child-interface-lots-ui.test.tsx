import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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

  it('renders gamified path worlds and dynamic rewards', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /parcours/i }));
    expect(screen.getByRole('heading', { name: /mon parcours/i })).toBeInTheDocument();
    expect(screen.getByText(/île des calculs/i)).toBeInTheDocument();
    expect(screen.getByText(/forêt des histoires/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /récompenses/i }));
    expect(screen.getByRole('heading', { name: /mes récompenses/i })).toBeInTheDocument();
    expect(screen.getByText(/boutique magique/i)).toBeInTheDocument();
    expect(screen.getByText(/tu as gagné 3 étoiles/i)).toBeInTheDocument();
    expect(screen.getByText(/verrouillé/i)).toBeInTheDocument();
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
    expect(screen.getByText(/chronomètre/i)).toBeInTheDocument();
    expect(screen.getByText(/00:00/i)).toBeInTheDocument();
    expect(screen.getByText(/démarre à la première réponse/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '49' }));
    await waitFor(() => expect(screen.getByText(/on retente/i)).toBeInTheDocument());
    expect(screen.getByText(/chrono lancé/i)).toBeInTheDocument();
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
    expect(screen.getByRole('heading', { name: /table complète de 7/i })).toBeInTheDocument();
    const missedFact = screen.getAllByText('8 × 7 = 56').find((element) => element.tagName.toLowerCase() === 'li');
    expect(missedFact).toHaveClass('missed');
    expect(screen.getAllByText('6 × 7 = 42').find((element) => element.tagName.toLowerCase() === 'li')).toHaveClass('mastered');

    const history = screen.getByRole('table', { name: /historique des tables réalisées/i });
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
    await waitFor(() => expect(screen.getByRole('button', { name: /dictée normale/i })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /dictée normale/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /dictée de la forêt magique/i })).toBeInTheDocument());
    await user.type(screen.getByLabelText(/ta phrase/i), 'Le petit renard traverse la foret');
    await user.click(screen.getByRole('button', { name: /corriger ma dictée/i }));
    await waitFor(() => expect(screen.getByText(/accent à ajouter/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /réessayer doucement/i })).toBeInTheDocument();

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
    expect(screen.getByLabelText(/ligne 1 affichée/i)).toHaveTextContent(/La Cigale/);

    fireEvent.keyDown(bottomMaskSlider, { key: 'ArrowUp' });
    expect(screen.getByText(/1 ligne masquée en bas/i)).toBeInTheDocument();
    expect(bottomMaskSlider).toHaveAttribute('aria-valuenow', '1');
    fireEvent.keyDown(bottomMaskSlider, { key: 'Home' });
    expect(screen.getByText(/20 lignes masquées en bas/i)).toBeInTheDocument();
    fireEvent.keyDown(topMaskSlider, { key: 'ArrowDown' });
    expect(topMaskSlider).toHaveAttribute('aria-valuenow', '2');
    expect(screen.getByText(/2 lignes masquées en haut/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cacher des mots/i })).toBeInTheDocument();
  });
});
