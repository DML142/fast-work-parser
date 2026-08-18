import { Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SourcesModule } from './sources.module';
import { RemoteOkAdapter } from './adapters/remoteok.adapter';
import { RemotiveAdapter } from './adapters/remotive.adapter';

@Injectable()
class ConsumerService {
  constructor(
    readonly remoteOkAdapter: RemoteOkAdapter,
    readonly remotiveAdapter: RemotiveAdapter,
  ) {}
}

@Module({ imports: [SourcesModule], providers: [ConsumerService] })
class ConsumerModule {}

describe('SourcesModule', () => {
  it('exports both source adapters for a consuming module to inject', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConsumerModule],
    }).compile();

    const consumerService = moduleRef.get(ConsumerService);

    expect(consumerService.remoteOkAdapter).toBeInstanceOf(RemoteOkAdapter);
    expect(consumerService.remotiveAdapter).toBeInstanceOf(RemotiveAdapter);

    await moduleRef.close();
  });
});
