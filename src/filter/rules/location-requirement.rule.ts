import { Injectable } from '@nestjs/common';
import { FilterRule } from '../../common/interfaces/filter-rule.interface';
import { JobEntity } from '../../jobs/entities/job.entity';
import { extractRequiredCountry } from './required-country';

export const DEFAULT_HOME_COUNTRY = 'UA';

@Injectable()
export class LocationRequirementRule implements FilterRule {
  readonly name = 'LocationRequirementRule';

  constructor(private readonly homeCountry: string) {}

  // Rejects postings that explicitly require physical presence in a country other
  // than homeCountry; permissive (passes) when no such requirement is stated at all.
  matches(job: JobEntity): boolean {
    const requiredCountry = extractRequiredCountry(job.description);
    return requiredCountry === null || requiredCountry === this.homeCountry;
  }
}
