import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobEntity } from './job.entity';
import { FilterRule } from '../../common/interfaces/filter-rule.interface';

describe('JobEntity persistence', () => {
  let repository: Repository<JobEntity>;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [JobEntity],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([JobEntity]),
      ],
    }).compile();

    repository = module.get<Repository<JobEntity>>(
      getRepositoryToken(JobEntity),
    );
  });

  afterAll(async () => {
    await module.close();
  });

  it('saves a job to SQLite and retrieves it with all fields intact', async () => {
    const job: JobEntity = {
      id: 'abc123',
      source: 'RemoteOK',
      title: 'Senior React Developer',
      company: 'Acme Inc',
      description: 'Looking for a React/Next.js expert',
      stack: ['React', 'Next.js', 'TypeScript'],
      location: 'Remote',
      remoteType: 'remote',
      contractType: 'contract',
      compensation: '$80-100k',
      sourceUrl: 'https://remoteok.com/jobs/abc123',
      postedAt: new Date('2026-08-10T00:00:00.000Z'),
      fetchedAt: new Date('2026-08-18T00:00:00.000Z'),
    };

    await repository.save(job);
    const found = await repository.findOneBy({ id: 'abc123' });

    expect(found).not.toBeNull();
    expect(found?.title).toBe('Senior React Developer');
    expect(found?.stack).toEqual(['React', 'Next.js', 'TypeScript']);
    expect(found?.remoteType).toBe('remote');
    expect(found?.compensation).toBe('$80-100k');
    expect(found?.postedAt).toEqual(new Date('2026-08-10T00:00:00.000Z'));
  });

  it('round-trips a job with null compensation and postedAt', async () => {
    const job: JobEntity = {
      id: 'def456',
      source: 'Remotive',
      title: 'NestJS Backend Engineer',
      company: 'Beta LLC',
      description: 'NestJS + TypeScript backend role',
      stack: ['NestJS', 'TypeScript'],
      location: 'Worldwide',
      remoteType: 'remote',
      contractType: 'unknown',
      compensation: null,
      sourceUrl: 'https://remotive.com/jobs/def456',
      postedAt: null,
      fetchedAt: new Date('2026-08-18T00:00:00.000Z'),
    };

    await repository.save(job);
    const found = await repository.findOneBy({ id: 'def456' });

    expect(found?.compensation).toBeNull();
    expect(found?.postedAt).toBeNull();
  });

  it('composes with a FilterRule implementation against a persisted job', async () => {
    const found = await repository.findOneBy({ id: 'abc123' });

    const stackMatchProbe: FilterRule = {
      name: 'StackMatchProbe',
      matches: (job) => job.stack.includes('React'),
    };

    expect(stackMatchProbe.matches(found as JobEntity)).toBe(true);
  });
});
