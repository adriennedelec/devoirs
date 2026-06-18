import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App';

describe('Lot 4 dictation and poetry UI', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('shows the updated reading text-size menu ranges including XXL', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument();
    });

    const readingCard = screen.getByRole('heading', { name: /lecture/i }).closest('article');
    expect(readingCard).not.toBeNull();
    await user.click(within(readingCard!).getByRole('button', { name: /continuer/i }));

    const sizeSelect = await screen.findByLabelText(/taille du texte/i);
    expect(sizeSelect).toHaveTextContent('XS · 60 à 90 mots');
    expect(sizeSelect).toHaveTextContent('S · 90 à 150 mots');
    expect(sizeSelect).toHaveTextContent('M · 150 à 250 mots');
    expect(sizeSelect).toHaveTextContent('L · 300 à 500 mots');
    expect(sizeSelect).toHaveTextContent('XL · 600 à 800 mots');
    expect(sizeSelect).toHaveTextContent('XXL · 1200 à 1800 mots');
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

  it('adds a word-by-word audio track with full-text playback, five-word playback, and movable cursor', async () => {
    const user = userEvent.setup();
    const spokenTexts: string[] = [];
    const spokenRates: number[] = [];
    const timeoutSpy = vi.spyOn(window, 'setTimeout');
    let lastUtterance: { text: string; onend?: () => void } | null = null;

    class SpeechSynthesisUtteranceMock {
      text: string;
      lang = '';
      rate = 1;
      pitch = 1;
      volume = 1;
      onend?: () => void;
      onboundary?: (event: { name: string; charIndex: number }) => void;

      constructor(text: string) {
        this.text = text;
      }
    }

    vi.stubGlobal('SpeechSynthesisUtterance', SpeechSynthesisUtteranceMock);
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        speaking: false,
        pending: false,
        cancel: vi.fn(),
        speak: vi.fn((utterance: SpeechSynthesisUtterance & { onend?: () => void }) => {
          lastUtterance = utterance;
          spokenTexts.push(utterance.text);
          spokenRates.push(utterance.rate);
        }),
      },
    });

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      response: 'Emma range dragon, cartable rivière. Puis elle avance avec calme.',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument();
    });

    const dictationCard = screen.getByRole('heading', { name: /dictée/i }).closest('article');
    expect(dictationCard).not.toBeNull();
    await user.click(within(dictationCard!).getByRole('button', { name: /continuer/i }));
    await user.type(await screen.findByLabelText(/série de mots/i), 'dragon, cartable, rivière');
    await user.click(screen.getByRole('button', { name: /générer le texte/i }));

    expect(await screen.findByText(/Emma range dragon, cartable rivière/i)).toBeInTheDocument();
    const track = screen.getByRole('group', { name: /piste audio de dictée/i });
    expect(within(track).getByText(/10 mots au total/i)).toBeInTheDocument();
    expect(within(track).getAllByTestId('dictation-word-marker')).toHaveLength(10);
    expect(within(track).getByRole('slider', { name: /déplacer le curseur sur la piste audio/i })).toHaveValue('0');
    expect(screen.getByRole('button', { name: /lire le texte à l’élève/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /lire 5 mots par 5 mots/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /lire par bloc/i })).toBeInTheDocument();
    const speedControls = screen.getByRole('group', { name: /vitesse de lecture/i });
    expect(within(speedControls).getByRole('button', { name: /lent/i })).toHaveAttribute('aria-pressed', 'false');
    expect(within(speedControls).getByRole('button', { name: /moyen/i })).toHaveAttribute('aria-pressed', 'false');
    expect(within(speedControls).getByRole('button', { name: /rapide/i })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: /lire 5 mots par 5 mots/i }));
    expect(spokenTexts.at(-1)).toBe('Emma range dragon virgule cartable rivière point');
    expect(spokenRates.at(-1)).toBe(0.72);
    act(() => {
      if (lastUtterance) {
        lastUtterance.onend?.();
      }
    });
    await waitFor(() => {
      expect(within(track).getByRole('slider', { name: /déplacer le curseur sur la piste audio/i })).toHaveValue('5');
    });

    await user.click(screen.getByRole('button', { name: /lire 5 mots par 5 mots/i }));
    expect(spokenTexts.at(-1)).toBe('Puis elle avance avec calme point');

    fireEvent.change(within(track).getByRole('slider', { name: /déplacer le curseur sur la piste audio/i }), { target: { value: '0' } });
    await user.click(screen.getByRole('button', { name: /lire par bloc/i }));
    expect(spokenTexts.at(-1)).toBe('Emma range dragon virgule');

    fireEvent.change(within(track).getByRole('slider', { name: /déplacer le curseur sur la piste audio/i }), { target: { value: '2' } });
    expect(within(track).getByText(/mot 3 sur 10/i)).toBeInTheDocument();
    await user.click(within(speedControls).getByRole('button', { name: /moyen/i }));
    await user.click(screen.getByRole('button', { name: /lire le texte à l’élève/i }));
    expect(spokenTexts.at(-1)).toBe('dragon virgule');
    expect(spokenRates.at(-1)).toBeCloseTo(0.72, 5);
    act(() => {
      if (lastUtterance) {
        lastUtterance.onend?.();
      }
    });
    await waitFor(() => {
      expect(within(track).getByRole('slider', { name: /déplacer le curseur sur la piste audio/i })).toHaveValue('3');
    });
    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1200);

    await user.click(within(speedControls).getByRole('button', { name: /lent/i }));
    await user.click(screen.getByRole('button', { name: /lire le texte à l’élève/i }));
    expect(spokenTexts.at(-1)).toBe('cartable');
    expect(spokenRates.at(-1)).toBeCloseTo(0.72, 5);
  });

  it('lets the child write the generated dictation without spellcheck and reveals two help levels after completion', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      response: 'Emma range dragon cartable rivière.\nPuis elle avance avec calme.',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument();
    });

    const dictationCard = screen.getByRole('heading', { name: /dictée/i }).closest('article');
    expect(dictationCard).not.toBeNull();
    await user.click(within(dictationCard!).getByRole('button', { name: /continuer/i }));
    await user.type(await screen.findByLabelText(/série de mots/i), 'dragon, cartable, rivière');
    await user.click(screen.getByRole('button', { name: /générer le texte/i }));

    expect(await screen.findByText(/Emma range dragon cartable rivière/i)).toBeInTheDocument();
    const childAnswer = screen.getByLabelText(/zone d'écriture de l'enfant/i);
    expect(childAnswer).toHaveAttribute('spellcheck', 'false');
    expect(childAnswer).toHaveAttribute('autocomplete', 'off');
    expect(childAnswer).toHaveAttribute('autocorrect', 'off');
    expect(screen.getByText(/0 mot écrit/i)).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /aide niveau 1/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /aide niveau 2/i })).toBeDisabled();

    await user.type(childAnswer, 'Emma range dragn cartable rivière.\nPuis elle avance avec calm.');
    expect(screen.getByText(/10 mots écrits/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /j'ai fini/i }));

    expect(await screen.findByText(/2 fautes réalisées/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /aide niveau 1/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /aide niveau 2/i })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: /aide niveau 1/i }));
    const review = screen.getByLabelText(/correction guidée de la dictée/i);
    expect(within(review).getByText(/Emma range dragn cartable rivière/i).closest('.dictation-line-help')).toHaveClass('line-has-error');
    expect(within(review).getByText(/Puis elle avance avec calm/i).closest('.dictation-line-help')).toHaveClass('line-has-error');

    await user.click(screen.getByRole('button', { name: /aide niveau 2/i }));
    expect(within(review).getByText('dragn')).toHaveClass('dictation-word-error-highlight');
    expect(within(review).getByText('calm.')).toHaveClass('dictation-word-error-highlight');
  });

  it('congratulates a perfect generated dictation and records it only once while the child corrects the same text', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      response: 'Emma range dragon cartable rivière.',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument();
    });

    const dictationCard = screen.getByRole('heading', { name: /dictée/i }).closest('article');
    expect(dictationCard).not.toBeNull();
    await user.click(within(dictationCard!).getByRole('button', { name: /continuer/i }));
    await user.type(await screen.findByLabelText(/série de mots/i), 'dragon, cartable, rivière');
    await user.click(screen.getByRole('button', { name: /générer le texte/i }));

    expect(await screen.findByText(/Emma range dragon cartable rivière/i)).toBeInTheDocument();
    const childAnswer = screen.getByLabelText(/zone d'écriture de l'enfant/i);
    await user.type(childAnswer, 'Emma range dragon cartable rivière.');
    await user.click(screen.getByRole('button', { name: /j'ai fini/i }));

    expect(await screen.findByText(/Bravo, tu as fait tout juste !/i)).toBeInTheDocument();
    await waitFor(() => {
      const records = JSON.parse(window.localStorage.getItem('devoirs.activityRecords.v1') ?? '[]');
      expect(records).toHaveLength(1);
    });

    await user.clear(childAnswer);
    await user.type(childAnswer, 'Emma range dragn cartable rivière.');
    await user.click(screen.getByRole('button', { name: /j'ai fini/i }));
    expect(await screen.findByText(/1 faute réalisée/i)).toBeInTheDocument();

    const records = JSON.parse(window.localStorage.getItem('devoirs.activityRecords.v1') ?? '[]');
    expect(records).toHaveLength(1);
    const historyByProfile = JSON.parse(window.localStorage.getItem('devoirs.profileExerciseHistory.v1') ?? '{}');
    expect(historyByProfile['emma-demo']).toHaveLength(1);
  });

  it('aligns child dictation corrections without shifting all following words after a line break or missing word', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      response: 'Emma range dragon cartable rivière. Puis elle avance avec calme.',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument();
    });

    const dictationCard = screen.getByRole('heading', { name: /dictée/i }).closest('article');
    expect(dictationCard).not.toBeNull();
    await user.click(within(dictationCard!).getByRole('button', { name: /continuer/i }));
    await user.type(await screen.findByLabelText(/série de mots/i), 'dragon, cartable, rivière');
    await user.click(screen.getByRole('button', { name: /générer le texte/i }));

    expect(await screen.findByText(/Emma range dragon cartable rivière/i)).toBeInTheDocument();
    const childAnswer = screen.getByLabelText(/zone d'écriture de l'enfant/i);

    await user.type(childAnswer, 'Emma range dragon cartable rivière.\nPuis elle avance avec calme.');
    await user.click(screen.getByRole('button', { name: /j'ai fini/i }));
    expect(await screen.findByText(/Bravo, tu as fait tout juste !/i)).toBeInTheDocument();

    await user.clear(childAnswer);
    await user.type(childAnswer, 'Emma range cartable rivière.\nPuis elle avance avec calme.');
    await user.click(screen.getByRole('button', { name: /j'ai fini/i }));
    expect(await screen.findByText(/1 faute réalisée/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /aide niveau 1/i }));
    const review = screen.getByLabelText(/correction guidée de la dictée/i);
    expect(within(review).getByText(/Emma range cartable rivière/i).closest('.dictation-line-help')).toHaveClass('line-has-error');
    expect(within(review).getByText(/Puis elle avance avec calme/i).closest('.dictation-line-help')).not.toHaveClass('line-has-error');

    await user.click(screen.getByRole('button', { name: /aide niveau 2/i }));
    expect(within(review).getByText('∅')).toHaveClass('dictation-word-error-highlight');
  });

  it('transcribes and analyzes the oral reading automatically when browser speech recognition returns text', async () => {
    const user = userEvent.setup();
    let recognitionInstance: any = null;
    class SpeechRecognitionMock {
      lang = '';
      interimResults = false;
      continuous = false;
      onresult?: (event: unknown) => void;
      onend?: () => void;
      start = vi.fn();
      stop = vi.fn(() => this.onend?.());
      constructor() {
        recognitionInstance = this;
      }
    }
    vi.stubGlobal('webkitSpeechRecognition', SpeechRecognitionMock);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument();
    });
    const readingCard = screen.getByRole('heading', { name: /lecture/i }).closest('article');
    expect(readingCard).not.toBeNull();
    await user.click(within(readingCard!).getByRole('button', { name: /continuer/i }));

    await user.click(await screen.findByRole('button', { name: /démarrer l’enregistrement/i }));
    expect(screen.getByText(/écoute en cours/i)).toBeInTheDocument();
    expect(recognitionInstance?.start).toHaveBeenCalled();

    act(() => {
      recognitionInstance?.onresult?.({
        results: [
          [{ transcript: 'Le dragon vit dans la bibliothèque. Emma prête un livre au dragon. Il devient plus gentil.' }],
        ],
      });
    });

    expect((screen.getByLabelText(/transcription de l’enregistrement/i) as HTMLTextAreaElement).value).toContain('Le dragon vit dans la bibliothèque');
    await user.click(screen.getByRole('button', { name: /arrêter et analyser/i }));

    const analysis = await screen.findByRole('heading', { name: /analyse de l’enregistrement/i });
    expect(analysis).toBeInTheDocument();
    const analysisRegion = analysis.closest('section');
    expect(analysisRegion).not.toBeNull();
    expect(within(analysisRegion!).getAllByText(/mots par minute/i).length).toBeGreaterThan(0);
    expect(within(analysisRegion!).getByText(/erreurs détectées/i)).toBeInTheDocument();
  });

  it('accepts phonetically correct oral reading transcriptions against the source text', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      response: "Il brûle et s'en va.",
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument();
    });

    const readingCard = screen.getByRole('heading', { name: /lecture/i }).closest('article');
    expect(readingCard).not.toBeNull();
    await user.click(within(readingCard!).getByRole('button', { name: /continuer/i }));

    const generationRegion = await screen.findByRole('region', { name: /génération ia de l’histoire/i });
    await user.click(within(generationRegion).getByRole('button', { name: /^générer$/i }));
    expect(await screen.findByText(/Il brûle et s'en va/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/transcription de l’enregistrement/i), "Il brulait s'en va.");
    await user.click(screen.getByRole('button', { name: /analyser la lecture/i }));

    const analysisRegion = await screen.findByRole('region', { name: /analyse de l’enregistrement/i });
    expect(within(analysisRegion).getByRole('row', { name: /erreurs détectées\s+0/i })).toBeInTheDocument();
    expect(within(analysisRegion).getByText(/précision/i)).toBeInTheDocument();
  });

  it('builds the Lecture page around AI story generation, recording timing, transcription and statistics', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      response: 'Lina rencontre un renard dans la forêt. Elle pose une clé dorée sur un rocher et lit doucement.',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument();
    });

    const readingCard = screen.getByRole('heading', { name: /lecture/i }).closest('article');
    expect(readingCard).not.toBeNull();
    await user.click(within(readingCard!).getByRole('button', { name: /continuer/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /générer l’histoire/i })).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/personnage/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/animal/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/objet/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/lieu/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/taille du texte/i)).toBeInTheDocument();
    expect((screen.getByLabelText(/prompt de génération lecture/i) as HTMLTextAreaElement).value).toContain('{{personnage}}');

    await user.clear(screen.getByLabelText(/personnage/i));
    await user.type(screen.getByLabelText(/personnage/i), 'Lina');
    await user.clear(screen.getByLabelText(/animal/i));
    await user.type(screen.getByLabelText(/animal/i), 'renard');
    await user.clear(screen.getByLabelText(/objet/i));
    await user.type(screen.getByLabelText(/objet/i), 'clé dorée');
    await user.clear(screen.getByLabelText(/lieu/i));
    await user.type(screen.getByLabelText(/lieu/i), 'forêt');
    await user.selectOptions(screen.getByLabelText(/taille du texte/i), 'S');
    const generationRegion = screen.getByRole('region', { name: /génération ia de l’histoire/i });
    await user.click(within(generationRegion).getByRole('button', { name: /^générer$/i }));

    expect(await screen.findByText(/Lina rencontre un renard dans la forêt/i)).toBeInTheDocument();
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/ollama/generate', expect.objectContaining({ method: 'POST' }));

    await user.click(screen.getByRole('button', { name: /démarrer l’enregistrement/i }));
    expect(screen.getByText(/chrono lancé/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /arrêter et analyser/i }));

    await user.type(
      screen.getByLabelText(/transcription de l’enregistrement/i),
      'Lina rencontre un renur dans la forêt. Elle pose une clé sur un rocher et lit doucement.',
    );
    await user.click(screen.getByRole('button', { name: /analyser la lecture/i }));

    expect(screen.getByRole('heading', { name: /analyse de l’enregistrement/i })).toBeInTheDocument();
    const analysisRegion = screen.getByRole('region', { name: /analyse de l’enregistrement/i });
    expect(within(analysisRegion).getAllByText(/mots par minute/i).length).toBeGreaterThan(0);
    expect(within(analysisRegion).getByText(/temps total/i)).toBeInTheDocument();
    expect(within(analysisRegion).getAllByText(/erreurs/i).length).toBeGreaterThan(0);
    expect(within(analysisRegion).getByText('renur')).toHaveClass('reading-word-error');
    expect(within(analysisRegion).getByText('∅ dorée')).toHaveClass('reading-word-missing');
  });

  it('keeps the redesigned poetry page focused on the validated title and main work blocks', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument();
    });

    const userSwitcher = screen.getByRole('region', { name: /sélecteur utilisateur actif/i });
    expect(within(userSwitcher).getByRole('button', { name: /changer d’utilisateur actif : emma/i })).toBeInTheDocument();

    const poetryNavButton = screen.getByRole('button', { name: /^poésie$/i });
    await user.click(poetryNavButton);

    await waitFor(() => {
      expect(container.querySelector('.poetry-main-grid')).toBeInTheDocument();
    });

    expect(container.querySelector('.child-side-nav')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /sélecteur utilisateur actif/i })).toBeInTheDocument();
    expect(container.querySelector('.poetry-redesign-page')).toBeInTheDocument();
    expect(container.querySelector('.poetry-main-grid')).toBeInTheDocument();
    expect(container.querySelector('.poetry-workbench-full')).toBeInTheDocument();
    expect(container.querySelector('.poetry-recital-redesign')).toBeInTheDocument();
    expect(screen.getByLabelText(/choisir une poésie/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /texte de la poésie/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /mémoriser ligne par ligne/i })).toBeInTheDocument();
    expect(screen.queryByText(/zone de travail de l’enfant/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/clique sur/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/aucune ligne masquée en haut/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/aucune ligne masquée en bas/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tout afficher/i })).toHaveClass('poetry-profile-button');
    expect(container.querySelector('.poem-lines-header')).toContainElement(screen.getByRole('heading', { name: /mémoriser ligne par ligne/i }));
    expect(container.querySelector('.poem-line-finish')).toHaveTextContent('Fin');
    expect(screen.getByRole('slider', { name: /masquer les lignes du haut/i })).toHaveTextContent('');
    expect(screen.getByRole('slider', { name: /masquer les lignes du bas/i })).toHaveTextContent('');
    const firstPoetryLineToggle = screen.getByRole('button', { name: /^ligne 1$/i });
    expect(within(firstPoetryLineToggle).getByText('👁️')).toBeInTheDocument();
    await user.click(firstPoetryLineToggle);
    expect(within(firstPoetryLineToggle).getByText('🙈')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /réciter la poésie/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /j’ai récité ma poésie/i })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /étapes de poésie/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /quand tu es prête/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cacher des mots/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /masquer tout le texte/i })).not.toBeInTheDocument();
  });

  it('opens the poetry module from Accueil and validates a simulated recital', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument();
    });

    const poetryCard = screen.getByRole('heading', { name: /poésie/i }).closest('article');
    expect(poetryCard).not.toBeNull();

    await user.click(within(poetryCard!).getByRole('button', { name: /continuer/i }));

    await waitFor(() => {
      expect(container.querySelector('.poetry-main-grid')).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/choisir une poésie/i)).toHaveValue('la-cigale-et-la-fourmi');
    expect(screen.getByRole('textbox', { name: /texte de la poésie/i })).toHaveTextContent('La Cigale, ayant chanté');

    await user.selectOptions(screen.getByLabelText(/choisir une poésie/i), 'le-corbeau-et-le-renard');
    expect(screen.getAllByText(/le corbeau et le renard/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('textbox', { name: /texte de la poésie/i })).toHaveTextContent('Maître Corbeau');

    const importFile = new File(['Mon cartable dort\nSous la lune douce'], 'ma-poesie.txt', { type: 'text/plain' });
    await user.upload(screen.getByLabelText(/importer un fichier/i), importFile);
    await waitFor(() => {
      expect(screen.getByText(/poésie importée/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('textbox', { name: /texte de la poésie/i })).toHaveTextContent('Mon cartable dort Sous la lune douce');
    expect(screen.getByText(/fichier importé/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /j’ai récité ma poésie/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /j’ai récité ma poésie/i }));

    await waitFor(() => {
      expect(screen.getByText(/bravo, récitation validée/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/tu gagnes 6 étoiles/i)).toBeInTheDocument();
  });
});
