import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SourceConfigEntity } from './entities/source-config.entity';
import {
  SourceConfigService,
  loadOrSeedSourceConfig,
} from './source-config.service';

describe('loadOrSeedSourceConfig', () => {
  let repository: Repository<SourceConfigEntity>;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [SourceConfigEntity],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([SourceConfigEntity]),
      ],
    }).compile();

    repository = module.get<Repository<SourceConfigEntity>>(
      getRepositoryToken(SourceConfigEntity),
    );
  });

  afterEach(async () => {
    await module.close();
  });

  it('seeds a row per source name, all enabled, when the table is empty', async () => {
    const rows = await loadOrSeedSourceConfig(repository, ['A', 'B']);

    expect(rows.map((row) => row.name).sort()).toEqual(['A', 'B']);
    expect(rows.every((row) => row.enabled)).toBe(true);
  });

  it('only seeds the names missing from an already-partially-populated table', async () => {
    await repository.save({ name: 'A', enabled: false });

    const rows = await loadOrSeedSourceConfig(repository, ['A', 'B']);

    const byName = new Map(rows.map((row) => [row.name, row.enabled]));
    expect(byName.get('A')).toBe(false);
    expect(byName.get('B')).toBe(true);
  });
});

function fakeRepository(): jest.Mocked<
  Pick<Repository<SourceConfigEntity>, 'save'>
> {
  return {
    save: jest
      .fn()
      .mockImplementation((row: SourceConfigEntity) => Promise.resolve(row)),
  };
}

describe('SourceConfigService', () => {
  it('reports enabled/disabled per the seeded rows', () => {
    const service = new SourceConfigService(
      fakeRepository() as unknown as Repository<SourceConfigEntity>,
      [
        { name: 'A', enabled: true },
        { name: 'B', enabled: false },
      ],
    );

    expect(service.isEnabled('A')).toBe(true);
    expect(service.isEnabled('B')).toBe(false);
  });

  it('defaults to enabled for a name it has never seen', () => {
    const service = new SourceConfigService(
      fakeRepository() as unknown as Repository<SourceConfigEntity>,
      [],
    );

    expect(service.isEnabled('Unknown')).toBe(true);
  });

  it('lists every known source with its enabled state', () => {
    const service = new SourceConfigService(
      fakeRepository() as unknown as Repository<SourceConfigEntity>,
      [
        { name: 'A', enabled: true },
        { name: 'B', enabled: false },
      ],
    );

    expect(service.list().sort((a, b) => a.name.localeCompare(b.name))).toEqual(
      [
        { name: 'A', enabled: true },
        { name: 'B', enabled: false },
      ],
    );
  });

  it('writes through a toggle and reflects it immediately', async () => {
    const repository = fakeRepository();
    const service = new SourceConfigService(
      repository as unknown as Repository<SourceConfigEntity>,
      [{ name: 'A', enabled: true }],
    );

    await service.setEnabled('A', false);

    expect(repository.save).toHaveBeenCalledWith({ name: 'A', enabled: false });
    expect(service.isEnabled('A')).toBe(false);
  });
});
