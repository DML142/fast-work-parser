import { Repository } from 'typeorm';
import { JobsController } from './jobs.controller';
import { JobEntity } from '../jobs/entities/job.entity';
import { buildJobEntity } from '../common/testing/job-entity.fixture';

function fakeRepository(
  jobs: JobEntity[],
): jest.Mocked<Pick<Repository<JobEntity>, 'find'>> {
  return {
    find: jest.fn().mockResolvedValue(jobs),
  };
}

describe('JobsController', () => {
  it('returns persisted jobs newest-fetched-first, each with a derived level', async () => {
    const repository = fakeRepository([
      buildJobEntity({ id: 'a', title: 'Senior React Developer' }),
    ]);
    const controller = new JobsController(
      repository as unknown as Repository<JobEntity>,
    );

    const result = await controller.list();

    expect(repository.find).toHaveBeenCalledWith({
      order: { fetchedAt: 'DESC' },
    });
    expect(result).toEqual([
      expect.objectContaining({ id: 'a', level: 'senior' }),
    ]);
  });

  it('returns a null level when no seniority keyword is present', async () => {
    const repository = fakeRepository([
      buildJobEntity({
        id: 'b',
        title: 'React Developer',
        description: 'Build great products.',
      }),
    ]);
    const controller = new JobsController(
      repository as unknown as Repository<JobEntity>,
    );

    const result = await controller.list();

    expect(result[0].level).toBeNull();
  });

  it('returns an empty array when there are no persisted jobs', async () => {
    const repository = fakeRepository([]);
    const controller = new JobsController(
      repository as unknown as Repository<JobEntity>,
    );

    expect(await controller.list()).toEqual([]);
  });
});
