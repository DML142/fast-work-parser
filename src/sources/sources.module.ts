import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RemoteOkAdapter } from './adapters/remoteok.adapter';
import { RemotiveAdapter } from './adapters/remotive.adapter';
import { WeWorkRemotelyAdapter } from './adapters/weworkremotely.adapter';
import { DjinniAdapter } from './adapters/djinni.adapter';
import { normalizeRemoteOkJob } from './normalizers/remoteok.normalizer';
import { normalizeRemotiveJob } from './normalizers/remotive.normalizer';
import { normalizeWeWorkRemotelyJob } from './normalizers/weworkremotely.normalizer';
import { normalizeDjinniJob } from './normalizers/djinni.normalizer';
import { JOB_SOURCES, NormalizingJobSource } from './job-sources.token';

@Module({
  imports: [HttpModule.register({ timeout: 10_000 })],
  providers: [
    RemoteOkAdapter,
    RemotiveAdapter,
    WeWorkRemotelyAdapter,
    DjinniAdapter,
    {
      provide: JOB_SOURCES,
      useFactory: (
        remoteOk: RemoteOkAdapter,
        remotive: RemotiveAdapter,
        weWorkRemotely: WeWorkRemotelyAdapter,
        djinni: DjinniAdapter,
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
      ],
      inject: [
        RemoteOkAdapter,
        RemotiveAdapter,
        WeWorkRemotelyAdapter,
        DjinniAdapter,
      ],
    },
  ],
  exports: [
    RemoteOkAdapter,
    RemotiveAdapter,
    WeWorkRemotelyAdapter,
    DjinniAdapter,
    JOB_SOURCES,
  ],
})
export class SourcesModule {}
