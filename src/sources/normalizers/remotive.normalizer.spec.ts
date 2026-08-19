import { normalizeRemotiveJob } from './remotive.normalizer';
import { RawJob } from '../../common/interfaces/job-source.interface';

describe('normalizeRemotiveJob', () => {
  it('maps a Remotive raw job to a JobEntity', () => {
    const raw: RawJob = {
      id: 2091069,
      url: 'https://remotive.com/remote-jobs/medical/patient-care-specialist-2091069',
      title: 'Patient Care Specialist',
      company_name: 'STATLINX',
      tags: ['research', 'insurance'],
      job_type: 'full_time',
      publication_date: '2026-08-16T14:14:11',
      candidate_required_location: 'USA',
      salary: '$36k',
      description: '<p>Answering inbound calls.</p>',
    };

    const job = normalizeRemotiveJob(raw);

    expect(job.source).toBe('Remotive');
    expect(job.title).toBe('Patient Care Specialist');
    expect(job.company).toBe('STATLINX');
    expect(job.stack).toEqual(['research', 'insurance']);
    expect(job.location).toBe('USA');
    expect(job.remoteType).toBe('remote');
    expect(job.contractType).toBe('full-time');
    expect(job.compensation).toBe('$36k');
    expect(job.sourceUrl).toBe(
      'https://remotive.com/remote-jobs/medical/patient-care-specialist-2091069',
    );
    expect(job.postedAt).toEqual(new Date('2026-08-16T14:14:11Z'));
    expect(job.fetchedAt).toBeInstanceOf(Date);
    expect(job.id).toMatch(/^[0-9a-f]{64}$/);
  });

  it('maps job_type "contract" to contractType "contract", unknown job_types to "unknown", and blank salary to null', () => {
    const contractRaw: RawJob = {
      id: 1,
      url: 'https://remotive.com/remote-jobs/design/contractor-1',
      title: 'Contract Designer',
      company_name: 'Studio',
      tags: [],
      job_type: 'contract',
      publication_date: '2026-08-01T00:00:00',
      candidate_required_location: 'Worldwide',
      salary: '',
      description: '',
    };
    const freelanceRaw: RawJob = {
      ...contractRaw,
      id: 2,
      job_type: 'freelance',
      url: 'https://remotive.com/remote-jobs/design/freelancer-2',
    };

    expect(normalizeRemotiveJob(contractRaw).contractType).toBe('contract');
    expect(normalizeRemotiveJob(contractRaw).compensation).toBeNull();
    expect(normalizeRemotiveJob(freelanceRaw).contractType).toBe('unknown');
  });
});
