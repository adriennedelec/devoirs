import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from '../src/App';

describe('Lot 2 child navigation', () => {
  it('navigates between Accueil, Parcours, Récompenses and Profil without losing the child shell', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /parcours/i }));
    expect(screen.getByRole('heading', { name: /mon parcours/i })).toBeInTheDocument();
    expect(screen.getByText(/chaque étape te rapproche/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /récompenses/i }));
    expect(screen.getByRole('heading', { name: /mes récompenses/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /exploratrice des mots/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /profil/i }));
    expect(screen.getByRole('heading', { name: /profil d'emma/i })).toBeInTheDocument();
    expect(screen.getByText(/mode enfant sécurisé/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /accueil/i }));
    expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /navigation enfant/i })).toBeInTheDocument();
  });
});
