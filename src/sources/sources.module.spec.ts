import { Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SourcesModule } from './sources.module';
import { RemoteOkAdapter } from './adapters/remoteok.adapter';
import { RemotiveAdapter } from './adapters/remotive.adapter';
import { WeWorkRemotelyAdapter } from './adapters/weworkremotely.adapter';
import { DjinniAdapter } from './adapters/djinni.adapter';
import { HhAdapter } from './adapters/hh.adapter';
import { JOB_SOURCES, NormalizingJobSource } from './job-sources.token';
import { SourceConfigService } from './source-config.service';
import { SourceConfigEntity } from './entities/source-config.entity';

@Injectable()
class ConsumerService {
  constructor(
    readonly remoteOkAdapter: RemoteOkAdapter,
    readonly remotiveAdapter: RemotiveAdapter,
    readonly weWorkRemotelyAdapter: WeWorkRemotelyAdapter,
    readonly djinniAdapter: DjinniAdapter,
    readonly hhAdapter: HhAdapter,
    readonly sourceConfigService: SourceConfigService,
  ) {}
}

@Module({ imports: [SourcesModule], providers: [ConsumerService] })
class ConsumerModule {}

function inMemoryDb() {
  return TypeOrmModule.forRoot({
    type: 'better-sqlite3',
    database: ':memory:',
    entities: [SourceConfigEntity],
    synchronize: true,
  });
}

describe('SourcesModule', () => {
  it('exports all source adapters and SourceConfigService for a consuming module to inject', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [inMemoryDb(), ConsumerModule],
    }).compile();

    const consumerService = moduleRef.get(ConsumerService);

    expect(consumerService.remoteOkAdapter).toBeInstanceOf(RemoteOkAdapter);
    expect(consumerService.remotiveAdapter).toBeInstanceOf(RemotiveAdapter);
    expect(consumerService.weWorkRemotelyAdapter).toBeInstanceOf(
      WeWorkRemotelyAdapter,
    );
    expect(consumerService.djinniAdapter).toBeInstanceOf(DjinniAdapter);
    expect(consumerService.hhAdapter).toBeInstanceOf(HhAdapter);
    expect(consumerService.sourceConfigService).toBeInstanceOf(
      SourceConfigService,
    );

    await moduleRef.close();
  });

  it('exports JOB_SOURCES pairing each adapter with its normalizer', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [inMemoryDb(), SourcesModule],
    }).compile();

    const sources = moduleRef.get<NormalizingJobSource[]>(JOB_SOURCES);

    expect(sources.map((source) => source.name).sort()).toEqual([
      'Djinni',
      'RemoteOK',
      'Remotive',
      'WeWorkRemotely',
      'hh.ru',
    ]);
    expect(
      sources.every((source) => typeof source.normalize === 'function'),
    ).toBe(true);

    await moduleRef.close();
  });

  it('seeds SourceConfigService with all five sources enabled by default', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [inMemoryDb(), SourcesModule],
    }).compile();

    const sourceConfigService = moduleRef.get(SourceConfigService);

    expect(
      sourceConfigService
        .list()
        .map((row) => row.name)
        .sort(),
    ).toEqual(['Djinni', 'RemoteOK', 'Remotive', 'WeWorkRemotely', 'hh.ru']);
    expect(sourceConfigService.list().every((row) => row.enabled)).toBe(true);

    await moduleRef.close();
  });
});
