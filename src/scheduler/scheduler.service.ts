import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  JOB_SOURCES,
  type NormalizingJobSource,
} from '../sources/job-sources.token';
import { FilterService } from '../filter/filter.service';
import { PersistenceService } from '../persistence/persistence.service';
import { NotifierService } from '../notifier/notifier.service';
import { SourceConfigService } from '../sources/source-config.service';
import { FilterConfigService } from '../filter/filter-config.service';
import { JobEntity } from '../jobs/entities/job.entity';
import { ParseActivityLog } from './parse-activity-log';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @Inject(JOB_SOURCES) private readonly sources: NormalizingJobSource[],
    private readonly filterService: FilterService,
    private readonly persistenceService: PersistenceService,
    private readonly notifierService: NotifierService,
    private readonly sourceConfigService: SourceConfigService,
    private readonly filterConfigService: FilterConfigService,
    private readonly parseActivityLog: ParseActivityLog,
  ) {}

  @Cron(CronExpression.EVERY_6_HOURS)
  async runPipeline(): Promise<void> {
    this.parseActivityLog.start();
    try {
      const normalized = await this.fetchAndNormalizeAll();
      const filtered = normalized.filter((job) =>
        this.filterService.passes(job),
      );
      const newJobs = await this.persistenceService.saveNewJobs(filtered);
      await this.notifierService.notify(newJobs);
      await this.filterConfigService.recordParseRun();
    } finally {
      this.parseActivityLog.finish();
    }
  }

  private async fetchAndNormalizeAll(): Promise<JobEntity[]> {
    const enabledSources = this.sources.filter((source) =>
      this.sourceConfigService.isEnabled(source.name),
    );

    const results = await Promise.all(
      enabledSources.map(async (source) => {
        this.parseActivityLog.record(source.name, `Fetching ${source.name}…`);
        try {
          const rawJobs = await source.fetchJobs();
          const normalized = rawJobs.map((raw) => source.normalize(raw));
          for (const job of normalized) {
            this.parseActivityLog.record(source.name, job.title);
          }
          this.parseActivityLog.record(
            source.name,
            `Found ${normalized.length} job(s)`,
          );
          return normalized;
        } catch (error) {
          this.logger.error(
            `Failed to fetch jobs from ${source.name}`,
            error as Error,
          );
          this.parseActivityLog.record(
            source.name,
            'Failed to fetch jobs from this source',
          );
          return [];
        }
      }),
    );

    return results.flat();
  }
}
