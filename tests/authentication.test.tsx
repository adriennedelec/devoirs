import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from '../src/App';

const AUTH_STORAGE_KEY = 'devoirs.adminSession.v1';

describe('Authentification administrateur', () => {
  it('bloque l’application derrière une page de connexion administrateur', async () => {
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);

    render(<App />);

    expect(screen.getByRole('heading', { name: /connexion administrateur/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /utilisateur/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: /navigation enfant/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /bonjour emma/i })).not.toBeInTheDocument();
  });

  it('refuse des identifiants invalides puis connecte l’administrateur', async () => {
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    const user = userEvent.setup();

    render(<App />);

    await user.type(screen.getByRole('textbox', { name: /utilisateur/i }), 'admin');
    await user.type(screen.getByLabelText(/mot de passe/i), 'mauvais');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/identifiants incorrects/i);
    expect(screen.queryByRole('navigation', { name: /navigation enfant/i })).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText(/mot de passe/i));
    await user.type(screen.getByLabelText(/mot de passe/i), 'KarineAdrien1287');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument();
    });

    const navigation = screen.getByRole('navigation', { name: /navigation enfant/i });
    expect(within(navigation).getByText(/^admin$/i)).toBeInTheDocument();
    expect(within(navigation).getByText(/^administrateur$/i)).toBeInTheDocument();
    expect(window.sessionStorage.getItem(AUTH_STORAGE_KEY)).toBe('admin');
  });

  it('connecte les identifiants famille comme utilisateur simple', async () => {
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    window.localStorage.setItem('devoirs.familySettings.v1', JSON.stringify({
      name: 'Famille Nedelec',
      illustration: 'house',
      username: 'famille',
      password: 'motdepassefamille',
    }));
    const user = userEvent.setup();

    render(<App />);

    await user.type(screen.getByRole('textbox', { name: /utilisateur/i }), 'famille');
    await user.type(screen.getByLabelText(/mot de passe/i), 'motdepassefamille');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument();
    });

    const navigation = screen.getByRole('navigation', { name: /navigation enfant/i });
    expect(within(navigation).getByText(/^famille$/i)).toBeInTheDocument();
    expect(within(navigation).getByText(/^utilisateur$/i)).toBeInTheDocument();
    expect(within(navigation).queryByText(/^administrateur$/i)).not.toBeInTheDocument();
    expect(JSON.parse(window.sessionStorage.getItem(AUTH_STORAGE_KEY) ?? '{}')).toEqual({ username: 'famille', role: 'user' });
  });
});
