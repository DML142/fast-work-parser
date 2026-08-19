import { Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FilterModule } from './filter.module';
import { FilterService } from './filter.service';
import { buildJobEntity } from '../common/testing/job-entity.fixture';

@Injectable()
class ConsumerService {
  constructor(readonly filterService: FilterService) {}
}

@Module({ imports: [FilterModule], providers: [ConsumerService] })
class ConsumerModule {}

describe('FilterModule', () => {
  it('exports FilterService for a consuming module to inject', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConsumerModule],
    }).compile();

    const consumerService = moduleRef.get(ConsumerService);

    expect(consumerService.filterService).toBeInstanceOf(FilterService);

    await moduleRef.close();
  });

  it('wires the default rules so a real job is filtered end to end', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [FilterModule],
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
});
