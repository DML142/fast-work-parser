import { JobEntity } from '../../jobs/entities/job.entity';
import { RawJob } from '../../common/interfaces/job-source.interface';
import { hashSourceUrl } from '../../common/hash-source-url';
import { readString } from '../../common/read-string';

// WWR titles follow "Company: Job Title"; keep the whole string as title if there's no separator.
function splitTitle(rawTitle: string): { company: string; title: string } {
  const separatorIndex = rawTitle.indexOf(': ');
  if (separatorIndex === -1) {
    return { company: '', title: rawTitle };
  }
  return {
    company: rawTitle.slice(0, separatorIndex),
    title: rawTitle.slice(separatorIndex + 2),
  };
}

export function normalizeWeWorkRemotelyJob(raw: RawJob): JobEntity {
  const sourceUrl = readString(raw.link);
  const { company, title } = splitTitle(readString(raw.title));
  const region = readString(raw.region).trim();
  const isoDate = readString(raw.isoDate);

  return {
    id: hashSourceUrl(sourceUrl),
    source: 'WeWorkRemotely',
    title,
    company,
    // WeWorkRemotely's RSS feed doesn't include a logo URL.
    companyLogoUrl: null,
    description: readString(raw.content),
    stack: [],
    location: region !== '' ? region : 'Remote',
    remoteType: 'remote',
    contractType: 'unknown',
    compensation: null,
    sourceUrl,
    postedAt: isoDate !== '' ? new Date(isoDate) : null,
    fetchedAt: new Date(),
  };
}
