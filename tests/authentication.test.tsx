import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App';

const AUTH_STORAGE_KEY = 'devoirs.adminSession.v1';
const TEST_ADMIN_PASSWORD = 'admin-secret';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url === '/api/auth/login') {
      const body = JSON.parse(String(init?.body ?? '{}')) as { username?: string; password?: string };
      if (body.username === 'admin' && body.password === TEST_ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ session: { username: 'admin', role: 'admin' } }), { status: 200 });
      }
      return new Response(JSON.stringify({ error: 'Identifiants incorrects.' }), { status: 401 });
    }
    if (url === '/api/auth/logout') {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }
    return new Response(JSON.stringify({ error: 'Endpoint de test inattendu.' }), { status: 404 });
  }));
});

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
    await user.type(screen.getByLabelText(/mot de passe/i), TEST_ADMIN_PASSWORD);
    await user.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument();
    });

    const navigation = screen.getByRole('navigation', { name: /navigation enfant/i });
    expect(within(navigation).getByText(/^admin$/i)).toBeInTheDocument();
    expect(within(navigation).getByText(/^administrateur$/i)).toBeInTheDocument();
    expect(window.sessionStorage.getItem(AUTH_STORAGE_KEY)).toBe('admin');
  });

  it('connecte un utilisateur déclaré avec menus limités et droit famille en visualisation', async () => {
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    window.localStorage.setItem('devoirs.users.v1', JSON.stringify([
      {
        id: 'user-lecture',
        login: 'lecteur',
        password: 'secretlecture',
        familyId: 'famille-nedelec',
        menuAccess: ['home', 'reading', 'profile'],
        familyPermissions: { 'famille-nedelec': 'view' },
      },
    ]));
    const user = userEvent.setup();

    render(<App />);

    await user.type(screen.getByRole('textbox', { name: /utilisateur/i }), 'lecteur');
    await user.type(screen.getByLabelText(/mot de passe/i), 'secretlecture');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument();
    });

    const navigation = screen.getByRole('navigation', { name: /navigation enfant/i });
    expect(within(navigation).getByRole('button', { name: /accueil/i })).toBeInTheDocument();
    expect(within(navigation).getByRole('button', { name: /lecture/i })).toBeInTheDocument();
    expect(within(navigation).getByRole('button', { name: /profil/i })).toBeInTheDocument();
    expect(within(navigation).queryByRole('button', { name: /tables/i })).not.toBeInTheDocument();
    expect(within(navigation).queryByRole('button', { name: /paramétrage/i })).not.toBeInTheDocument();

    await user.click(within(navigation).getByRole('button', { name: /profil/i }));
    expect(await screen.findByRole('heading', { name: /famille nedelec/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /ajouter un profil/i })).not.toBeInTheDocument();
    expect(await screen.findByText(/droits sont en visualisation/i)).toBeInTheDocument();
  });

  it('permet à l’administrateur de créer un utilisateur avec menus et droits famille', async () => {
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    const user = userEvent.setup();

    render(<App />);

    await user.type(screen.getByRole('textbox', { name: /utilisateur/i }), 'admin');
    await user.type(screen.getByLabelText(/mot de passe/i), TEST_ADMIN_PASSWORD);
    await user.click(screen.getByRole('button', { name: /se connecter/i }));
    await user.click(await screen.findByRole('button', { name: /paramétrage/i }));

    expect(screen.getByRole('heading', { name: /gestion des utilisateurs/i })).toBeInTheDocument();
    await user.type(screen.getByRole('textbox', { name: /login utilisateur/i }), 'karine');
    await user.type(screen.getByLabelText(/mot de passe utilisateur/i), 'secret');
    await user.selectOptions(screen.getByRole('combobox', { name: /droit famille famille nedelec/i }), 'manage');
    await user.click(screen.getByRole('checkbox', { name: /lecture/i }));
    await user.click(screen.getByRole('checkbox', { name: /profil/i }));
    await user.click(screen.getByRole('button', { name: /enregistrer l’utilisateur/i }));

    expect(screen.getByText(/karine/i)).toBeInTheDocument();
    const storedUsers = JSON.parse(window.localStorage.getItem('devoirs.users.v1') ?? '[]');
    expect(storedUsers).toEqual(expect.arrayContaining([
      expect.objectContaining({
        login: 'karine',
        familyId: 'famille-nedelec',
        menuAccess: expect.arrayContaining(['reading', 'profile']),
        familyPermissions: expect.objectContaining({ 'famille-nedelec': 'manage' }),
      }),
    ]));
  });

  it('admin crée des familles et affecte des droits différents à un utilisateur', async () => {
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    const user = userEvent.setup();

    render(<App />);

    await user.type(screen.getByRole('textbox', { name: /utilisateur/i }), 'admin');
    await user.type(screen.getByLabelText(/mot de passe/i), TEST_ADMIN_PASSWORD);
    await user.click(screen.getByRole('button', { name: /se connecter/i }));
    await user.click(await screen.findByRole('button', { name: /paramétrage/i }));

    expect(screen.getByRole('heading', { name: /gestion des familles/i })).toBeInTheDocument();
    await user.type(screen.getByRole('textbox', { name: /nom de la famille/i }), 'Famille Martin');
    await user.type(screen.getByRole('textbox', { name: /identifiant famille/i }), 'famille-martin');
    await user.click(screen.getByRole('button', { name: /enregistrer la famille/i }));

    await user.type(screen.getByRole('textbox', { name: /login utilisateur/i }), 'multi');
    await user.type(screen.getByLabelText(/mot de passe utilisateur/i), 'secretmulti');
    await user.selectOptions(screen.getByRole('combobox', { name: /famille principale/i }), 'famille-martin');
    await user.selectOptions(screen.getByRole('combobox', { name: /droit famille famille nedelec/i }), 'view');
    await user.selectOptions(screen.getByRole('combobox', { name: /droit famille famille martin/i }), 'manage');
    await user.click(screen.getByRole('checkbox', { name: /profil/i }));
    await user.click(screen.getByRole('button', { name: /enregistrer l’utilisateur/i }));

    const storedFamilies = JSON.parse(window.localStorage.getItem('devoirs.families.v1') ?? '[]');
    expect(storedFamilies).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'famille-martin', name: 'Famille Martin' }),
    ]));
    const storedUsers = JSON.parse(window.localStorage.getItem('devoirs.users.v1') ?? '[]');
    expect(storedUsers).toEqual(expect.arrayContaining([
      expect.objectContaining({
        login: 'multi',
        familyId: 'famille-martin',
        passwordHash: 'sha256:ffe5431cfab2ebd92727953036bed9c0d869f597520fe18acf65c120bd968905',
        familyPermissions: expect.objectContaining({ 'famille-nedelec': 'view', 'famille-martin': 'manage' }),
      }),
    ]));
    expect(storedUsers.find((storedUser: { login: string; password?: string }) => storedUser.login === 'multi')?.password).toBeUndefined();
  });

  it('filtre les profils par famille et applique les droits gestion/visualisation par famille', async () => {
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    window.localStorage.setItem('devoirs.families.v1', JSON.stringify([
      { id: 'famille-nedelec', name: 'Famille Nedelec', illustration: 'house' },
      { id: 'famille-martin', name: 'Famille Martin', illustration: 'garden' },
    ]));
    window.localStorage.setItem('devoirs.childProfiles.v1', JSON.stringify([
      { id: 'emma-demo', familyId: 'famille-nedelec', name: 'Emma', avatarEmoji: '🧒', avatarPhotoUrl: '', role: 'eleve', schoolLevel: 'CM1', age: 9, profileColor: '#6D5DFC' },
      { id: 'leo-martin', familyId: 'famille-martin', name: 'Léo', avatarEmoji: '🧒', avatarPhotoUrl: '', role: 'eleve', schoolLevel: 'CE2', age: 8, profileColor: '#4E7DFF' },
    ]));
    window.localStorage.setItem('devoirs.users.v1', JSON.stringify([
      {
        id: 'user-multi',
        login: 'multi',
        passwordHash: 'sha256:7365637265746d756c7469',
        familyId: 'famille-martin',
        menuAccess: ['home', 'profile'],
        familyPermissions: { 'famille-nedelec': 'view', 'famille-martin': 'manage' },
      },
    ]));
    const user = userEvent.setup();

    render(<App />);

    await user.type(screen.getByRole('textbox', { name: /utilisateur/i }), 'multi');
    await user.type(screen.getByLabelText(/mot de passe/i), 'secretmulti');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));
    await user.click(await screen.findByRole('button', { name: /profil/i }));

    expect(await screen.findByRole('heading', { name: /famille martin/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /léo/i })).toBeInTheDocument();
    expect(screen.queryByText(/emma/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ajouter un profil/i })).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: /famille active/i }), 'famille-nedelec');
    expect(await screen.findByRole('heading', { name: /famille nedelec/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /emma/i })).toBeInTheDocument();
    expect(screen.queryByText(/léo/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /ajouter un profil/i })).not.toBeInTheDocument();
    expect(screen.getByText(/droits sont en visualisation/i)).toBeInTheDocument();
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
