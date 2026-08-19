import { Inject, Injectable } from '@nestjs/common';
import { FILTER_RULES } from './filter-rules.token';
import { FilterRule } from '../common/interfaces/filter-rule.interface';
import { JobEntity } from '../jobs/entities/job.entity';

@Injectable()
export class FilterService {
  constructor(@Inject(FILTER_RULES) private readonly rules: FilterRule[]) {}

  passes(job: JobEntity): boolean {
    return this.rules.every((rule) => rule.matches(job));
  }
}
