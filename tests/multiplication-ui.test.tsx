import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from '../src/App';

describe('Lot 3 multiplication module UI', () => {
  it('opens the multiplication adventure from Accueil and gives feedback after a QCM answer', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument();
    });

    const multiplicationCard = screen.getByRole('heading', { name: /tables de multiplication/i }).closest('article');
    expect(multiplicationCard).not.toBeNull();

    await user.click(within(multiplicationCard!).getByRole('button', { name: /continuer/i }));

    expect(screen.getByRole('heading', { name: /tables de multiplication/i })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('region', { name: /choisis une table/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /table de 7/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: /7 × 8 = \?/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '56' }));

    await waitFor(() => {
      expect(screen.getByText(/bravo emma/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/tu gagnes 3 étoiles/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /question suivante/i })).toBeInTheDocument();
  });
});
