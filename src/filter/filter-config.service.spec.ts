import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FilterConfigEntity,
  FILTER_CONFIG_ROW_ID,
} from './entities/filter-config.entity';
import {
  FilterConfigService,
  loadOrSeedFilterConfig,
} from './filter-config.service';

describe('loadOrSeedFilterConfig', () => {
  let repository: Repository<FilterConfigEntity>;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [FilterConfigEntity],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([FilterConfigEntity]),
      ],
    }).compile();

    repository = module.get<Repository<FilterConfigEntity>>(
      getRepositoryToken(FilterConfigEntity),
    );
  });

  afterEach(async () => {
    await module.close();
  });

  it('creates and returns a seeded row when none exists yet', async () => {
    const row = await loadOrSeedFilterConfig(repository, {
      includeKeywords: ['React', 'NestJS'],
      excludeKeywords: ['US citizen'],
    });

    expect(row.id).toBe(FILTER_CONFIG_ROW_ID);
    expect(row.includeKeywords).toEqual(['React', 'NestJS']);
    expect(row.excludeKeywords).toEqual(['US citizen']);
    expect(row.lastParsedAt).toBeNull();

    const found = await repository.findOneBy({ id: FILTER_CONFIG_ROW_ID });
    expect(found).not.toBeNull();
  });

  it('returns the existing row unchanged on a second call, without reseeding', async () => {
    await loadOrSeedFilterConfig(repository, {
      includeKeywords: ['React'],
      excludeKeywords: ['US citizen'],
    });
    await repository.save({
      id: FILTER_CONFIG_ROW_ID,
      includeKeywords: ['Edited'],
      excludeKeywords: ['US citizen'],
      lastParsedAt: null,
    });

    const row = await loadOrSeedFilterConfig(repository, {
      includeKeywords: ['React'],
      excludeKeywords: ['US citizen'],
    });

    expect(row.includeKeywords).toEqual(['Edited']);
  });
});

function fakeRepository(
  initial: FilterConfigEntity,
): jest.Mocked<Pick<Repository<FilterConfigEntity>, 'save'>> {
  return {
    save: jest
      .fn()
      .mockImplementation((row: FilterConfigEntity) =>
        Promise.resolve({ ...initial, ...row }),
      ),
  };
}

describe('FilterConfigService', () => {
  const initialRow: FilterConfigEntity = {
    id: FILTER_CONFIG_ROW_ID,
    includeKeywords: ['React'],
    excludeKeywords: ['US citizen'],
    lastParsedAt: null,
  };

  it('exposes the seeded row via its getters', () => {
    const repository = fakeRepository(initialRow);
    const service = new FilterConfigService(
      repository as unknown as Repository<FilterConfigEntity>,
      initialRow,
    );

    expect(service.includeKeywords).toEqual(['React']);
    expect(service.excludeKeywords).toEqual(['US citizen']);
    expect(service.lastParsedAt).toBeNull();
  });

  it('writes through an include-keyword update and reflects it via the getter', async () => {
    const repository = fakeRepository(initialRow);
    const service = new FilterConfigService(
      repository as unknown as Repository<FilterConfigEntity>,
      initialRow,
    );

    await service.updateKeywords({ includeKeywords: ['Rust'] });

    expect(repository.save).toHaveBeenCalledWith({
      ...initialRow,
      includeKeywords: ['Rust'],
    });
    expect(service.includeKeywords).toEqual(['Rust']);
    expect(service.excludeKeywords).toEqual(['US citizen']);
  });

  it('records a parse run with the current time', async () => {
    const repository = fakeRepository(initialRow);
    const service = new FilterConfigService(
      repository as unknown as Repository<FilterConfigEntity>,
      initialRow,
    );

    const before = new Date();
    await service.recordParseRun();
    const after = new Date();

    expect(service.lastParsedAt).not.toBeNull();
    expect(service.lastParsedAt!.getTime()).toBeGreaterThanOrEqual(
      before.getTime(),
    );
    expect(service.lastParsedAt!.getTime()).toBeLessThanOrEqual(
      after.getTime(),
    );
  });
});
