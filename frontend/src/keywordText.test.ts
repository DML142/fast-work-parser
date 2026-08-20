import { describe, expect, it } from 'vitest';
import { keywordsToText, textToKeywords } from './keywordText';

describe('keywordsToText', () => {
  it('joins keywords with newlines', () => {
    expect(keywordsToText(['node', 'typescript'])).toBe('node\ntypescript');
  });

  it('returns an empty string for an empty list', () => {
    expect(keywordsToText([])).toBe('');
  });
});

describe('textToKeywords', () => {
  it('splits on newlines', () => {
    expect(textToKeywords('node\ntypescript')).toEqual(['node', 'typescript']);
  });

  it('trims whitespace from each line', () => {
    expect(textToKeywords('  node  \n typescript ')).toEqual([
      'node',
      'typescript',
    ]);
  });

  it('drops blank lines', () => {
    expect(textToKeywords('node\n\n\ntypescript\n')).toEqual([
      'node',
      'typescript',
    ]);
  });

  it('returns an empty array for blank input', () => {
    expect(textToKeywords('   \n  \n')).toEqual([]);
  });
});
