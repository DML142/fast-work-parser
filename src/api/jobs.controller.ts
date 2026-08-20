import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobEntity } from '../jobs/entities/job.entity';
import { deriveLevel, JobLevel } from '../jobs/derive-level';
import { TelegramInitDataGuard } from './telegram-init-data.guard';

export interface JobResponse extends JobEntity {
  level: JobLevel | null;
}

@UseGuards(TelegramInitDataGuard)
@Controller('api/jobs')
export class JobsController {
  constructor(
    @InjectRepository(JobEntity)
    private readonly repository: Repository<JobEntity>,
  ) {}

  @Get()
  async list(): Promise<JobResponse[]> {
    const jobs = await this.repository.find({ order: { fetchedAt: 'DESC' } });
    return jobs.map((job) => ({
      ...job,
      level: deriveLevel(job.title, job.description),
    }));
  }
}
