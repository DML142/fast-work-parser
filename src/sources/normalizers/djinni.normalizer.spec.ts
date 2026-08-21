import { normalizeDjinniJob } from './djinni.normalizer';
import { RawJob } from '../../common/interfaces/job-source.interface';

describe('normalizeDjinniJob', () => {
  it('maps a Djinni raw job to a JobEntity', () => {
    const raw: RawJob = {
      title: 'Senior React Developer',
      company: 'N-iX',
      href: 'https://djinni.co/jobs/843917-senior-react-developer/',
      logoUrl:
        'https://p.djinni.co/d0/32704adcab409c12bdab3238166b61/360x160.png',
      location: 'Україна',
      description: 'We are looking for a Senior React Developer...',
    };

    const job = normalizeDjinniJob(raw);

    expect(job.source).toBe('Djinni');
    expect(job.title).toBe('Senior React Developer');
    expect(job.company).toBe('N-iX');
    expect(job.companyLogoUrl).toBe(
      'https://p.djinni.co/d0/32704adcab409c12bdab3238166b61/360x160.png',
    );
    expect(job.description).toBe(
      'We are looking for a Senior React Developer...',
    );
    expect(job.stack).toEqual([]);
    expect(job.location).toBe('Україна');
    expect(job.remoteType).toBe('unknown');
    expect(job.contractType).toBe('unknown');
    expect(job.compensation).toBeNull();
    expect(job.sourceUrl).toBe(
      'https://djinni.co/jobs/843917-senior-react-developer/',
    );
    expect(job.postedAt).toBeNull();
    expect(job.fetchedAt).toBeInstanceOf(Date);
    expect(job.id).toMatch(/^[0-9a-f]{64}$/);
  });

  it('falls back to "Remote" when location is blank', () => {
    const raw: RawJob = {
      title: 'Backend Developer',
      company: 'Acme',
      href: 'https://djinni.co/jobs/1-backend-developer/',
      location: '',
      description: '',
    };

    expect(normalizeDjinniJob(raw).location).toBe('Remote');
  });

  it('leaves the logo null when no logoUrl was scraped', () => {
    const raw: RawJob = {
      title: 'Backend Developer',
      company: 'Acme',
      href: 'https://djinni.co/jobs/1-backend-developer/',
      location: '',
      description: '',
    };

    expect(normalizeDjinniJob(raw).companyLogoUrl).toBeNull();
  });
});
