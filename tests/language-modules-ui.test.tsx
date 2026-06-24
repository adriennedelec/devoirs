import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App, { buildChildWordDictationReview } from '../src/App';

describe('Lot 4 dictation and poetry UI', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('classifies child dictation corrections by severity without flagging typographic apostrophes', () => {
    const review = buildChildWordDictationReview(
      'Je cours jusqu’à la forêt. Puis, je dors paisiblement.',
      "Je cours jusqu'à la foret Puis je dors paisi blement.",
    );

    expect(review.mistakeCount).toBe(4);
    expect(review.lines[0].words.find((word) => word.actual === "jusqu'à")?.hasError).toBe(false);
    expect(review.lines[0].words.find((word) => word.actual === 'foret')?.severity).toBe('accent');
    expect(review.lines[0].words.find((word) => word.actual === 'Puis')?.severity).toBe('punctuation');
    expect(review.lines[0].words.find((word) => word.actual === 'paisi')?.severity).toBe('orthography');
    expect(review.lines[0]).toMatchObject({ hasError: true, severity: 'orthography' });
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
    const generatorRegion = screen.getByRole('region', { name: /génération ia de l’histoire/i });
    expect(generatorRegion).toHaveTextContent(/générer l’histoire/i);
    expect(generatorRegion).not.toHaveTextContent(/bloc 1/i);
    expect(generatorRegion).not.toHaveTextContent(/préparation ia/i);
    expect(screen.queryByText(/bloc 2/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/définir le prompt/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/prompt de génération lecture/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/aperçu réel envoyé à l’ia/i)).not.toBeInTheDocument();
    expect(within(generatorRegion).getByRole('button', { name: /^générer$/i })).toHaveClass('poetry-profile-button');
    const characterSelect = within(generatorRegion).getByLabelText(/choisir un personnage/i) as HTMLSelectElement;
    const animalSelect = within(generatorRegion).getByLabelText(/choisir un animal/i) as HTMLSelectElement;
    const objectSelect = within(generatorRegion).getByLabelText(/choisir un objet/i) as HTMLSelectElement;
    const placeSelect = within(generatorRegion).getByLabelText(/choisir un lieu/i) as HTMLSelectElement;
    expect(within(generatorRegion).getByText('Personnage')).toHaveClass('reading-field-title');
    expect(within(generatorRegion).getByText('Animal')).toHaveClass('reading-field-title');
    expect(within(generatorRegion).getByText('Objet')).toHaveClass('reading-field-title');
    expect(within(generatorRegion).getByText('Lieu')).toHaveClass('reading-field-title');
    expect(within(generatorRegion).getByText('Taille du texte')).toHaveClass('reading-field-title');
    expect(characterSelect.options.length).toBe(10);
    expect(animalSelect.options.length).toBe(10);
    expect(objectSelect.options.length).toBe(10);
    expect(placeSelect.options.length).toBe(10);
    expect(within(generatorRegion).getByText('Lina')).toHaveClass('reading-selected-choice');
    await user.selectOptions(characterSelect, 'Noé');
    expect(within(generatorRegion).getByText('Noé')).toHaveClass('reading-selected-choice');
    expect(characterSelect).toBeDisabled();
    await user.click(within(generatorRegion).getByRole('button', { name: /supprimer noé/i }));
    expect([...generatorRegion.querySelectorAll('.reading-selected-choice')].map((chip) => chip.textContent)).not.toContain('Noé×');
    expect(characterSelect).not.toBeDisabled();
    await user.selectOptions(objectSelect, 'skateboard volant');
    expect(within(generatorRegion).getByText('skateboard volant')).toBeInTheDocument();
    await user.selectOptions(placeSelect, 'station lunaire');
    expect(within(generatorRegion).getByText('station lunaire')).toBeInTheDocument();
    expect(sizeSelect).toHaveTextContent('XS · 60 à 90 mots');
    expect(sizeSelect).toHaveTextContent('S · 90 à 150 mots');
    expect(sizeSelect).toHaveTextContent('M · 150 à 250 mots');
    expect(sizeSelect).toHaveTextContent('L · 300 à 500 mots');
    expect(sizeSelect).toHaveTextContent('XL · 600 à 800 mots');
    expect(sizeSelect).toHaveTextContent('XXL · 1200 à 1800 mots');
  });

  it('keeps Dictée magique focused on direct word entry without mode cards or prompt blocks', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument();
    });

    const dictationCard = screen.getByRole('heading', { name: /dictée/i }).closest('article');
    expect(dictationCard).not.toBeNull();
    await user.click(within(dictationCard!).getByRole('button', { name: /continuer/i }));

    expect(screen.getByRole('heading', { name: /^dictée$/i })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /choix du type de dictée/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /dictée de mots/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /dictée normale/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/préparation parent/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^dictée de mots$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/tape les mots à travailler/i)).not.toBeInTheDocument();
    const wordEntry = await screen.findByLabelText(/saisis tes mots \(séparateurs virgule\)/i);
    const preparationRegion = screen.getByRole('region', { name: /préparation de la dictée magique/i });
    const entryHeading = preparationRegion.querySelector('.dictation-entry-heading');
    const fieldCards = [...preparationRegion.querySelectorAll('.dictation-entry-card')];
    const actionButtons = [...preparationRegion.querySelectorAll('.word-source-actions .poetry-icon-button')];
    const tenseFieldset = screen.getByRole('group', { name: /temps des verbes/i });
    const tenseHeader = preparationRegion.querySelector('.verb-tense-header');
    expect(wordEntry).toBeInTheDocument();
    expect(fieldCards).toHaveLength(2);
    expect(fieldCards[0]).toHaveTextContent(/nom, adjectifs/i);
    expect(fieldCards[1]).toHaveTextContent(/verbes/i);
    expect(entryHeading).toHaveTextContent(/saisis tes mots.*séparateur virgule/i);
    expect(entryHeading!.compareDocumentPosition(fieldCards[0])).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(actionButtons).toHaveLength(2);
    expect(actionButtons[0]).toHaveAttribute('title', 'Importer un fichier');
    expect(actionButtons[1]).toHaveAttribute('title', 'Prendre une photo');
    expect(tenseFieldset).toHaveTextContent(/temps des verbes/i);
    expect(tenseHeader).toHaveTextContent(/sélection multiple possible/i);
    expect(screen.queryByLabelText(/série de mots/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/moteur de génération openai/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/template du prompt llama/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/aperçu réel envoyé à/i)).not.toBeInTheDocument();
  });

  it('can automatically fill word and verb frames from count controls on the card headers', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument();
    });

    const dictationCard = screen.getByRole('heading', { name: /dictée/i }).closest('article');
    expect(dictationCard).not.toBeNull();
    await user.click(within(dictationCard!).getByRole('button', { name: /continuer/i }));

    const wordEntry = await screen.findByLabelText(/saisis tes mots \(séparateurs virgule\)/i) as HTMLTextAreaElement;
    const verbEntry = screen.getByLabelText(/saisis tes verbes \(séparateurs virgule\)/i) as HTMLTextAreaElement;
    const wordGenerator = screen.getByRole('group', { name: /générer automatiquement des noms, adjectifs et adverbes/i });
    const verbGenerator = screen.getByRole('group', { name: /générer automatiquement des verbes/i });

    expect(wordGenerator.compareDocumentPosition(wordEntry)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(verbGenerator.compareDocumentPosition(verbEntry)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    const wordGenerateButton = within(wordGenerator).getByRole('button', { name: /générer/i });
    const wordCountInput = within(wordGenerator).getByLabelText(/nombre de mots à générer/i);
    const verbGenerateButton = within(verbGenerator).getByRole('button', { name: /générer/i });
    const verbCountInput = within(verbGenerator).getByLabelText(/nombre de verbes à générer/i);
    const increaseWordCount = within(wordGenerator).getByRole('button', { name: /augmenter le nombre de mots/i });
    const decreaseWordCount = within(wordGenerator).getByRole('button', { name: /diminuer le nombre de mots/i });
    const increaseVerbCount = within(verbGenerator).getByRole('button', { name: /augmenter le nombre de verbes/i });
    const decreaseVerbCount = within(verbGenerator).getByRole('button', { name: /diminuer le nombre de verbes/i });

    expect(wordCountInput).toHaveValue(8);
    expect(verbCountInput).toHaveValue(5);
    expect(wordGenerateButton.compareDocumentPosition(wordCountInput)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(verbGenerateButton.compareDocumentPosition(verbCountInput)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(within(wordGenerator).getByText('mots')).toBeInTheDocument();
    expect(within(verbGenerator).getByText('verbes')).toBeInTheDocument();
    expect(screen.queryByLabelText(/ajouter un mot à la liste/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/choisir dans la réserve/i)).not.toBeInTheDocument();

    const verbTenseFieldset = screen.getByRole('group', { name: /temps des verbes/i });
    const verbTenseLegend = within(verbTenseFieldset).getByText('Temps des verbes');
    expect(verbTenseLegend).toHaveClass('verb-tense-title');

    const textLengthFieldset = screen.getByRole('group', { name: /longueur du texte/i });
    expect(within(textLengthFieldset).getByRole('radio', { name: /S · 35-55 mots/i })).toBeInTheDocument();
    expect(within(textLengthFieldset).getByRole('radio', { name: /M · 55-85 mots/i })).toBeChecked();
    expect(within(textLengthFieldset).getByRole('radio', { name: /L · 85-120 mots/i })).toBeInTheDocument();
    expect(within(textLengthFieldset).getByRole('radio', { name: /XL · 120-180 mots/i })).toBeInTheDocument();

    await user.click(within(textLengthFieldset).getByRole('radio', { name: /XL · 120-180 mots/i }));
    expect(within(textLengthFieldset).getByRole('radio', { name: /XL · 120-180 mots/i })).toBeChecked();

    await user.click(increaseWordCount);
    expect(wordCountInput).toHaveValue(9);
    await user.click(decreaseWordCount);
    expect(wordCountInput).toHaveValue(8);

    await user.click(increaseVerbCount);
    expect(verbCountInput).toHaveValue(6);
    await user.click(decreaseVerbCount);
    expect(verbCountInput).toHaveValue(5);

    fireEvent.change(wordCountInput, { target: { value: '' } });
    expect((wordCountInput as HTMLInputElement).value).toBe('');
    fireEvent.blur(wordCountInput);
    expect(wordCountInput).toHaveValue(1);

    fireEvent.change(verbCountInput, { target: { value: '' } });
    expect((verbCountInput as HTMLInputElement).value).toBe('');
    fireEvent.blur(verbCountInput);
    expect(verbCountInput).toHaveValue(1);

    fireEvent.change(wordCountInput, { target: { value: '9' } });
    await user.click(increaseWordCount);
    await user.click(within(wordGenerator).getByRole('button', { name: /générer/i }));
    const generatedWords = wordEntry.value.split(',').map((word) => word.trim()).filter(Boolean);
    expect(generatedWords).toHaveLength(10);
    expect(generatedWords.slice(0, 6)).toEqual(['dragon', 'cartable', 'baignoire', 'rivière', 'forêt', 'montagne']);
    expect(generatedWords.slice(6, 9)).toEqual(['magique', 'joli', 'grand']);
    expect(generatedWords.slice(9)).toEqual(['doucement']);

    fireEvent.change(verbCountInput, { target: { value: '4' } });
    await user.click(within(verbGenerator).getByRole('button', { name: /générer/i }));
    expect(verbEntry.value.split(',').map((word) => word.trim()).filter(Boolean)).toHaveLength(4);
    expect(verbEntry.value).toContain('manger');
    expect(verbEntry.value).toContain('dormir');
  });

  it('keeps the dictation prompt editable from Paramétrage instead of the dictation page', async () => {
    const user = userEvent.setup();
    const customPrompt = 'PROMPT PARAMETRAGE {{mots}} {{verbes}} {{temps}} {{longueur}}';
    render(<App />);

    await user.click(await screen.findByRole('button', { name: /paramétrage/i }));

    const settingsPromptEditor = await screen.findByLabelText(/template du prompt de dictée magique/i);
    expect((settingsPromptEditor as HTMLTextAreaElement).value).toContain('{{mots}}');
    expect((settingsPromptEditor as HTMLTextAreaElement).value).toContain('{{longueur}}');
    expect(screen.getAllByText(/\{\{longueur\}\}/i).length).toBeGreaterThan(0);
    fireEvent.change(settingsPromptEditor, { target: { value: customPrompt } });

    expect(screen.getByText(/nouveau prompt enregistré/i)).toBeInTheDocument();
    expect(window.localStorage.getItem('devoirs.wordDictation.llamaPrompt')).toBe(customPrompt);

    await user.click(screen.getByRole('button', { name: /^dictée$/i }));
    expect(await screen.findByLabelText(/saisis tes mots \(séparateurs virgule\)/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/template du prompt de dictée magique/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/aperçu réel envoyé à/i)).not.toBeInTheDocument();
  });

  it('removes the classic dictation preparation flow from Dictée magique', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument();
    });

    const dictationCard = screen.getByRole('heading', { name: /dictée/i }).closest('article');
    expect(dictationCard).not.toBeNull();
    await user.click(within(dictationCard!).getByRole('button', { name: /continuer/i }));

    expect(await screen.findByLabelText(/saisis tes mots \(séparateurs virgule\)/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /dictée normale/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /écouter la phrase/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /dictée de la forêt magique/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/ta phrase/i)).not.toBeInTheDocument();
  });

  it('opens the dictation module from Accueil and shows the OpenAI text before parent controls without regenerating automatically', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument();
    });

    const dictationCard = screen.getByRole('heading', { name: /dictée/i }).closest('article');
    expect(dictationCard).not.toBeNull();

    await user.click(within(dictationCard!).getByRole('button', { name: /continuer/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/saisis tes mots/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: /^dictée$/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /dictée de mots/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /dictée normale/i })).not.toBeInTheDocument();
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

    await user.type(screen.getByLabelText(/saisis tes mots/i), 'dragon, cartable, rivière');
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
      expect(screen.getByLabelText(/saisis tes mots/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/saisis tes mots/i), 'dragon cartable/rivière. dragonnn');
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
    const includedWords = screen.getByLabelText(/mots inclus/i);
    expect(within(includedWords).getByText('dragon')).toBeInTheDocument();
    expect(within(includedWords).getByText('cartable')).toBeInTheDocument();
    expect(within(includedWords).getByText('rivière')).toBeInTheDocument();
  });

  it('shows an animated waiting label while the default OpenAI generation is running', async () => {
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
      expect(screen.getByLabelText(/saisis tes mots/i)).toBeInTheDocument();
    });
    expect(screen.queryByRole('radio', { name: /local secours/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: /ia locale ollama/i })).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(/saisis tes mots/i), 'dragon cartable rivière');
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
      expect(screen.getByLabelText(/saisis tes mots/i)).toBeInTheDocument();
    });
    expect(document.querySelector('.dictation-app-layout .child-app-shell')).toBeInTheDocument();
    expect(screen.getByLabelText(/importer un fichier/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/prendre une photo/i)).toHaveAttribute('capture', 'environment');

    const file = new File(['Dragon\ncartable\nrivière'], 'liste-mots.txt', { type: 'text/plain' });
    await user.upload(screen.getByLabelText(/importer un fichier/i), file);

    await waitFor(() => {
      expect(screen.getByText(/3 mots détectés par OCR/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/saisis tes mots/i)).toHaveValue('dragon, cartable, rivière');
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
      expect(screen.getByLabelText(/saisis tes mots/i)).toBeInTheDocument();
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
    await user.type(await screen.findByLabelText(/saisis tes mots/i), 'dragon, cartable, rivière');
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
    await user.type(await screen.findByLabelText(/saisis tes mots/i), 'dragon, cartable, rivière');
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
    await user.type(await screen.findByLabelText(/saisis tes mots/i), 'dragon, cartable, rivière');
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
    await user.type(await screen.findByLabelText(/saisis tes mots/i), 'dragon, cartable, rivière');
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
    await user.click(screen.getByRole('button', { name: /^arrêter$/i }));
    await user.click(screen.getByRole('button', { name: /analyser la lecture/i }));

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

    const generationRegion = screen.getByRole('region', { name: /génération ia de l’histoire/i });
    expect(within(generationRegion).getByLabelText(/choisir un personnage/i)).toBeInTheDocument();
    expect(within(generationRegion).getByLabelText(/choisir un animal/i)).toBeInTheDocument();
    expect(within(generationRegion).getByLabelText(/choisir un objet/i)).toBeInTheDocument();
    expect(within(generationRegion).getByLabelText(/choisir un lieu/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/taille du texte/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/prompt de génération lecture/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/bloc 3/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/lis l'histoire/i)).not.toBeInTheDocument();

    const storyRegion = screen.getByRole('region', { name: /ton histoire/i });
    expect(within(storyRegion).getByRole('heading', { name: /^ton histoire$/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /le dragon qui aimait les livres/i })).not.toBeInTheDocument();
    const storyTitle = within(storyRegion).getByText(/le dragon qui aimait les livres/i);
    expect(storyTitle.closest('.reading-story-title')).not.toBeNull();
    expect(storyTitle.tagName.toLowerCase()).toBe('strong');
    expect(screen.getByRole('button', { name: /écouter l’histoire/i })).toHaveClass('poetry-profile-button');
    expect(screen.getByRole('button', { name: /démarrer l’enregistrement/i })).toHaveClass('poetry-profile-button');
    expect(screen.getByRole('button', { name: /^arrêter$/i })).toHaveClass('poetry-profile-button');
    expect(screen.getByRole('button', { name: /analyser la lecture/i })).toHaveClass('poetry-profile-button');

    await user.selectOptions(screen.getByLabelText(/taille du texte/i), 'S');
    await user.click(within(generationRegion).getByRole('button', { name: /^générer$/i }));

    expect(await screen.findByText(/Lina rencontre un renard dans la forêt/i)).toBeInTheDocument();
    expect(within(storyRegion).getByText(/histoire générée par ia/i).closest('.reading-story-title')).not.toBeNull();
    expect(screen.getByRole('heading', { name: /quel personnage suit-on dans cette histoire/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Lina$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /quel animal apparaît dans cette histoire/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^renard$/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /où vit le dragon/i })).not.toBeInTheDocument();
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/openai/generate', expect.objectContaining({ method: 'POST' }));

    await user.click(screen.getByRole('button', { name: /démarrer l’enregistrement/i }));
    expect(screen.getByText(/reconnaissance vocale indisponible|écoute en cours/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^arrêter$/i }));

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
    window.localStorage.setItem('devoirs.activityRecords.v1', JSON.stringify([
      { id: 'poetry-history-1', profileId: 'emma-demo', profileName: 'Emma', module: 'poetry', moduleLabel: 'Poésie', exerciseLabel: 'Le Corbeau et le Renard', startedAtIso: '2026-06-18T10:00:00.000Z', completedAtIso: '2026-06-18T10:05:00.000Z', durationSeconds: 300, status: 'completed', score: 1, totalQuestions: 1, correctCount: 1, wrongCount: 0, starsEarned: 6, details: {} },
      { id: 'poetry-history-2', profileId: 'emma-demo', profileName: 'Emma', module: 'poetry', moduleLabel: 'Poésie', exerciseLabel: 'La Cigale et la Fourmi', startedAtIso: '2026-06-17T10:00:00.000Z', completedAtIso: '2026-06-17T10:05:00.000Z', durationSeconds: 300, status: 'completed', score: 1, totalQuestions: 1, correctCount: 1, wrongCount: 0, starsEarned: 6, details: {} },
    ]));
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
    expect(screen.getByRole('heading', { name: /choisir une poésie/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /le corbeau et le renard/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/choisir une poésie/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/importer un fichier/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/prendre une photo/i)).toBeInTheDocument();
    expect(container.querySelector('label[for="poetry-file-import"]')).toHaveAttribute('title', 'Importer un fichier');
    expect(container.querySelector('label[for="poetry-photo-import"]')).toHaveAttribute('title', 'Prendre une photo');
    expect(screen.getByRole('button', { name: /ouvrir le menu de toutes les poésies/i })).toHaveAttribute('title', 'Ouvrir le menu de toutes les poésies');
    expect([...container.querySelectorAll('.poetry-recent-poem span')].map((node) => node.textContent)).toEqual([
      'La Cigale et la Fourmi',
      'Le Corbeau et le Renard',
      'Le Loup et l’Agneau',
      'Le Lièvre et la Tortue',
      'La Grenouille qui veut se faire aussi grosse que le Bœuf',
    ]);
    await user.click(screen.getByRole('button', { name: /ouvrir le menu de toutes les poésies/i }));
    const poetryLibraryDialog = screen.getByRole('dialog', { name: /aperçu de la poésie/i });
    const dialogListBlock = poetryLibraryDialog.querySelector('.poetry-library-dialog-list');
    const dialogTextBlock = poetryLibraryDialog.querySelector('.poetry-library-dialog-text');
    expect(dialogListBlock).not.toBeNull();
    expect(dialogTextBlock).not.toBeNull();
    expect(dialogListBlock!.compareDocumentPosition(dialogTextBlock!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(poetryLibraryDialog).getByText(/la cigale, ayant chanté/i)).toBeInTheDocument();
    await user.click(within(poetryLibraryDialog).getByRole('button', { name: /la grenouille qui veut se faire aussi grosse/i }));
    expect(within(poetryLibraryDialog).getByText(/une grenouille vit un bœuf/i)).toBeInTheDocument();
    expect(within(poetryLibraryDialog).getByRole('button', { name: /annuler/i })).toBeInTheDocument();
    expect(within(poetryLibraryDialog).getByRole('button', { name: /importer/i })).toBeInTheDocument();
    await user.click(within(poetryLibraryDialog).getByRole('button', { name: /importer/i }));
    expect([...container.querySelectorAll('.poetry-recent-poem span')].map((node) => node.textContent)).toEqual([
      'La Cigale et la Fourmi',
      'Le Corbeau et le Renard',
      'Le Loup et l’Agneau',
      'Le Lièvre et la Tortue',
      'La Grenouille qui veut se faire aussi grosse que le Bœuf',
    ]);
    expect(screen.queryByText(/fable chargée/i)).not.toBeInTheDocument();
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
    await user.click(firstPoetryLineToggle);
    expect(within(firstPoetryLineToggle).getByText('👁️')).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('slider', { name: /masquer les lignes du haut/i }), { key: 'ArrowDown' });
    expect(within(firstPoetryLineToggle).getByText('🙈')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /réciter la poésie/i })).toBeInTheDocument();
    expect(screen.queryByText(/bloc récitation/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/masque le texte/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/chronomètre de récitation/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /j’ai récité ma poésie/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /démarrer l’enregistrement/i })).toHaveClass('poetry-recital-button');
    expect(screen.getByRole('button', { name: /^arrêter$/i })).toHaveClass('poetry-recital-button');
    expect(screen.getByRole('button', { name: /^arrêter$/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /analyser la récitation/i })).toHaveClass('poetry-recital-button');
    await user.click(screen.getByRole('button', { name: /démarrer l’enregistrement/i }));
    expect(screen.getByRole('button', { name: /enregistrement démarré/i })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: /^arrêter$/i }));
    expect(screen.getByRole('button', { name: /redémarrer/i })).toBeEnabled();
    await user.type(screen.getByLabelText(/transcription de la récitation/i), 'Une grenouille vit un bœuf qui lui sembla de belle taille.');
    await user.click(screen.getByRole('button', { name: /analyser la récitation/i }));
    const recitalAnalysisHeading = screen.getByRole('heading', { name: /analyse de la récitation/i });
    expect(recitalAnalysisHeading).toBeInTheDocument();
    const recitalAnalysisSection = recitalAnalysisHeading.closest('section');
    expect(recitalAnalysisSection).not.toBeNull();
    expect(recitalAnalysisSection).toHaveClass('poetry-recital-analysis-card');
    expect(within(recitalAnalysisSection!).getByLabelText(/indicateurs de récitation/i)).toHaveTextContent(/erreur/i);
    expect(within(recitalAnalysisSection!).getByLabelText(/indicateurs de récitation/i)).toHaveTextContent(/précision/i);
    expect(within(recitalAnalysisSection!).queryByText(/mots par minute/i)).not.toBeInTheDocument();
    expect(within(recitalAnalysisSection!).queryByText(/temps total/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/résultat récitation/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('table', { name: /tableau de statistiques de récitation/i })).not.toBeInTheDocument();
    expect([...container.querySelectorAll('.poetry-recent-poem span')].map((node) => node.textContent)[0]).toBe('La Grenouille qui veut se faire aussi grosse que le Bœuf');
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
    expect(screen.getByRole('heading', { name: /choisir une poésie/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /la cigale et la fourmi/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /le corbeau et le renard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /le loup et l’agneau/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /texte de la poésie/i })).toHaveTextContent('La Cigale, ayant chanté');

    await user.click(screen.getByRole('button', { name: /ouvrir le menu de toutes les poésies/i }));
    const poetryLibraryDialog = screen.getByRole('dialog', { name: /aperçu de la poésie/i });
    await user.click(within(poetryLibraryDialog).getByRole('button', { name: /le corbeau et le renard/i }));
    expect(screen.getByRole('textbox', { name: /texte de la poésie/i })).toHaveTextContent('La Cigale, ayant chanté');
    await user.click(within(poetryLibraryDialog).getByRole('button', { name: /importer/i }));
    expect(screen.getAllByText(/le corbeau et le renard/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('textbox', { name: /texte de la poésie/i })).toHaveTextContent('Maître Corbeau');
    expect(screen.queryByText(/fable chargée/i)).not.toBeInTheDocument();

    const importFile = new File(['Mon cartable dort\nSous la lune douce'], 'ma-poesie.txt', { type: 'text/plain' });
    await user.upload(screen.getByLabelText(/importer un fichier/i), importFile);
    await waitFor(() => {
      expect(screen.getAllByText(/poésie importée/i).length).toBeGreaterThan(0);
    });
    expect(screen.getByRole('textbox', { name: /texte de la poésie/i })).toHaveTextContent('Mon cartable dort Sous la lune douce');
    expect([...container.querySelectorAll('.poetry-recent-poem span')].map((node) => node.textContent)).toEqual([
      'Poésie importée',
      'La Cigale et la Fourmi',
      'Le Corbeau et le Renard',
      'Le Loup et l’Agneau',
      'Le Lièvre et la Tortue',
    ]);
    expect(screen.getByText(/fichier importé/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /j’ai récité ma poésie/i })).not.toBeInTheDocument();
    await user.type(screen.getByLabelText(/transcription de la récitation/i), 'Mon cartable dor sou la lune douce');
    await user.click(screen.getByRole('button', { name: /analyser la récitation/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /analyse de la récitation/i })).toBeInTheDocument();
    });
    const importedAnalysisTags = screen.getByLabelText(/indicateurs de récitation/i);
    expect(importedAnalysisTags).toHaveTextContent(/0 erreur/i);
    expect(importedAnalysisTags).toHaveTextContent(/100% précision/i);
  });
});
