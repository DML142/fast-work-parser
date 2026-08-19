import { Injectable } from '@nestjs/common';
import { FilterRule } from '../../common/interfaces/filter-rule.interface';
import { JobEntity } from '../../jobs/entities/job.entity';

export const DEFAULT_STACK_KEYWORDS: readonly string[] = [
  'React',
  'Next.js',
  'NestJS',
  'TypeScript',
  'Zustand',
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class StackMatchRule implements FilterRule {
  readonly name = 'StackMatchRule';

  constructor(private readonly keywords: readonly string[]) {}

  matches(job: JobEntity): boolean {
    const haystack = [job.title, job.description, ...job.stack].join(' ');
    return this.keywords.some((keyword) =>
      new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'i').test(haystack),
    );
  }
}
