import { JobSource, RawJob } from '../common/interfaces/job-source.interface';
import { JobEntity } from '../jobs/entities/job.entity';

export interface NormalizingJobSource extends JobSource {
  normalize(raw: RawJob): JobEntity;
}

export const JOB_SOURCES = Symbol('JOB_SOURCES');

export const SOURCE_NAMES: readonly string[] = [
  'RemoteOK',
  'Remotive',
  'WeWorkRemotely',
  'Djinni',
  'hh.ru',
];
