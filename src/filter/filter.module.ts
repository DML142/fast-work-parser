import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FILTER_RULES } from './filter-rules.token';
import { FilterService } from './filter.service';
import {
  FilterConfigService,
  loadOrSeedFilterConfig,
} from './filter-config.service';
import { FilterConfigEntity } from './entities/filter-config.entity';
import { FilterRule } from '../common/interfaces/filter-rule.interface';
import {
  StackMatchRule,
  DEFAULT_STACK_KEYWORDS,
} from './rules/stack-match.rule';
import {
  VisaRedFlagRule,
  DEFAULT_VISA_RED_FLAGS,
} from './rules/visa-red-flag.rule';
import {
  LocationRequirementRule,
  DEFAULT_HOME_COUNTRY,
} from './rules/location-requirement.rule';

@Module({
  imports: [TypeOrmModule.forFeature([FilterConfigEntity])],
  providers: [
    {
      provide: FilterConfigService,
      useFactory: async (repository: Repository<FilterConfigEntity>) => {
        const row = await loadOrSeedFilterConfig(repository, {
          includeKeywords: DEFAULT_STACK_KEYWORDS,
          excludeKeywords: DEFAULT_VISA_RED_FLAGS,
        });
        return new FilterConfigService(repository, row);
      },
      inject: [getRepositoryToken(FilterConfigEntity)],
    },
    {
      provide: StackMatchRule,
      useFactory: (filterConfigService: FilterConfigService) =>
        new StackMatchRule(() => filterConfigService.includeKeywords),
      inject: [FilterConfigService],
    },
    {
      provide: VisaRedFlagRule,
      useFactory: (filterConfigService: FilterConfigService) =>
        new VisaRedFlagRule(() => filterConfigService.excludeKeywords),
      inject: [FilterConfigService],
    },
    {
      provide: LocationRequirementRule,
      useFactory: () => new LocationRequirementRule(DEFAULT_HOME_COUNTRY),
    },
    {
      provide: FILTER_RULES,
      useFactory: (
        stackMatch: StackMatchRule,
        visaRedFlag: VisaRedFlagRule,
        locationRequirement: LocationRequirementRule,
      ): FilterRule[] => [stackMatch, visaRedFlag, locationRequirement],
      inject: [StackMatchRule, VisaRedFlagRule, LocationRequirementRule],
    },
    FilterService,
  ],
  exports: [FilterService, FilterConfigService],
})
export class FilterModule {}
