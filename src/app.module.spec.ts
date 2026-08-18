import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from './app.module';
import { JobEntity } from './jobs/entities/job.entity';

describe('AppModule', () => {
  it('boots with an in-memory database and registers the JobEntity repository', async () => {
    process.env.DB_PATH = ':memory:';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const repository = moduleRef.get<Repository<JobEntity>>(
      getRepositoryToken(JobEntity),
    );
    expect(repository).toBeDefined();

    await moduleRef.close();
    delete process.env.DB_PATH;
  });
});
