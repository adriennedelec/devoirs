import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App';

describe('Lot 4 dictation and poetry UI', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('saves the edited Llama dictation prompt as the new default and confirms it below the editor', async () => {
    const user = userEvent.setup();
    const customPrompt = 'PROMPT PARENT SAUVEGARDE {{mots}} {{verbes}} {{temps}}';
    const { unmount } = render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument();
    });

    const dictationCard = screen.getByRole('heading', { name: /dictée/i }).closest('article');
    expect(dictationCard).not.toBeNull();
    await user.click(within(dictationCard!).getByRole('button', { name: /continuer/i }));

    const promptEditor = await screen.findByLabelText(/template du prompt llama/i);
    fireEvent.change(promptEditor, { target: { value: customPrompt } });

    expect(screen.getByText(/nouveau prompt enregistré/i)).toBeInTheDocument();
    expect(window.localStorage.getItem('devoirs.wordDictation.llamaPrompt')).toBe(customPrompt);

    unmount();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument();
    });
    const reopenedDictationCard = screen.getByRole('heading', { name: /dictée/i }).closest('article');
    expect(reopenedDictationCard).not.toBeNull();
    await user.click(within(reopenedDictationCard!).getByRole('button', { name: /continuer/i }));

    expect(await screen.findByLabelText(/template du prompt llama/i)).toHaveValue(customPrompt);
  });

  it('keeps generic placeholders visible in the default Llama prompt editor while words change', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument();
    });

    const dictationCard = screen.getByRole('heading', { name: /dictée/i }).closest('article');
    expect(dictationCard).not.toBeNull();
    await user.click(within(dictationCard!).getByRole('button', { name: /continuer/i }));

    const promptEditor = await screen.findByLabelText(/template du prompt llama/i);
    expect((promptEditor as HTMLTextAreaElement).value).toContain('{{mots}}');
    expect((promptEditor as HTMLTextAreaElement).value).toContain('{{verbes}}');
    expect((promptEditor as HTMLTextAreaElement).value).toContain('{{temps}}');

    await user.type(screen.getByLabelText(/série de mots/i), 'dragon, cartable');
    await user.type(screen.getByLabelText(/^verbes \(séparateur virgule\)$/i), 'courir');
    await user.click(screen.getByRole('checkbox', { name: /présent/i }));

    expect((promptEditor as HTMLTextAreaElement).value).toContain('{{mots}}');
    expect((promptEditor as HTMLTextAreaElement).value).toContain('{{verbes}}');
    expect((promptEditor as HTMLTextAreaElement).value).toContain('{{temps}}');
    expect((promptEditor as HTMLTextAreaElement).value).not.toContain('- dragon');

    await user.click(screen.getByText(/aperçu réel envoyé à ollama/i));
    expect(screen.getByText(/- dragon/)).toBeInTheDocument();
    expect(screen.getByText(/- cartable/)).toBeInTheDocument();
    expect(screen.getByText(/- courir/)).toBeInTheDocument();
  });

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

  it('opens the dictation module from Accueil and shows the Ollama text before parent controls without regenerating automatically', async () => {
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
    expect(screen.queryByRole('group', { name: /moteur de génération/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: /ia locale ollama/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: /local secours/i })).not.toBeInTheDocument();

    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({
        response: 'Aujourd’hui, Emma range dans son cartable des cartes avec dragon et rivière.',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        response: 'Demain, Emma mettra dans son cartable un dragon près de la rivière.',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    await user.type(screen.getByLabelText(/série de mots/i), 'dragon, cartable, rivière');
    await user.click(screen.getByRole('checkbox', { name: /présent/i }));
    await user.click(screen.getByRole('button', { name: /générer le texte/i }));

    const generatedText = await screen.findByText(/Aujourd’hui, Emma range dans son cartable des cartes avec dragon et rivière/i);
    expect(screen.getByRole('heading', { name: /texte produit par ollama/i })).toBeInTheDocument();
    expect(screen.queryByText(/texte masqué pour l’élève/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/texte masqué/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /lire le texte à l’élève/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /relancer ollama/i })).toBeInTheDocument();

    const controls = screen.getByRole('group', { name: /contrôles parent/i });
    expect(generatedText.compareDocumentPosition(controls)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(within(controls).getByText('dragon')).toBeInTheDocument();
    expect(within(controls).getByText('cartable')).toBeInTheDocument();
    expect(within(controls).getByText('rivière')).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: /futur/i }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Aujourd’hui, Emma range dans son cartable des cartes avec dragon et rivière/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /relancer ollama/i }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
    expect(await screen.findByText(/Demain, Emma mettra dans son cartable un dragon près de la rivière/i)).toBeInTheDocument();
    expect(screen.queryByText(/utilise aussi|écrit aussi|mot dragon|mot cartable|mot rivière|rencontre.*rivière/i)).not.toBeInTheDocument();
  });

  it('asks the parent to confirm an unknown typed word before generating the text', async () => {
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

    await user.type(screen.getByLabelText(/série de mots/i), 'dragon cartable/rivière. dragonnn');
    await user.click(screen.getByRole('button', { name: /générer le texte/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/mot à confirmer/i).length).toBeGreaterThan(0);
    });
    expect(screen.getByText('dragonnn')).toBeInTheDocument();
    expect(screen.queryByText(/texte masqué pour l’élève/i)).not.toBeInTheDocument();

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({
      response: 'Aujourd’hui, Emma range dans son cartable des cartes avec dragon, rivière et dragonnn.',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    await user.click(screen.getByRole('button', { name: /confirmer et générer/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /texte produit par ollama/i })).toBeInTheDocument();
    });
    expect(screen.queryByText(/texte masqué pour l’élève/i)).not.toBeInTheDocument();
    expect(screen.getByText('dragon')).toBeInTheDocument();
    expect(screen.getByText('cartable')).toBeInTheDocument();
    expect(screen.getByText('rivière')).toBeInTheDocument();
  });

  it('shows an animated waiting label while the default Ollama generation is running', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise<Response>(() => undefined));
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument();
    });

    const dictationCard = screen.getByRole('heading', { name: /dictée/i }).closest('article');
    expect(dictationCard).not.toBeNull();
    await user.click(within(dictationCard!).getByRole('button', { name: /continuer/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/série de mots/i)).toBeInTheDocument();
    });
    expect(screen.queryByRole('radio', { name: /local secours/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: /ia locale ollama/i })).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(/série de mots/i), 'dragon cartable rivière');
    await user.click(screen.getByRole('button', { name: /générer le texte/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /génération en cours/i })).toBeDisabled();
    });
    expect(screen.getByText(/ollama écrit puis l’app vérifie les mots/i)).toBeInTheDocument();
    expect(document.querySelector('.loading-dots')).toBeInTheDocument();
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

  it('shows confirmation when OCR detects an unknown word', async () => {
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

    const file = new File(['Dragon\ndragonnn\ncartable'], 'liste-mots.txt', { type: 'text/plain' });
    await user.upload(screen.getByLabelText(/importer un fichier/i), file);

    await waitFor(() => {
      expect(screen.getAllByText(/mot à confirmer/i).length).toBeGreaterThan(0);
    });
    expect(screen.getByText('dragonnn')).toBeInTheDocument();
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
