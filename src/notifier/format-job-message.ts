import { JobEntity } from '../jobs/entities/job.entity';

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatJobMessage(job: JobEntity): string {
  const lines = [`[${job.source}] ${job.title} — ${job.company}`];

  if (job.stack.length > 0) {
    lines.push(`Stack: ${job.stack.join(', ')}`);
  }

  const details = [capitalize(job.remoteType), capitalize(job.contractType)];
  if (job.compensation !== null) {
    details.push(job.compensation);
  }
  lines.push(details.join(' | '));

  lines.push(job.sourceUrl);

  return lines.join('\n');
}
