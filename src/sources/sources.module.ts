import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RemoteOkAdapter } from './adapters/remoteok.adapter';
import { RemotiveAdapter } from './adapters/remotive.adapter';
import { normalizeRemoteOkJob } from './normalizers/remoteok.normalizer';
import { normalizeRemotiveJob } from './normalizers/remotive.normalizer';
import { JOB_SOURCES, NormalizingJobSource } from './job-sources.token';

@Module({
  imports: [HttpModule.register({ timeout: 10_000 })],
  providers: [
    RemoteOkAdapter,
    RemotiveAdapter,
    {
      provide: JOB_SOURCES,
      useFactory: (
        remoteOk: RemoteOkAdapter,
        remotive: RemotiveAdapter,
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
      ],
      inject: [RemoteOkAdapter, RemotiveAdapter],
    },
  ],
  exports: [RemoteOkAdapter, RemotiveAdapter, JOB_SOURCES],
})
export class SourcesModule {}
