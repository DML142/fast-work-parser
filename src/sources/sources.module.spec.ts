import { Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SourcesModule } from './sources.module';
import { RemoteOkAdapter } from './adapters/remoteok.adapter';
import { RemotiveAdapter } from './adapters/remotive.adapter';
import { WeWorkRemotelyAdapter } from './adapters/weworkremotely.adapter';
import { DjinniAdapter } from './adapters/djinni.adapter';
import { JOB_SOURCES, NormalizingJobSource } from './job-sources.token';

@Injectable()
class ConsumerService {
  constructor(
    readonly remoteOkAdapter: RemoteOkAdapter,
    readonly remotiveAdapter: RemotiveAdapter,
    readonly weWorkRemotelyAdapter: WeWorkRemotelyAdapter,
    readonly djinniAdapter: DjinniAdapter,
  ) {}
}

@Module({ imports: [SourcesModule], providers: [ConsumerService] })
class ConsumerModule {}

describe('SourcesModule', () => {
  it('exports all source adapters for a consuming module to inject', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConsumerModule],
    }).compile();

    const consumerService = moduleRef.get(ConsumerService);

    expect(consumerService.remoteOkAdapter).toBeInstanceOf(RemoteOkAdapter);
    expect(consumerService.remotiveAdapter).toBeInstanceOf(RemotiveAdapter);
    expect(consumerService.weWorkRemotelyAdapter).toBeInstanceOf(
      WeWorkRemotelyAdapter,
    );
    expect(consumerService.djinniAdapter).toBeInstanceOf(DjinniAdapter);

    await moduleRef.close();
  });

  it('exports JOB_SOURCES pairing each adapter with its normalizer', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [SourcesModule],
    }).compile();

    const sources = moduleRef.get<NormalizingJobSource[]>(JOB_SOURCES);

    expect(sources.map((source) => source.name).sort()).toEqual([
      'Djinni',
      'RemoteOK',
      'Remotive',
      'WeWorkRemotely',
    ]);
    expect(
      sources.every((source) => typeof source.normalize === 'function'),
    ).toBe(true);

    await moduleRef.close();
  });
});
