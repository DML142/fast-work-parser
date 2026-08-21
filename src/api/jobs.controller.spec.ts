import { Repository } from 'typeorm';
import { JobsController } from './jobs.controller';
import { JobEntity } from '../jobs/entities/job.entity';
import { buildJobEntity } from '../common/testing/job-entity.fixture';
import { FilterService } from '../filter/filter.service';
import { SourceConfigService } from '../sources/source-config.service';

function fakeRepository(
  jobs: JobEntity[],
): jest.Mocked<Pick<Repository<JobEntity>, 'find'>> {
  return {
    find: jest.fn().mockResolvedValue(jobs),
  };
}

function fakeFilterService(
  passes: (job: JobEntity) => boolean = () => true,
): jest.Mocked<Pick<FilterService, 'passes'>> {
  return { passes: jest.fn(passes) };
}

function fakeSourceConfigService(
  isEnabled: (name: string) => boolean = () => true,
): jest.Mocked<Pick<SourceConfigService, 'isEnabled'>> {
  return { isEnabled: jest.fn(isEnabled) };
}

function createController(
  jobs: JobEntity[],
  overrides: {
    filterService?: jest.Mocked<Pick<FilterService, 'passes'>>;
    sourceConfigService?: jest.Mocked<Pick<SourceConfigService, 'isEnabled'>>;
  } = {},
) {
  const repository = fakeRepository(jobs);
  const filterService = overrides.filterService ?? fakeFilterService();
  const sourceConfigService =
    overrides.sourceConfigService ?? fakeSourceConfigService();
  const controller = new JobsController(
    repository as unknown as Repository<JobEntity>,
    filterService as unknown as FilterService,
    sourceConfigService as unknown as SourceConfigService,
  );
  return { controller, repository, filterService, sourceConfigService };
}

describe('JobsController', () => {
  it('returns persisted jobs newest-fetched-first, each with a derived level', async () => {
    const { controller, repository } = createController([
      buildJobEntity({ id: 'a', title: 'Senior React Developer' }),
    ]);

    const result = await controller.list();

    expect(repository.find).toHaveBeenCalledWith({
      order: { fetchedAt: 'DESC' },
    });
    expect(result).toEqual([
      expect.objectContaining({ id: 'a', level: 'senior' }),
    ]);
  });

  it('returns a null level when no seniority keyword is present', async () => {
    const { controller } = createController([
      buildJobEntity({
        id: 'b',
        title: 'React Developer',
        description: 'Build great products.',
      }),
    ]);

    const result = await controller.list();

    expect(result[0].level).toBeNull();
  });

  it('returns an empty array when there are no persisted jobs', async () => {
    const { controller } = createController([]);

    expect(await controller.list()).toEqual([]);
  });

  it('excludes jobs whose source is currently disabled, even though they are already persisted', async () => {
    const { controller } = createController(
      [
        buildJobEntity({ id: 'a', source: 'hh.ru' }),
        buildJobEntity({ id: 'b', source: 'Djinni' }),
      ],
      {
        sourceConfigService: fakeSourceConfigService(
          (name) => name !== 'hh.ru',
        ),
      },
    );

    const result = await controller.list();

    expect(result.map((job) => job.id)).toEqual(['b']);
  });

  it('excludes jobs that no longer pass the current filter rules, even though they are already persisted', async () => {
    const { controller } = createController(
      [buildJobEntity({ id: 'a' }), buildJobEntity({ id: 'b' })],
      { filterService: fakeFilterService((job) => job.id !== 'a') },
    );

    const result = await controller.list();

    expect(result.map((job) => job.id)).toEqual(['b']);
  });
});
