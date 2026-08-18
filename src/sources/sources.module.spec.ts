import { Test } from '@nestjs/testing';
import { SourcesModule } from './sources.module';
import { RemoteOkAdapter } from './adapters/remoteok.adapter';
import { RemotiveAdapter } from './adapters/remotive.adapter';

describe('SourcesModule', () => {
  it('provides both source adapters', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [SourcesModule],
    }).compile();

    expect(moduleRef.get(RemoteOkAdapter)).toBeInstanceOf(RemoteOkAdapter);
    expect(moduleRef.get(RemotiveAdapter)).toBeInstanceOf(RemotiveAdapter);

    await moduleRef.close();
  });
});
