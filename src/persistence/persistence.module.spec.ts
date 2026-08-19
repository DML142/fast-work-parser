import { Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersistenceModule } from './persistence.module';
import { PersistenceService } from './persistence.service';
import { JobEntity } from '../jobs/entities/job.entity';
import { buildJobEntity } from '../common/testing/job-entity.fixture';

@Injectable()
class ConsumerService {
  constructor(readonly persistenceService: PersistenceService) {}
}

@Module({ imports: [PersistenceModule], providers: [ConsumerService] })
class ConsumerModule {}

describe('PersistenceModule', () => {
  it('exports PersistenceService for a consuming module to inject', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [JobEntity],
          synchronize: true,
        }),
        ConsumerModule,
      ],
    }).compile();

    const consumerService = moduleRef.get(ConsumerService);

    expect(consumerService.persistenceService).toBeInstanceOf(
      PersistenceService,
    );

    await moduleRef.close();
  });

  it('persists a job once and skips it on a second run against the same database', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [JobEntity],
          synchronize: true,
        }),
        PersistenceModule,
      ],
    }).compile();

    const persistenceService = moduleRef.get(PersistenceService);
    const job = buildJobEntity({ id: 'dedup-1' });

    const firstRun = await persistenceService.saveNewJobs([job]);
    const secondRun = await persistenceService.saveNewJobs([job]);

    expect(firstRun).toEqual([job]);
    expect(secondRun).toEqual([]);

    await moduleRef.close();
  });
});
