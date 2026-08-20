import { JobEntity } from '../../jobs/entities/job.entity';
import { RawJob } from '../../common/interfaces/job-source.interface';
import { hashSourceUrl } from '../../common/hash-source-url';
import { readString } from '../../common/read-string';

export function normalizeDjinniJob(raw: RawJob): JobEntity {
  const sourceUrl = readString(raw.href);
  const location = readString(raw.location).trim();

  return {
    id: hashSourceUrl(sourceUrl),
    source: 'Djinni',
    title: readString(raw.title),
    company: readString(raw.company),
    // Djinni's listing page doesn't expose a logo URL.
    companyLogoUrl: null,
    description: readString(raw.description),
    stack: [],
    location: location !== '' ? location : 'Remote',
    // Djinni's listing page doesn't expose a remote/hybrid/onsite signal.
    remoteType: 'unknown',
    contractType: 'unknown',
    compensation: null,
    sourceUrl,
    postedAt: null,
    fetchedAt: new Date(),
  };
}
