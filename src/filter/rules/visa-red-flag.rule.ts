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

  constructor(private readonly redFlags: readonly string[]) {}

  // Red-flag phrases match as substrings per spec, not word-boundaries.
  matches(job: JobEntity): boolean {
    const haystack = job.description.toLowerCase();
    return !this.redFlags.some((flag) => haystack.includes(flag.toLowerCase()));
  }
}
