import { JobEntity } from '../../jobs/entities/job.entity';

export interface FilterRule {
  name: string;
  matches(job: JobEntity): boolean;
}
