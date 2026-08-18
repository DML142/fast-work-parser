import { JobEntity } from '../../jobs/entities/job.entity';
import { RawJob } from '../../common/interfaces/job-source.interface';
import { hashSourceUrl } from '../../common/hash-source-url';
import { readString } from '../../common/read-string';

export function normalizeRemoteOkJob(raw: RawJob): JobEntity {
  const sourceUrl = readString(raw.url);
  const salaryMin = typeof raw.salary_min === 'number' ? raw.salary_min : 0;
  const salaryMax = typeof raw.salary_max === 'number' ? raw.salary_max : 0;
  const location = typeof raw.location === 'string' ? raw.location.trim() : '';

  return {
    id: hashSourceUrl(sourceUrl),
    source: 'RemoteOK',
    title: readString(raw.position),
    company: readString(raw.company),
    description: readString(raw.description),
    // strip commas: TypeORM's simple-array column type splits stack on commas
    stack: Array.isArray(raw.tags)
      ? raw.tags.map((tag) => String(tag).replace(/,/g, ''))
      : [],
    location: location !== '' ? location : 'Remote',
    remoteType: 'remote',
    contractType: 'unknown',
    compensation:
      salaryMin > 0 || salaryMax > 0 ? `$${salaryMin}-$${salaryMax}` : null,
    sourceUrl,
    postedAt: typeof raw.date === 'string' ? new Date(raw.date) : null,
    fetchedAt: new Date(),
  };
}
