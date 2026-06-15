import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../src/App';

async function openProfilePage() {
  const user = userEvent.setup();
  render(<App />);
  await user.click(await screen.findByRole('button', { name: /profil/i }));
  await screen.findByRole('heading', { name: /famille nedelec/i });
  return user;
}

describe('Page Profil famille', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('affiche un en-tête famille avec niveau et profil actif sans casser la sidebar', async () => {
    await openProfilePage();

    const navigation = screen.getByRole('navigation', { name: /navigation enfant/i });
    expect(navigation).toHaveClass('child-side-nav');
    expect(navigation).toHaveClass('expanded');
    expect(within(navigation).getByRole('button', { name: /accueil/i })).toBeInTheDocument();
    expect(within(navigation).getByRole('button', { name: /profil/i })).toHaveAttribute('aria-current', 'page');
    expect(within(navigation).getByRole('button', { name: /désactiver l’épingle du menu/i })).toHaveAttribute('aria-pressed', 'true');

    const familyHeader = screen.getByRole('region', { name: /en-tête famille/i });
    expect(familyHeader).toHaveClass('screenshot-family-header');
    expect(within(familyHeader).getByRole('button', { name: /modifier l’image de la famille/i })).toBeInTheDocument();
    expect(within(familyHeader).getByRole('button', { name: /modifier le nom de la famille/i })).toBeInTheDocument();
    expect(within(familyHeader).getByTestId('family-house-visual')).toHaveClass('family-hero-house');
    expect(within(familyHeader).getByRole('heading', { name: /famille nedelec/i })).toBeInTheDocument();
    expect(within(familyHeader).getByText(/niveau 7/i)).toHaveClass('family-level-tag');
    expect(within(familyHeader).queryByText(/profil actif/i)).not.toBeInTheDocument();
    expect(within(familyHeader).queryByLabelText(/utilisateur actuellement actif/i)).not.toBeInTheDocument();
    expect(within(familyHeader).queryByTestId('active-profile-dot')).not.toBeInTheDocument();
    expect(within(familyHeader).queryByTestId('profile-color-dot-emma-demo')).not.toBeInTheDocument();

    const globalSwitcher = screen.getByRole('region', { name: /sélecteur utilisateur actif/i });
    expect(within(globalSwitcher).getByRole('button', { name: /changer d’utilisateur actif/i })).toHaveTextContent(/Emma/i);
    expect(within(globalSwitcher).queryByTestId('active-profile-dot')).not.toBeInTheDocument();

    expect(within(familyHeader).queryByText(/espace famille/i)).not.toBeInTheDocument();
    expect(within(familyHeader).queryByText(/gestion des enfants/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/niveau exploratrice de mots/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/notifications/i)).not.toBeInTheDocument();
  });

  it('liste tous les profils famille, active un seul profil et met à jour le résumé actif', async () => {
    const user = await openProfilePage();

    const strip = screen.getByRole('region', { name: /profils famille/i });
    const emmaCard = within(strip).getByRole('article', { name: /profil de emma/i });
    const louaneCard = within(strip).getByRole('article', { name: /profil de louane/i });
    const adrienCard = within(strip).getByRole('article', { name: /profil de adrien/i });

    expect(within(emmaCard).getByText(/^Actif$/i)).toBeInTheDocument();
    expect(within(louaneCard).getByText(/CE1 • 7 ans/i)).toBeInTheDocument();
    expect(within(adrienCard).getByText(/^Parent$/i)).toBeInTheDocument();
    expect(within(louaneCard).getByRole('button', { name: /activer louane/i })).toBeInTheDocument();
    expect(within(adrienCard).getByRole('button', { name: /modifier adrien/i })).toBeInTheDocument();

    await user.click(within(louaneCard).getByRole('button', { name: /activer louane/i }));

    expect(within(louaneCard).getByText(/^Actif$/i)).toBeInTheDocument();
    expect(within(emmaCard).getByText(/^Inactif$/i)).toBeInTheDocument();
    const globalSwitcher = screen.getByRole('region', { name: /sélecteur utilisateur actif/i });
    expect(within(globalSwitcher).getByRole('button', { name: /changer d’utilisateur actif/i })).toHaveTextContent(/louane/i);
    expect(window.localStorage.getItem('devoirs.activeProfileId.v1')).toBe('louane-demo');
  });

  it('permet de changer d’utilisateur depuis n’importe quelle page sans repasser par Profil', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: /lecture/i }));
    await screen.findByRole('heading', { name: /lecture/i });

    const globalSwitcher = screen.getByRole('region', { name: /sélecteur utilisateur actif/i });
    expect(within(globalSwitcher).getByRole('button', { name: /changer d’utilisateur actif/i })).toHaveTextContent(/Emma/i);

    await user.click(within(globalSwitcher).getByRole('button', { name: /changer d’utilisateur actif/i }));
    const menu = screen.getByRole('dialog', { name: /changer d’utilisateur actif/i });
    await user.click(within(menu).getByRole('button', { name: /utiliser louane/i }));

    await waitFor(() => expect(screen.queryByRole('dialog', { name: /changer d’utilisateur actif/i })).not.toBeInTheDocument());
    expect(within(globalSwitcher).getByRole('button', { name: /changer d’utilisateur actif/i })).toHaveTextContent(/Louane/i);
    expect(screen.getByRole('heading', { name: /lecture/i })).toBeInTheDocument();
    expect(window.localStorage.getItem('devoirs.activeProfileId.v1')).toBe('louane-demo');
  });

  it('charge les menus d’exercices avec un profil enfant personnalisé sans erreur de données mock', async () => {
    window.localStorage.setItem('devoirs.childProfiles.v1', JSON.stringify([
      {
        id: 'enora-custom',
        name: 'Enora',
        avatarEmoji: '👧',
        avatarPhotoUrl: '',
        age: 7,
        role: 'eleve',
        schoolLevel: 'CE1',
        profileColor: '#F25CA2',
      },
    ]));
    window.localStorage.setItem('devoirs.activeProfileId.v1', 'enora-custom');

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /bonjour enora/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /lecture/i }));
    expect(await screen.findByText(/mission compréhension/i)).toBeInTheDocument();
    expect(screen.queryByText(/aucune donnée trouvée/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /dictée/i }));
    expect(await screen.findByRole('button', { name: /dictée normale/i })).toBeInTheDocument();
    expect(screen.queryByText(/aucune donnée trouvée/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /poésie/i }));
    expect(await screen.findByText(/mission mémoire/i)).toBeInTheDocument();
    expect(screen.queryByText(/aucune donnée trouvée/i)).not.toBeInTheDocument();
  });

  it('ouvre la modification depuis la carte et permet de changer la couleur des graphiques', async () => {
    const user = await openProfilePage();

    const emmaCard = screen.getByRole('article', { name: /profil de emma/i });
    await user.click(within(emmaCard).getByRole('button', { name: /modifier emma/i }));

    const dialog = screen.getByRole('dialog', { name: /modifier le profil/i });
    expect(within(dialog).getByLabelText(/couleur associée aux graphiques/i)).toBeInTheDocument();
    const greenColorRadio = within(dialog).getByDisplayValue('#20B486');
    await user.click(greenColorRadio);
    await user.click(within(dialog).getByRole('button', { name: /enregistrer/i }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const overview = screen.getByRole('region', { name: /aperçu des activités/i });
    expect(within(overview).getByTestId('profile-color-dot-emma-demo')).toHaveStyle({ background: '#20B486' });
    expect(within(overview).getByLabelText(/histogramme temps d’activité/i).querySelector('[data-profile-id="emma-demo"]')).toHaveStyle({ background: '#20B486' });
  });

  it('ouvre l’édition famille depuis le nom et propose plusieurs images type', async () => {
    const user = await openProfilePage();

    const familyHeader = screen.getByRole('region', { name: /en-tête famille/i });
    await user.click(within(familyHeader).getByRole('button', { name: /modifier le nom de la famille/i }));

    const dialog = screen.getByRole('dialog', { name: /modifier la famille/i });
    expect(within(dialog).getByRole('textbox', { name: /nom de la famille/i })).toHaveValue('Famille Nedelec');
    expect(within(dialog).getByLabelText(/image de la famille/i).querySelectorAll('.family-hero-visual.miniature')).toHaveLength(3);
    await user.clear(within(dialog).getByRole('textbox', { name: /nom de la famille/i }));
    await user.type(within(dialog).getByRole('textbox', { name: /nom de la famille/i }), 'Famille Test');
    await user.click(within(dialog).getByDisplayValue('garden'));
    await user.click(within(dialog).getByRole('button', { name: /enregistrer/i }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(within(familyHeader).getByRole('heading', { name: /famille test/i })).toBeInTheDocument();
    expect(within(familyHeader).getByTestId('family-house-visual')).toHaveClass('family-hero-garden');
  });

  it('affiche les KPI famille avec graphiques groupés, période 7 jours et couleurs utilisateur stables', async () => {
    await openProfilePage();

    const overview = screen.getByRole('region', { name: /aperçu des activités/i });
    expect(overview).toHaveClass('activity-overview-panel');
    expect(within(overview).getByRole('combobox', { name: /période/i })).toHaveValue('7');
    expect(within(overview).getByText(/Dernières connexions/i).closest('article')).toHaveClass('kpi-card-connections');
    expect(within(overview).getByText(/^Temps d’activité$/i)).toBeInTheDocument();
    expect(within(overview).getByText(/en minutes par jour/i)).toBeInTheDocument();
    expect(within(overview).getByText(/^Exercices réalisés$/i)).toBeInTheDocument();
    expect(within(overview).getByText(/par matière/i)).toBeInTheDocument();
    expect(within(overview).getByText(/^Étoiles gagnées$/i)).toBeInTheDocument();
    expect(within(overview).getByText(/^par jour$/i)).toBeInTheDocument();

    const emmaColorDot = within(overview).getByTestId('profile-color-dot-emma-demo');
    const louaneColorDot = within(overview).getByTestId('profile-color-dot-louane-demo');
    expect(emmaColorDot).toHaveStyle({ background: '#6D5DFC' });
    expect(louaneColorDot).toHaveStyle({ background: '#F25CA2' });

    const activityChart = within(overview).getByLabelText(/histogramme temps d’activité/i);
    expect(activityChart).toHaveAttribute('data-series-count', '2');
    expect(activityChart.querySelector('[data-profile-id="emma-demo"]')).toHaveStyle({ background: '#6D5DFC' });
    expect(activityChart.querySelector('[data-profile-id="louane-demo"]')).toHaveStyle({ background: '#F25CA2' });
    expect(within(overview).getByLabelText(/histogramme étoiles gagnées/i).querySelectorAll('.activity-bar')).toHaveLength(14);
  });

  it('filtre, trie et pagine l’historique détaillé sans colonnes étoiles ou appréciation', async () => {
    const user = await openProfilePage();

    const history = screen.getByRole('region', { name: /historique détaillé des activités/i });
    const table = within(history).getByRole('table', { name: /activités famille/i });
    expect(within(table).getByRole('columnheader', { name: /profil/i })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: /activité/i })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: /matière/i })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: /date et heure/i })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: /résultat/i })).toBeInTheDocument();
    expect(within(table).queryByRole('columnheader', { name: /étoile/i })).not.toBeInTheDocument();
    expect(within(table).queryByRole('columnheader', { name: /appréciation/i })).not.toBeInTheDocument();
    expect(within(history).queryByRole('searchbox')).not.toBeInTheDocument();
    expect(within(history).getByText(/1–7 sur 7 activités/i)).toBeInTheDocument();
    expect(within(history).getByRole('combobox', { name: /éléments par page/i })).toHaveValue('10');
    expect(within(table).getAllByText(/%/)[0]).toHaveClass('result-pill');

    await user.selectOptions(within(history).getByRole('combobox', { name: /filtrer par profil/i }), 'louane-demo');
    expect(within(history).getByText(/résultats filtrés/i)).toHaveTextContent(/Louane/i);
    expect(within(table).queryByText(/Emma/)).not.toBeInTheDocument();

    await user.click(within(history).getByRole('button', { name: /trier par résultat/i }));
    expect(within(history).getByText(/tri : résultat ascendant/i)).toBeInTheDocument();

    await user.click(within(history).getByRole('button', { name: /réinitialiser/i }));
    expect(within(history).getByRole('combobox', { name: /filtrer par profil/i })).toHaveValue('all');
    expect(within(history).getByText(/total des résultats/i)).toBeInTheDocument();
  });

  it('utilise un seul bouton + pour ouvrir l’ajout et crée un profil enfant', async () => {
    const user = await openProfilePage();

    const addRegion = screen.getByRole('region', { name: /profils famille/i });
    expect(screen.queryByRole('button', { name: /\+ élève/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /\+ parent/i })).not.toBeInTheDocument();

    await user.click(within(addRegion).getByRole('button', { name: /ajouter un profil/i }));
    const dialog = screen.getByRole('dialog', { name: /créer un profil élève/i });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByRole('radio', { name: /élève/i })).toBeChecked();
    expect(within(dialog).getByRole('radio', { name: /parent/i })).toBeInTheDocument();

    await user.type(within(dialog).getByRole('textbox', { name: /nom/i }), 'Léo');
    await user.type(within(dialog).getByRole('spinbutton', { name: /âge/i }), '10');
    await user.selectOptions(within(dialog).getByRole('combobox', { name: /niveau scolaire/i }), 'CM2');
    await user.click(within(dialog).getByRole('button', { name: /enregistrer/i }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const createdCard = screen.getByRole('article', { name: /profil de léo/i });
    expect(within(createdCard).getByText(/CM2 • 10 ans/i)).toBeInTheDocument();
  });

  it('permet de définir un ordre unique pour tous les profils famille', async () => {
    window.localStorage.setItem('devoirs.childProfiles.v1', JSON.stringify([
      { id: 'emma-demo', name: 'Emma', avatarEmoji: '🧒', avatarPhotoUrl: '', age: 9, role: 'eleve', schoolLevel: 'CM1', profileColor: '#6D5DFC', displayOrder: 2 },
      { id: 'louane-demo', name: 'Louane', avatarEmoji: '👧', avatarPhotoUrl: '', age: 7, role: 'eleve', schoolLevel: 'CE1', profileColor: '#F25CA2', displayOrder: 1 },
      { id: 'adrien-parent', name: 'Adrien', avatarEmoji: '👤', avatarPhotoUrl: '', role: 'parent', schoolLevel: '', profileColor: '#7A8AA0', displayOrder: 3 },
    ]));

    const user = await openProfilePage();
    const strip = screen.getByRole('region', { name: /profils famille/i });
    expect(within(strip).getAllByRole('article').map((card) => card.getAttribute('aria-label'))).toEqual([
      'Profil de Louane',
      'Profil de Emma',
      'Profil de Adrien',
    ]);

    const orderRegion = screen.getByRole('region', { name: /ordre d’affichage/i });
    expect(within(orderRegion).getByRole('spinbutton', { name: /ordre de louane/i })).toHaveValue(1);
    expect(within(orderRegion).getByRole('spinbutton', { name: /ordre de emma/i })).toHaveValue(2);

    await user.clear(within(orderRegion).getByRole('spinbutton', { name: /ordre de emma/i }));
    await user.type(within(orderRegion).getByRole('spinbutton', { name: /ordre de emma/i }), '1');
    await user.click(within(orderRegion).getByRole('button', { name: /enregistrer l'ordre des profils/i }));
    expect(within(orderRegion).getByRole('alert')).toHaveTextContent(/le même ordre ne peut pas être utilisé/i);

    await user.clear(within(orderRegion).getByRole('spinbutton', { name: /ordre de emma/i }));
    await user.type(within(orderRegion).getByRole('spinbutton', { name: /ordre de emma/i }), '4');
    await user.click(within(orderRegion).getByRole('button', { name: /enregistrer l'ordre des profils/i }));

    await waitFor(() => expect(within(orderRegion).getByText(/ordre enregistré/i)).toBeInTheDocument());
    const storedProfiles = JSON.parse(window.localStorage.getItem('devoirs.childProfiles.v1') ?? '[]');
    expect(storedProfiles.find((profile: { id: string; displayOrder?: number }) => profile.id === 'emma-demo')?.displayOrder).toBe(4);
  });

  it('bascule la sidebar entre mode épinglé étendu et mode compact sans renommer les menus', async () => {
    const user = await openProfilePage();

    const navigation = screen.getByRole('navigation', { name: /navigation enfant/i });
    expect(navigation).toHaveClass('expanded');
    expect(within(navigation).getByText('Accueil')).toBeInTheDocument();

    await user.click(within(navigation).getByRole('button', { name: /désactiver l’épingle du menu/i }));

    expect(navigation).toHaveClass('compact');
    expect(within(navigation).getByRole('button', { name: /épingler le menu étendu/i })).toHaveAttribute('aria-pressed', 'false');
    expect(within(navigation).getByRole('button', { name: /accueil/i })).toBeInTheDocument();
    expect(within(navigation).getByText('Accueil')).toHaveClass('nav-label');

    await user.click(within(navigation).getByRole('button', { name: /épingler le menu étendu/i }));

    expect(navigation).toHaveClass('expanded');
    expect(within(navigation).getByRole('button', { name: /désactiver l’épingle du menu/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('réaffiche Adrien avec sa photo même si un ancien stockage local ne contenait que les enfants', async () => {
    window.localStorage.setItem('devoirs.childProfiles.v1', JSON.stringify([
      {
        id: 'emma-demo',
        name: 'Emma',
        avatarEmoji: '🧒',
        avatarPhotoUrl: '',
        age: 9,
        role: 'eleve',
        schoolLevel: 'CM1',
      },
    ]));

    await openProfilePage();

    const parentCard = screen.getByRole('article', { name: /profil de adrien/i });
    expect(parentCard.querySelector('img')?.getAttribute('src')).toMatch(/adrien\.png/i);
  });
});
