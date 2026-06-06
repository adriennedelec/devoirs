import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from '../src/App';

describe('Lots 5-11 complete child interface', () => {
  it('shows a final child cockpit and starts the primary mission', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument());

    expect(screen.getByText(/aujourd’hui, tu deviens gardienne des devoirs/i)).toBeInTheDocument();
    expect(screen.getByText(/mission principale/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /je commence ma mission/i }));

    await waitFor(() => expect(screen.getByRole('heading', { name: /tables de multiplication/i })).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText(/question 1 sur 10/i)).toBeInTheDocument());
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

  it('enriches multiplication into a ten-calculation magical mastery session', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument());
    const multiplicationCard = screen.getByRole('heading', { name: /tables de multiplication/i }).closest('article');
    await user.click(within(multiplicationCard!).getByRole('button', { name: /continuer/i }));

    await waitFor(() => expect(screen.getByText(/question 1 sur 10/i)).toBeInTheDocument());
    expect(screen.getByRole('navigation', { name: /navigation enfant/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '49' }));

    await waitFor(() => expect(screen.getByText(/on retente/i)).toBeInTheDocument());
    expect(screen.getByRole('heading', { name: /7 × 8 = \?/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '56' }));
    await waitFor(() => expect(screen.getByText(/question 2 sur 10/i)).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /question suivante/i })).not.toBeInTheDocument();
  });

  it('shows the final score and highlights missed table facts in red', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument());
    const multiplicationCard = screen.getByRole('heading', { name: /tables de multiplication/i }).closest('article');
    await user.click(within(multiplicationCard!).getByRole('button', { name: /continuer/i }));

    await waitFor(() => expect(screen.getByText(/question 1 sur 10/i)).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: '49' }));
    await waitFor(() => expect(screen.getByText(/on retente/i)).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: '56' }));

    for (const [question, answer] of [
      [/7 × 6 = \?/i, '42'],
      [/7 × 9 = \?/i, '63'],
      [/7 × 4 = \?/i, '28'],
      [/7 × 7 = \?/i, '49'],
      [/7 × 2 = \?/i, '14'],
      [/7 × 5 = \?/i, '35'],
      [/7 × 3 = \?/i, '21'],
      [/7 × 1 = \?/i, '7'],
      [/7 × 10 = \?/i, '70'],
    ] as const) {
      await waitFor(() => expect(screen.getByRole('heading', { name: question })).toBeInTheDocument());
      await user.click(screen.getByRole('button', { name: answer }));
    }

    await waitFor(() => expect(screen.getByText(/score : 9 \/ 10/i)).toBeInTheDocument());
    expect(screen.getByRole('heading', { name: /table complète de 7/i })).toBeInTheDocument();
    const missedFact = screen.getByText('8 × 7 = 56').closest('li');
    expect(missedFact).toHaveClass('missed');
    expect(screen.getByText('6 × 7 = 42').closest('li')).toHaveClass('mastered');
  });

  it('lets the child launch every available multiplication table from the picker', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument());
    const multiplicationCard = screen.getByRole('heading', { name: /tables de multiplication/i }).closest('article');
    await user.click(within(multiplicationCard!).getByRole('button', { name: /continuer/i }));

    await waitFor(() => expect(screen.getByText(/question 1 sur 10/i)).toBeInTheDocument());
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
    await waitFor(() => expect(screen.getByRole('heading', { name: /dictée de la forêt magique/i })).toBeInTheDocument());
    await user.type(screen.getByLabelText(/ta phrase/i), 'Le petit renard traverse la foret');
    await user.click(screen.getByRole('button', { name: /corriger ma dictée/i }));
    await waitFor(() => expect(screen.getByText(/accent à ajouter/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /réessayer doucement/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /accueil/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument());
    const poetryCard = screen.getByRole('heading', { name: /poésie/i }).closest('article');
    await user.click(within(poetryCard!).getByRole('button', { name: /continuer/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /poésie des saisons/i })).toBeInTheDocument());
    expect(screen.getByText(/ligne 1/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cacher des mots/i })).toBeInTheDocument();
  });
});
