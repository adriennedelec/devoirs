import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from '../src/App';

describe('Lot 4 dictation and poetry UI', () => {
  it('opens the dictation module from Accueil and gives corrective feedback', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument();
    });

    const dictationCard = screen.getByRole('heading', { name: /dictée/i }).closest('article');
    expect(dictationCard).not.toBeNull();

    await user.click(within(dictationCard!).getByRole('button', { name: /continuer/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /dictée normale/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /dictée normale/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /écouter la phrase/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: /dictée de la forêt magique/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/ta phrase/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/ta phrase/i), 'Le petit renard traverse la foret');
    await user.click(screen.getByRole('button', { name: /corriger ma dictée/i }));

    await waitFor(() => {
      expect(screen.getByText(/très proche/i)).toBeInTheDocument();
    });
    expect(screen.getAllByText(/le petit renard traverse la forêt/i).length).toBeGreaterThan(0);
  });

  it('opens the dictation module from Accueil and lets the parent prepare a hidden word dictation text', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument();
    });

    const dictationCard = screen.getByRole('heading', { name: /dictée/i }).closest('article');
    expect(dictationCard).not.toBeNull();

    await user.click(within(dictationCard!).getByRole('button', { name: /continuer/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /dictée de mots/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: /dictée magique/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dictée de mots/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /dictée normale/i })).toBeInTheDocument();

    await user.type(screen.getByLabelText(/série de mots/i), 'dragon, cartable, rivière');
    await user.click(screen.getByRole('checkbox', { name: /présent/i }));
    await user.click(screen.getByRole('checkbox', { name: /futur/i }));
    await user.click(screen.getByRole('button', { name: /générer le texte/i }));

    await waitFor(() => {
      expect(screen.getByText(/texte masqué pour l’élève/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/Aujourd’hui.*dragon/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /lire le texte à l’élève/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /afficher pour le parent/i }));
    expect(screen.getByText(/Aujourd’hui, Emma observe le dragon/i)).toBeInTheDocument();
    expect(screen.getByText(/range le cartable/i)).toBeInTheDocument();
    expect(screen.getByText(/dessine la rivière/i)).toBeInTheDocument();
  });

  it('uses full page width and imports OCR words from a file into the word series field', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument();
    });

    const dictationCard = screen.getByRole('heading', { name: /dictée/i }).closest('article');
    expect(dictationCard).not.toBeNull();
    await user.click(within(dictationCard!).getByRole('button', { name: /continuer/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /dictée de mots/i })).toBeInTheDocument();
    });
    expect(document.querySelector('.dictation-app-layout .child-app-shell')).toBeInTheDocument();
    expect(screen.getByLabelText(/importer un fichier/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/prendre une photo/i)).toHaveAttribute('capture', 'environment');

    const file = new File(['Dragon\ncartable\nrivière'], 'liste-mots.txt', { type: 'text/plain' });
    await user.upload(screen.getByLabelText(/importer un fichier/i), file);

    await waitFor(() => {
      expect(screen.getByText(/3 mots détectés par OCR/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/série de mots/i)).toHaveValue('dragon, cartable, rivière');
  });

  it('opens the poetry module from Accueil and validates a simulated recital', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument();
    });

    const poetryCard = screen.getByRole('heading', { name: /poésie/i }).closest('article');
    expect(poetryCard).not.toBeNull();

    await user.click(within(poetryCard!).getByRole('button', { name: /continuer/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /poésie des saisons/i })).toBeInTheDocument();
    });
    expect(screen.getByText(/le printemps réveille les jardins/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /j’ai récité ma poésie/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /j’ai récité ma poésie/i }));

    await waitFor(() => {
      expect(screen.getByText(/bravo, récitation validée/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/tu gagnes 6 étoiles/i)).toBeInTheDocument();
  });
});
