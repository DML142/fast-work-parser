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
      provide: FILTER_RULES,
      useFactory: (
        stackMatch: StackMatchRule,
        visaRedFlag: VisaRedFlagRule,
      ): FilterRule[] => [stackMatch, visaRedFlag],
      inject: [StackMatchRule, VisaRedFlagRule],
    },
    FilterService,
  ],
  exports: [FilterService],
})
export class FilterModule {}
