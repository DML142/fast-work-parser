import type { Job } from '../types';
import './JobCard.css';

function initials(company: string): string {
  const parts = company.trim().split(/\s+/).filter(Boolean);
  const letters = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '');
  return letters.join('') || '?';
}

function levelLabel(level: Job['level']): string {
  switch (level) {
    case 'junior':
      return 'Junior';
    case 'middle':
      return 'Middle';
    case 'senior':
      return 'Senior';
    case 'lead':
      return 'Lead';
    default:
      return '';
  }
}

function remoteTypeLabel(remoteType: Job['remoteType']): string {
  switch (remoteType) {
    case 'remote':
      return 'Remote';
    case 'hybrid':
      return 'Hybrid';
    case 'onsite':
      return 'On-site';
    default:
      return 'Unknown';
  }
}

const WARN_REMOTE_TYPES = new Set<Job['remoteType']>(['hybrid', 'onsite']);

export interface JobCardProps {
  job: Job;
  onSelect: (job: Job) => void;
}

export function JobCard({ job, onSelect }: JobCardProps) {
  return (
    <button className="job-card" onClick={() => onSelect(job)} type="button">
      <div className="job-card__logo">
        {job.companyLogoUrl ? (
          <img src={job.companyLogoUrl} alt="" />
        ) : (
          <span>{initials(job.company)}</span>
        )}
      </div>
      <div className="job-card__body">
        <div className="job-card__title-row">
          <span className="job-card__title">{job.title}</span>
          {job.level && (
            <span className="job-card__level-badge">
              {levelLabel(job.level)}
            </span>
          )}
        </div>
        <span className="job-card__company">{job.company}</span>
        <div className="job-card__meta-row">
          <span className="job-card__location">{job.location}</span>
          <span
            className={
              WARN_REMOTE_TYPES.has(job.remoteType)
                ? 'job-card__remote-pill job-card__remote-pill--warn'
                : 'job-card__remote-pill'
            }
          >
            {remoteTypeLabel(job.remoteType)}
          </span>
        </div>
      </div>
    </button>
  );
}
