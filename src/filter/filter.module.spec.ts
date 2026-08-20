import { Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilterModule } from './filter.module';
import { FilterService } from './filter.service';
import { FilterConfigService } from './filter-config.service';
import { FilterConfigEntity } from './entities/filter-config.entity';
import { buildJobEntity } from '../common/testing/job-entity.fixture';

@Injectable()
class ConsumerService {
  constructor(readonly filterService: FilterService) {}
}

@Module({ imports: [FilterModule], providers: [ConsumerService] })
class ConsumerModule {}

function inMemoryDb() {
  return TypeOrmModule.forRoot({
    type: 'better-sqlite3',
    database: ':memory:',
    entities: [FilterConfigEntity],
    synchronize: true,
  });
}

describe('FilterModule', () => {
  it('exports FilterService for a consuming module to inject', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [inMemoryDb(), ConsumerModule],
    }).compile();

    const consumerService = moduleRef.get(ConsumerService);

    expect(consumerService.filterService).toBeInstanceOf(FilterService);

    await moduleRef.close();
  });

  it('wires the default rules so a real job is filtered end to end', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [inMemoryDb(), FilterModule],
    }).compile();

    const filterService = moduleRef.get(FilterService);

    const goodJob = buildJobEntity({
      description: 'Remote React role, worldwide applicants welcome.',
    });
    const redFlagJob = buildJobEntity({
      description: 'React role, but must be a US citizen due to compliance.',
    });
    const locationRequiredJob = buildJobEntity({
      description:
        'React role. Требуется проживание в РФ на постоянной основе.',
    });

    expect(filterService.passes(goodJob)).toBe(true);
    expect(filterService.passes(redFlagJob)).toBe(false);
    expect(filterService.passes(locationRequiredJob)).toBe(false);

    await moduleRef.close();
  });

  it('reflects an updated include-keyword list on the very next filter check', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [inMemoryDb(), FilterModule],
    }).compile();

    const filterService = moduleRef.get(FilterService);
    const filterConfigService = moduleRef.get(FilterConfigService);

    const rustJob = buildJobEntity({
      title: 'Rust Engineer',
      description: 'We are a Rust shop, worldwide applicants welcome.',
    });
    expect(filterService.passes(rustJob)).toBe(false);

    await filterConfigService.updateKeywords({ includeKeywords: ['Rust'] });

    expect(filterService.passes(rustJob)).toBe(true);

    await moduleRef.close();
  });
});
