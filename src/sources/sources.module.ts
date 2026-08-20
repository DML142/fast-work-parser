import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RemoteOkAdapter } from './adapters/remoteok.adapter';
import { RemotiveAdapter } from './adapters/remotive.adapter';
import { WeWorkRemotelyAdapter } from './adapters/weworkremotely.adapter';
import { DjinniAdapter } from './adapters/djinni.adapter';
import { HhAdapter } from './adapters/hh.adapter';
import { normalizeRemoteOkJob } from './normalizers/remoteok.normalizer';
import { normalizeRemotiveJob } from './normalizers/remotive.normalizer';
import { normalizeWeWorkRemotelyJob } from './normalizers/weworkremotely.normalizer';
import { normalizeDjinniJob } from './normalizers/djinni.normalizer';
import { normalizeHhJob } from './normalizers/hh.normalizer';
import {
  JOB_SOURCES,
  NormalizingJobSource,
  SOURCE_NAMES,
} from './job-sources.token';
import { SourceConfigEntity } from './entities/source-config.entity';
import {
  SourceConfigService,
  loadOrSeedSourceConfig,
} from './source-config.service';

@Module({
  // 35s: hh.ru's response time is inconsistent (observed live: 0.9s-28.6s, occasionally
  // timing out), well beyond the other sources' typical sub-second response times. A
  // slow/failed hh.ru fetch doesn't block the pipeline — SchedulerService's per-source
  // try/catch just yields 0 jobs from it for that run.
  imports: [
    HttpModule.register({ timeout: 35_000 }),
    TypeOrmModule.forFeature([SourceConfigEntity]),
  ],
  providers: [
    RemoteOkAdapter,
    RemotiveAdapter,
    WeWorkRemotelyAdapter,
    DjinniAdapter,
    HhAdapter,
    {
      provide: SourceConfigService,
      useFactory: async (repository: Repository<SourceConfigEntity>) => {
        const rows = await loadOrSeedSourceConfig(repository, SOURCE_NAMES);
        return new SourceConfigService(repository, rows);
      },
      inject: [getRepositoryToken(SourceConfigEntity)],
    },
    {
      provide: JOB_SOURCES,
      useFactory: (
        remoteOk: RemoteOkAdapter,
        remotive: RemotiveAdapter,
        weWorkRemotely: WeWorkRemotelyAdapter,
        djinni: DjinniAdapter,
        hh: HhAdapter,
      ): NormalizingJobSource[] => [
        {
          name: remoteOk.name,
          fetchJobs: () => remoteOk.fetchJobs(),
          normalize: normalizeRemoteOkJob,
        },
        {
          name: remotive.name,
          fetchJobs: () => remotive.fetchJobs(),
          normalize: normalizeRemotiveJob,
        },
        {
          name: weWorkRemotely.name,
          fetchJobs: () => weWorkRemotely.fetchJobs(),
          normalize: normalizeWeWorkRemotelyJob,
        },
        {
          name: djinni.name,
          fetchJobs: () => djinni.fetchJobs(),
          normalize: normalizeDjinniJob,
        },
        {
          name: hh.name,
          fetchJobs: () => hh.fetchJobs(),
          normalize: normalizeHhJob,
        },
      ],
      inject: [
        RemoteOkAdapter,
        RemotiveAdapter,
        WeWorkRemotelyAdapter,
        DjinniAdapter,
        HhAdapter,
      ],
    },
  ],
  exports: [
    RemoteOkAdapter,
    RemotiveAdapter,
    WeWorkRemotelyAdapter,
    DjinniAdapter,
    HhAdapter,
    JOB_SOURCES,
    SourceConfigService,
  ],
})
export class SourcesModule {}
