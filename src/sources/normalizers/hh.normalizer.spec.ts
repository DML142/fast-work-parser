import { normalizeHhJob } from './hh.normalizer';
import { RawJob } from '../../common/interfaces/job-source.interface';

describe('normalizeHhJob', () => {
  it('maps an hh.ru raw job to a JobEntity', () => {
    const raw: RawJob = {
      title: 'Senior Frontend Developer (React)',
      company: 'ООО Рога и Копыта',
      href: 'https://hh.ru/vacancy/136400949',
      logoUrl: 'https://img.hhcdn.ru/employer-logo-round/6647499.jpeg',
      location: 'Москва',
      description:
        'We are looking for a Senior Frontend Developer with React experience.',
      isRemote: true,
    };

    const job = normalizeHhJob(raw);

    expect(job.source).toBe('hh.ru');
    expect(job.title).toBe('Senior Frontend Developer (React)');
    expect(job.company).toBe('ООО Рога и Копыта');
    expect(job.companyLogoUrl).toBe(
      'https://img.hhcdn.ru/employer-logo-round/6647499.jpeg',
    );
    expect(job.description).toBe(
      'We are looking for a Senior Frontend Developer with React experience.',
    );
    expect(job.stack).toEqual([]);
    expect(job.location).toBe('Москва');
    expect(job.remoteType).toBe('remote');
    expect(job.contractType).toBe('unknown');
    expect(job.compensation).toBeNull();
    expect(job.sourceUrl).toBe('https://hh.ru/vacancy/136400949');
    expect(job.postedAt).toBeNull();
    expect(job.fetchedAt).toBeInstanceOf(Date);
    expect(job.id).toMatch(/^[0-9a-f]{64}$/);
  });

  it('falls back to "Remote" location and remoteType "unknown" when unset', () => {
    const raw: RawJob = {
      title: 'Backend Developer',
      company: 'Acme',
      href: 'https://hh.ru/vacancy/1',
      location: '',
      description: '',
      isRemote: false,
    };

    const job = normalizeHhJob(raw);

    expect(job.location).toBe('Remote');
    expect(job.remoteType).toBe('unknown');
    expect(job.companyLogoUrl).toBeNull();
  });
});
