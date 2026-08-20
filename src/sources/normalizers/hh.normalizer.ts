import { JobEntity } from '../../jobs/entities/job.entity';
import { RawJob } from '../../common/interfaces/job-source.interface';
import { hashSourceUrl } from '../../common/hash-source-url';
import { readString } from '../../common/read-string';

export function normalizeHhJob(raw: RawJob): JobEntity {
  const sourceUrl = readString(raw.href);
  const location = readString(raw.location).trim();

  return {
    id: hashSourceUrl(sourceUrl),
    source: 'hh.ru',
    title: readString(raw.title),
    company: readString(raw.company),
    // hh.ru's listing page doesn't expose a logo URL.
    companyLogoUrl: null,
    description: readString(raw.description),
    stack: [],
    location: location !== '' ? location : 'Remote',
    remoteType: raw.isRemote === true ? 'remote' : 'unknown',
    contractType: 'unknown',
    compensation: null,
    sourceUrl,
    postedAt: null,
    fetchedAt: new Date(),
  };
}
