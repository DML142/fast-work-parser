import { ContractType, JobEntity } from '../../jobs/entities/job.entity';
import { RawJob } from '../../common/interfaces/job-source.interface';
import { hashSourceUrl } from '../../common/hash-source-url';
import { readString } from '../../common/read-string';

const CONTRACT_TYPE_MAP: Record<string, ContractType> = {
  full_time: 'full-time',
  contract: 'contract',
};

export function normalizeRemotiveJob(raw: RawJob): JobEntity {
  const sourceUrl = readString(raw.url);
  const jobType = readString(raw.job_type);
  const salary = readString(raw.salary).trim();
  const location = readString(raw.candidate_required_location).trim();

  return {
    id: hashSourceUrl(sourceUrl),
    source: 'Remotive',
    title: readString(raw.title),
    company: readString(raw.company_name),
    description: readString(raw.description),
    // strip commas: TypeORM's simple-array column type splits stack on commas
    stack: Array.isArray(raw.tags)
      ? raw.tags.map((tag) => readString(tag).replace(/,/g, ''))
      : [],
    location: location !== '' ? location : 'Remote',
    remoteType: 'remote',
    contractType: CONTRACT_TYPE_MAP[jobType] ?? 'unknown',
    compensation: salary !== '' ? salary : null,
    sourceUrl,
    postedAt:
      typeof raw.publication_date === 'string'
        ? new Date(raw.publication_date)
        : null,
    fetchedAt: new Date(),
  };
}
