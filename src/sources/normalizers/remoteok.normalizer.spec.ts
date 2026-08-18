import { normalizeRemoteOkJob } from './remoteok.normalizer';
import { RawJob } from '../../common/interfaces/job-source.interface';

describe('normalizeRemoteOkJob', () => {
  it('maps a RemoteOK raw job to a JobEntity', () => {
    const raw: RawJob = {
      id: '1136926',
      company: 'Adani Airport Holdings Ltd',
      position: 'Fire Fighter',
      tags: ['infosec', 'education'],
      description: '<strong>About Business</strong>',
      location: 'Mangaluru, ',
      url: 'https://remoteok.com/remote-jobs/remote-fire-fighter-adani-airport-holdings-ltd-1136926',
      date: '2026-08-17T17:14:35+00:00',
      salary_min: 150000,
      salary_max: 185000,
    };

    const job = normalizeRemoteOkJob(raw);

    expect(job.source).toBe('RemoteOK');
    expect(job.title).toBe('Fire Fighter');
    expect(job.company).toBe('Adani Airport Holdings Ltd');
    expect(job.stack).toEqual(['infosec', 'education']);
    expect(job.location).toBe('Mangaluru,');
    expect(job.remoteType).toBe('remote');
    expect(job.contractType).toBe('unknown');
    expect(job.compensation).toBe('$150000-$185000');
    expect(job.sourceUrl).toBe(
      'https://remoteok.com/remote-jobs/remote-fire-fighter-adani-airport-holdings-ltd-1136926',
    );
    expect(job.postedAt).toEqual(new Date('2026-08-17T17:14:35+00:00'));
    expect(job.fetchedAt).toBeInstanceOf(Date);
    expect(job.id).toMatch(/^[0-9a-f]{64}$/);
  });

  it('defaults compensation to null, location to Remote, and strips commas from tags', () => {
    const raw: RawJob = {
      id: '999',
      company: 'Acme',
      position: 'Engineer',
      tags: ['Node.js, Express', 'React'],
      description: '',
      url: 'https://remoteok.com/remote-jobs/engineer-999',
      date: '2026-08-01T00:00:00+00:00',
      salary_min: 0,
      salary_max: 0,
      location: '',
    };

    const job = normalizeRemoteOkJob(raw);

    expect(job.compensation).toBeNull();
    expect(job.location).toBe('Remote');
    expect(job.stack).toEqual(['Node.js Express', 'React']);
  });
});
