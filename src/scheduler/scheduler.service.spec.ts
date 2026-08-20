import { SchedulerService } from './scheduler.service';
import { NormalizingJobSource } from '../sources/job-sources.token';
import { FilterService } from '../filter/filter.service';
import { PersistenceService } from '../persistence/persistence.service';
import { NotifierService } from '../notifier/notifier.service';
import { SourceConfigService } from '../sources/source-config.service';
import { FilterConfigService } from '../filter/filter-config.service';
import { buildJobEntity } from '../common/testing/job-entity.fixture';
import { JobEntity } from '../jobs/entities/job.entity';

type SaveNewJobsMock = jest.Mock<Promise<JobEntity[]>, [JobEntity[]]>;
type NotifyMock = jest.Mock<Promise<void>, [JobEntity[]]>;

function fakeSource(name: string, ids: string[]): NormalizingJobSource {
  return {
    name,
    fetchJobs: jest.fn().mockResolvedValue(ids.map((id) => ({ id }))),
    normalize: jest.fn((raw) => buildJobEntity({ id: raw.id as string })),
  };
}

function fakeFilterService(
  passes: (job: JobEntity) => boolean = () => true,
): FilterService {
  return { passes: jest.fn(passes) } as unknown as FilterService;
}

function fakePersistenceService(
  saveNewJobs: SaveNewJobsMock = jest.fn((jobs: JobEntity[]) =>
    Promise.resolve(jobs),
  ),
): { persistenceService: PersistenceService; saveNewJobs: SaveNewJobsMock } {
  return {
    persistenceService: { saveNewJobs } as unknown as PersistenceService,
    saveNewJobs,
  };
}

function fakeNotifierService(): {
  notifierService: NotifierService;
  notify: NotifyMock;
} {
  const notify: NotifyMock = jest
    .fn<Promise<void>, [JobEntity[]]>()
    .mockResolvedValue(undefined);
  return { notifierService: { notify } as unknown as NotifierService, notify };
}

function fakeSourceConfigService(disabled: string[] = []): SourceConfigService {
  return {
    isEnabled: (name: string) => !disabled.includes(name),
  } as unknown as SourceConfigService;
}

function fakeFilterConfigService(): {
  filterConfigService: FilterConfigService;
  recordParseRun: jest.Mock<Promise<void>, []>;
} {
  const recordParseRun = jest
    .fn<Promise<void>, []>()
    .mockResolvedValue(undefined);
  return {
    filterConfigService: { recordParseRun } as unknown as FilterConfigService,
    recordParseRun,
  };
}

describe('SchedulerService', () => {
  it('fetches, normalizes, and flattens jobs from every enabled source', async () => {
    const sourceA = fakeSource('A', ['a1', 'a2']);
    const sourceB = fakeSource('B', ['b1']);
    const { persistenceService, saveNewJobs } = fakePersistenceService();
    const { notifierService } = fakeNotifierService();
    const { filterConfigService } = fakeFilterConfigService();
    const service = new SchedulerService(
      [sourceA, sourceB],
      fakeFilterService(),
      persistenceService,
      notifierService,
      fakeSourceConfigService(),
      filterConfigService,
    );

    await service.runPipeline();

    const savedJobs = saveNewJobs.mock.calls[0][0];
    expect(savedJobs.map((job) => job.id).sort()).toEqual(['a1', 'a2', 'b1']);
  });

  it('continues with the remaining sources when one source fails to fetch', async () => {
    const failingSource: NormalizingJobSource = {
      name: 'Failing',
      fetchJobs: jest.fn().mockRejectedValue(new Error('network down')),
      normalize: jest.fn(),
    };
    const okSource = fakeSource('OK', ['ok1']);
    const { persistenceService, saveNewJobs } = fakePersistenceService();
    const { notifierService } = fakeNotifierService();
    const { filterConfigService } = fakeFilterConfigService();
    const service = new SchedulerService(
      [failingSource, okSource],
      fakeFilterService(),
      persistenceService,
      notifierService,
      fakeSourceConfigService(),
      filterConfigService,
    );

    await service.runPipeline();

    const savedJobs = saveNewJobs.mock.calls[0][0];
    expect(savedJobs.map((job) => job.id)).toEqual(['ok1']);
  });

  it('only persists jobs that pass the filter', async () => {
    const source = fakeSource('A', ['keep', 'drop']);
    const { persistenceService, saveNewJobs } = fakePersistenceService();
    const { notifierService } = fakeNotifierService();
    const filterService = fakeFilterService((job) => job.id === 'keep');
    const { filterConfigService } = fakeFilterConfigService();
    const service = new SchedulerService(
      [source],
      filterService,
      persistenceService,
      notifierService,
      fakeSourceConfigService(),
      filterConfigService,
    );

    await service.runPipeline();

    const savedJobs = saveNewJobs.mock.calls[0][0];
    expect(savedJobs.map((job) => job.id)).toEqual(['keep']);
  });

  it('notifies only the jobs persistence reports as newly saved', async () => {
    const source = fakeSource('A', ['a', 'b']);
    const newlySaved = [buildJobEntity({ id: 'b' })];
    const { persistenceService } = fakePersistenceService(
      jest.fn().mockResolvedValue(newlySaved) as SaveNewJobsMock,
    );
    const { notifierService, notify } = fakeNotifierService();
    const { filterConfigService } = fakeFilterConfigService();
    const service = new SchedulerService(
      [source],
      fakeFilterService(),
      persistenceService,
      notifierService,
      fakeSourceConfigService(),
      filterConfigService,
    );

    await service.runPipeline();

    expect(notify).toHaveBeenCalledWith(newlySaved);
  });

  it('runs the full pipeline without error when there are no sources', async () => {
    const { persistenceService, saveNewJobs } = fakePersistenceService();
    const { notifierService, notify } = fakeNotifierService();
    const { filterConfigService } = fakeFilterConfigService();
    const service = new SchedulerService(
      [],
      fakeFilterService(),
      persistenceService,
      notifierService,
      fakeSourceConfigService(),
      filterConfigService,
    );

    await service.runPipeline();

    expect(saveNewJobs).toHaveBeenCalledWith([]);
    expect(notify).toHaveBeenCalledWith([]);
  });

  it('never calls fetchJobs on a source that SourceConfigService reports as disabled', async () => {
    const sourceA = fakeSource('A', ['a1']);
    const sourceB = fakeSource('B', ['b1']);
    const { persistenceService, saveNewJobs } = fakePersistenceService();
    const { notifierService } = fakeNotifierService();
    const { filterConfigService } = fakeFilterConfigService();
    const service = new SchedulerService(
      [sourceA, sourceB],
      fakeFilterService(),
      persistenceService,
      notifierService,
      fakeSourceConfigService(['B']),
      filterConfigService,
    );

    await service.runPipeline();

    // eslint-disable-next-line @typescript-eslint/unbound-method -- fetchJobs is a jest mock, not a bound method
    expect(sourceB.fetchJobs).not.toHaveBeenCalled();
    const savedJobs = saveNewJobs.mock.calls[0][0];
    expect(savedJobs.map((job) => job.id)).toEqual(['a1']);
  });

  it('records the parse run after completing the pipeline', async () => {
    const source = fakeSource('A', ['a1']);
    const { persistenceService } = fakePersistenceService();
    const { notifierService } = fakeNotifierService();
    const { filterConfigService, recordParseRun } = fakeFilterConfigService();
    const service = new SchedulerService(
      [source],
      fakeFilterService(),
      persistenceService,
      notifierService,
      fakeSourceConfigService(),
      filterConfigService,
    );

    await service.runPipeline();

    expect(recordParseRun).toHaveBeenCalled();
  });
});
