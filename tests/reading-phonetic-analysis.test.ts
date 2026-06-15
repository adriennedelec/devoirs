import { describe, expect, it } from 'vitest';
import { analyzeReadingRecording } from '../src/App';

describe('reading recording phonetic analysis', () => {
  it('does not count same-sounding hyphenated names and common speech-recognition variants as errors', () => {
    const story = [
      "Anne-Marie rentrait chez elle après l'école elle avait faim mais son chat Félix était plus pressé que n'importe qui",
      "il l'attendait à la porte d'entrée les yeux brillants de curiosité Anne-Marie sourit en voyant le petit matou",
      "qu'est-ce qu'il y a Félix elle lui tendit une poignée de croquettes Félix se précipita vers elle",
      "et commença à manger les délicieuses friandises Anne-Marie s'assit sur le canapé pour attendre son tour",
    ].join(' ');
    const transcript = [
      "Anne Marie rentrez chez elle après l'école elle avait faim mais son chat Félix était plus pressé que n'importe qui",
      "il attendait à la porte d'entrée les yeux brillants de curiosité Anne Marie sourit en voyant le petit matou",
      "qu'est-ce qu'il y a Félix elle lui tendit une poignée de croquettes Félix se précipite à vers elle",
      "et commence à manger les délicieuses friandises Anne Marie s'assit sur le canapé pour attendre son tour",
    ].join(' ');

    const analysis = analyzeReadingRecording(story, transcript, 28);

    expect(analysis.errorCount, JSON.stringify(analysis.tokens.filter((token) => token.status !== 'correct'))).toBe(0);
    expect(analysis.accuracyPercent).toBe(100);
    expect(analysis.tokens.every((token) => token.status === 'correct')).toBe(true);
  });
});
