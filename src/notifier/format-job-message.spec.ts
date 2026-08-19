import { formatJobMessage } from './format-job-message';
import { buildJobEntity } from '../common/testing/job-entity.fixture';

describe('formatJobMessage', () => {
  it('formats a job with all fields present', () => {
    const job = buildJobEntity({
      source: 'RemoteOK',
      title: 'Senior Full-Stack Developer',
      company: 'Acme Inc',
      stack: ['React', 'Next.js'],
      remoteType: 'remote',
      contractType: 'contract',
      compensation: '$80000-$100000',
      sourceUrl: 'https://example.com/jobs/1',
    });

    expect(formatJobMessage(job)).toBe(
      [
        '[RemoteOK] Senior Full-Stack Developer — Acme Inc',
        'Stack: React, Next.js',
        'Remote | Contract | $80000-$100000',
        'https://example.com/jobs/1',
      ].join('\n'),
    );
  });

  it('omits the compensation segment when compensation is null', () => {
    const job = buildJobEntity({
      remoteType: 'hybrid',
      contractType: 'full-time',
      compensation: null,
    });

    expect(formatJobMessage(job)).toContain('Hybrid | Full-time\n');
    expect(formatJobMessage(job)).not.toContain('null');
  });

  it('omits the Stack line when the stack array is empty', () => {
    const job = buildJobEntity({ stack: [] });

    expect(formatJobMessage(job)).not.toContain('Stack:');
  });

  it('capitalizes remoteType and contractType', () => {
    const job = buildJobEntity({
      remoteType: 'onsite',
      contractType: 'unknown',
      compensation: null,
    });

    expect(formatJobMessage(job)).toContain('Onsite | Unknown');
  });
});
