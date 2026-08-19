import { Module } from '@nestjs/common';
import { FILTER_RULES } from './filter-rules.token';
import { FilterService } from './filter.service';
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
  providers: [
    {
      provide: StackMatchRule,
      useFactory: () => new StackMatchRule(DEFAULT_STACK_KEYWORDS),
    },
    {
      provide: VisaRedFlagRule,
      useFactory: () => new VisaRedFlagRule(DEFAULT_VISA_RED_FLAGS),
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
  exports: [FilterService],
})
export class FilterModule {}
