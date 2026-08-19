import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RemoteOkAdapter } from './adapters/remoteok.adapter';
import { RemotiveAdapter } from './adapters/remotive.adapter';

@Module({
  imports: [HttpModule.register({ timeout: 10_000 })],
  providers: [RemoteOkAdapter, RemotiveAdapter],
  exports: [RemoteOkAdapter, RemotiveAdapter],
})
export class SourcesModule {}
