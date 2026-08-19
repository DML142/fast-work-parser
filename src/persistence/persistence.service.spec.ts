import { Repository } from 'typeorm';
import { PersistenceService } from './persistence.service';
import { JobEntity } from '../jobs/entities/job.entity';
import { buildJobEntity } from '../common/testing/job-entity.fixture';

function fakeRepository(
  existingIds: string[],
): jest.Mocked<Pick<Repository<JobEntity>, 'find' | 'save'>> {
  return {
    find: jest.fn().mockResolvedValue(existingIds.map((id) => ({ id }))),
    save: jest
      .fn()
      .mockImplementation((jobs: JobEntity[]) => Promise.resolve(jobs)),
  };
}

function buildService(existingIds: string[] = []) {
  const repository = fakeRepository(existingIds);
  const service = new PersistenceService(
    repository as unknown as Repository<JobEntity>,
  );
  return { repository, service };
}

describe('PersistenceService', () => {
  it('saves and returns all jobs when none exist yet', async () => {
    const { repository, service } = buildService([]);
    const jobA = buildJobEntity({ id: 'a' });
    const jobB = buildJobEntity({ id: 'b' });

    const result = await service.saveNewJobs([jobA, jobB]);

    expect(result).toEqual([jobA, jobB]);
    expect(repository.save).toHaveBeenCalledWith([jobA, jobB]);
  });

  it('returns an empty array and skips save when every job already exists', async () => {
    const { repository, service } = buildService(['a', 'b']);
    const jobA = buildJobEntity({ id: 'a' });
    const jobB = buildJobEntity({ id: 'b' });

    const result = await service.saveNewJobs([jobA, jobB]);

    expect(result).toEqual([]);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('saves and returns only the jobs not already in the database', async () => {
    const { repository, service } = buildService(['a']);
    const jobA = buildJobEntity({ id: 'a' });
    const jobB = buildJobEntity({ id: 'b' });

    const result = await service.saveNewJobs([jobA, jobB]);

    expect(result).toEqual([jobB]);
    expect(repository.save).toHaveBeenCalledWith([jobB]);
  });

  it('returns an empty array and skips the DB lookup for an empty input', async () => {
    const { repository, service } = buildService([]);

    const result = await service.saveNewJobs([]);

    expect(result).toEqual([]);
    expect(repository.find).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('collapses duplicate ids within the same batch, keeping the first occurrence', async () => {
    const { repository, service } = buildService([]);
    const first = buildJobEntity({ id: 'a', title: 'First' });
    const duplicate = buildJobEntity({ id: 'a', title: 'Duplicate' });

    const result = await service.saveNewJobs([first, duplicate]);

    expect(result).toEqual([first]);
    expect(repository.save).toHaveBeenCalledWith([first]);
  });
});
