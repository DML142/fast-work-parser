import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { JobEntity } from '../jobs/entities/job.entity';

@Injectable()
export class PersistenceService {
  constructor(
    @InjectRepository(JobEntity)
    private readonly repository: Repository<JobEntity>,
  ) {}

  async saveNewJobs(jobs: JobEntity[]): Promise<JobEntity[]> {
    if (jobs.length === 0) {
      return [];
    }

    const seenIds = new Map<string, JobEntity>();
    for (const job of jobs) {
      if (!seenIds.has(job.id)) {
        seenIds.set(job.id, job);
      }
    }
    const uniqueJobs = [...seenIds.values()];
    const existing = await this.repository.find({
      where: { id: In(uniqueJobs.map((job) => job.id)) },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((job) => job.id));
    const newJobs = uniqueJobs.filter((job) => !existingIds.has(job.id));

    if (newJobs.length === 0) {
      return [];
    }

    return this.repository.save(newJobs);
  }
}
