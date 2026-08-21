import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobEntity } from '../jobs/entities/job.entity';
import { deriveLevel, JobLevel } from '../jobs/derive-level';
import { TelegramInitDataGuard } from './telegram-init-data.guard';
import { FilterService } from '../filter/filter.service';
import { SourceConfigService } from '../sources/source-config.service';

export interface JobResponse extends JobEntity {
  level: JobLevel | null;
}

@UseGuards(TelegramInitDataGuard)
@Controller('api/jobs')
export class JobsController {
  constructor(
    @InjectRepository(JobEntity)
    private readonly repository: Repository<JobEntity>,
    private readonly filterService: FilterService,
    private readonly sourceConfigService: SourceConfigService,
  ) {}

  @Get()
  async list(): Promise<JobResponse[]> {
    const jobs = await this.repository.find({ order: { fetchedAt: 'DESC' } });
    // Filters/source toggles gate ingestion too, but re-applying them here means
    // an edit takes effect on the feed immediately, not just on the next parse.
    return jobs
      .filter(
        (job) =>
          this.sourceConfigService.isEnabled(job.source) &&
          this.filterService.passes(job),
      )
      .map((job) => ({
        ...job,
        level: deriveLevel(job.title, job.description),
      }));
  }
}
