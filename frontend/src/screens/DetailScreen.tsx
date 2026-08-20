import type { Job } from '../types';

export interface DetailScreenProps {
  job: Job;
}

export function DetailScreen({ job }: DetailScreenProps) {
  return (
    <div className="detail-screen">
      <div className="detail-screen__content">
        <h1>{job.title}</h1>
        <p className="detail-screen__meta">
          {job.company} · {job.location} · {job.source}
        </p>
        <p className="detail-screen__description">{job.description}</p>
      </div>
      <a
        className="detail-screen__open-link"
        href={job.sourceUrl}
        target="_blank"
        rel="noreferrer"
      >
        Open listing →
      </a>
    </div>
  );
}
