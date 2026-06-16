import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from '../src/App';

describe('Lot 2 child navigation', () => {
  it('n’affiche plus le bloc étoiles/notifications du haut sur les pages enfants', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /notifications/i })).not.toBeInTheDocument();
    expect(container.querySelector('.topbar-actions')).not.toBeInTheDocument();
    expect(container.querySelector('.star-pill')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /parcours/i }));
    expect(screen.queryByRole('button', { name: /notifications/i })).not.toBeInTheDocument();
    expect(container.querySelector('.topbar-actions')).not.toBeInTheDocument();
    expect(container.querySelector('.star-pill')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /récompenses/i }));
    expect(screen.queryByRole('button', { name: /notifications/i })).not.toBeInTheDocument();
    expect(container.querySelector('.topbar-actions')).not.toBeInTheDocument();
    expect(container.querySelector('.star-pill')).not.toBeInTheDocument();
  });

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
    expect(screen.getByRole('heading', { name: /famille nedelec/i })).toBeInTheDocument();
    const emmaProfileCard = screen.getByRole('article', { name: /profil de emma/i });
    expect(emmaProfileCard).toHaveClass('active');
    expect(within(emmaProfileCard).getByRole('heading', { name: /Emma/ })).toBeInTheDocument();
    expect(within(emmaProfileCard).getByText(/CM1 • 9 ans/i)).toBeInTheDocument();
    expect(within(emmaProfileCard).getByText(/^Actif$/i)).toBeInTheDocument();
    expect(within(emmaProfileCard).queryByText(/profil actif/i)).not.toBeInTheDocument();
    expect(within(emmaProfileCard).getByRole('button', { name: /modifier emma/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /accueil/i }));
    expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument();
    const navigation = screen.getByRole('navigation', { name: /navigation enfant/i });
    expect(navigation).toBeInTheDocument();
    expect(navigation).toHaveClass('child-side-nav');
    expect(navigation).toHaveAccessibleName(/menu latéral/i);
    expect(within(navigation).getByLabelText(/utilisateur connecté admin/i)).toBeInTheDocument();
    expect(within(navigation).getByRole('button', { name: /se déconnecter/i })).toBeInTheDocument();

    const activeUserSwitcher = screen.getByRole('region', { name: /sélecteur utilisateur actif/i });
    const activeUserButton = within(activeUserSwitcher).getByRole('button', { name: /changer d’utilisateur actif : emma/i });
    expect(within(activeUserButton).getByText('🧒')).toBeInTheDocument();
    expect(within(activeUserButton).getByText('Emma')).toBeInTheDocument();
    expect(within(activeUserButton).queryByText(/CM1|profil actif|élève|connecté/i)).not.toBeInTheDocument();
  });

  it('ajoute un nouveau profil sans erreur', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: /profil/i }));

    await user.click(screen.getByRole('button', { name: /ajouter un profil/i }));
    const dialog = screen.getByRole('dialog', { name: /créer un profil élève/i });
    await user.type(within(dialog).getByRole('textbox', { name: /nom/i }), 'Léo');
    const ageInput = within(dialog).getByRole('spinbutton', { name: /âge/i });
    await user.clear(ageInput);
    await user.type(ageInput, '10');
    await user.selectOptions(within(dialog).getByRole('combobox', { name: /niveau scolaire/i }), 'CM2');

    await user.click(within(dialog).getByRole('button', { name: /enregistrer/i }));

    const createdProfileCard = await screen.findByRole('article', { name: /profil de léo/i });
    expect(createdProfileCard).toBeInTheDocument();
    expect(within(createdProfileCard).getByText(/CM2 • 10 ans/i)).toBeInTheDocument();
  });
});
