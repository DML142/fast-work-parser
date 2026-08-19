import { normalizeWeWorkRemotelyJob } from './weworkremotely.normalizer';
import { RawJob } from '../../common/interfaces/job-source.interface';

describe('normalizeWeWorkRemotelyJob', () => {
  it('maps a WeWorkRemotely RSS item to a JobEntity, splitting "Company: Title"', () => {
    const raw: RawJob = {
      title: 'Stripe: Staff Backend Engineer',
      link: 'https://weworkremotely.com/remote-jobs/stripe-staff-backend-engineer',
      region: 'Anywhere in the World',
      content: '<p>Build payments infrastructure.</p>',
      categories: ['Full-Stack Programming'],
      isoDate: '2026-07-22T07:03:14.000Z',
    };

    const job = normalizeWeWorkRemotelyJob(raw);

    expect(job.source).toBe('WeWorkRemotely');
    expect(job.company).toBe('Stripe');
    expect(job.title).toBe('Staff Backend Engineer');
    expect(job.description).toBe('<p>Build payments infrastructure.</p>');
    expect(job.stack).toEqual([]);
    expect(job.location).toBe('Anywhere in the World');
    expect(job.remoteType).toBe('remote');
    expect(job.contractType).toBe('unknown');
    expect(job.compensation).toBeNull();
    expect(job.sourceUrl).toBe(
      'https://weworkremotely.com/remote-jobs/stripe-staff-backend-engineer',
    );
    expect(job.postedAt).toEqual(new Date('2026-07-22T07:03:14.000Z'));
    expect(job.fetchedAt).toBeInstanceOf(Date);
    expect(job.id).toMatch(/^[0-9a-f]{64}$/);
  });

  it('falls back to the raw title when there is no "Company: Title" separator, and to "Remote" when region is blank', () => {
    const raw: RawJob = {
      title: 'Staff Backend Engineer',
      link: 'https://weworkremotely.com/remote-jobs/no-company-prefix',
      region: '',
      content: '',
      isoDate: '',
    };

    const job = normalizeWeWorkRemotelyJob(raw);

    expect(job.company).toBe('');
    expect(job.title).toBe('Staff Backend Engineer');
    expect(job.location).toBe('Remote');
    expect(job.postedAt).toBeNull();
  });
});
