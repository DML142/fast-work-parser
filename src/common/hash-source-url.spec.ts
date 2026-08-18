import { hashSourceUrl } from './hash-source-url';

describe('hashSourceUrl', () => {
  it('returns the same hash for the same URL', () => {
    const url = 'https://remoteok.com/remote-jobs/example-123';

    expect(hashSourceUrl(url)).toBe(hashSourceUrl(url));
  });

  it('returns different hashes for different URLs', () => {
    const a = hashSourceUrl('https://remoteok.com/remote-jobs/a');
    const b = hashSourceUrl('https://remoteok.com/remote-jobs/b');

    expect(a).not.toBe(b);
  });

  it('returns a 64-character lowercase hex string (sha256 digest)', () => {
    const hash = hashSourceUrl('https://remoteok.com/remote-jobs/example-123');

    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});
