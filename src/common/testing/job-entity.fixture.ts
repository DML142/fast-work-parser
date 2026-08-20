import { JobEntity } from '../../jobs/entities/job.entity';

export function buildJobEntity(overrides: Partial<JobEntity> = {}): JobEntity {
  const job = new JobEntity();
  job.id = 'fixture-id';
  job.source = 'FixtureSource';
  job.title = 'Senior Full-Stack Developer';
  job.company = 'Acme Inc';
  job.companyLogoUrl = null;
  job.description = 'We are looking for a React and NestJS developer.';
  job.stack = ['React', 'NestJS'];
  job.location = 'Remote';
  job.remoteType = 'remote';
  job.contractType = 'full-time';
  job.compensation = '$80000-$100000';
  job.sourceUrl = 'https://example.com/jobs/1';
  job.postedAt = new Date('2026-08-01T00:00:00.000Z');
  job.fetchedAt = new Date('2026-08-19T00:00:00.000Z');
  return Object.assign(job, overrides);
}
