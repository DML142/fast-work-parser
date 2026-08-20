import { Injectable } from '@nestjs/common';
import { FilterRule } from '../../common/interfaces/filter-rule.interface';
import { JobEntity } from '../../jobs/entities/job.entity';

export const DEFAULT_VISA_RED_FLAGS: readonly string[] = [
  'US citizen',
  'must be authorized to work in the US without sponsorship',
  'security clearance',
  'no visa sponsorship',
  'must be based in the US',
  'must be based in the UK',
];

@Injectable()
export class VisaRedFlagRule implements FilterRule {
  readonly name = 'VisaRedFlagRule';

  // Takes a getter (not a fixed array) so the exclude list can be edited
  // live via FilterConfigService without recreating this rule.
  constructor(private readonly getRedFlags: () => readonly string[]) {}

  // Red-flag phrases match as substrings per spec, not word-boundaries.
  matches(job: JobEntity): boolean {
    const haystack = job.description.toLowerCase();
    return !this.getRedFlags().some((flag) =>
      haystack.includes(flag.toLowerCase()),
    );
  }
}
