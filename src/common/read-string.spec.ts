import { readString } from './read-string';

describe('readString', () => {
  it('returns the value unchanged when it is a string', () => {
    expect(readString('hello')).toBe('hello');
  });

  it('returns an empty string for non-string values', () => {
    expect(readString(undefined)).toBe('');
    expect(readString(null)).toBe('');
    expect(readString(42)).toBe('');
    expect(readString({})).toBe('');
  });
});
