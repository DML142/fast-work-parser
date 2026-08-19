import { Module } from '@nestjs/common';
import { JobsModule } from '../jobs/jobs.module';
import { PersistenceService } from './persistence.service';

@Module({
  imports: [JobsModule],
  providers: [PersistenceService],
  exports: [PersistenceService],
})
export class PersistenceModule {}
