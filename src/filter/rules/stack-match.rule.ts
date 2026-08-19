import { Injectable } from '@nestjs/common';
import { FilterRule } from '../../common/interfaces/filter-rule.interface';
import { JobEntity } from '../../jobs/entities/job.entity';

export const DEFAULT_STACK_KEYWORDS: readonly string[] = [
  'React',
  'Next.js',
  'NestJS',
  'TypeScript',
  'Zustand',
  'JavaScript',
  'Node.js',
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class StackMatchRule implements FilterRule {
  readonly name = 'StackMatchRule';

  constructor(private readonly keywords: readonly string[]) {}

  // Word-boundary matching prevents false positives like "Reactive" matching the "React" keyword.
  // job.stack is intentionally excluded: some sources (e.g. RemoteOK) sometimes return a
  // generic site-wide tag list instead of per-job tags, making it an unreliable match source.
  matches(job: JobEntity): boolean {
    const haystack = [job.title, job.description].join(' ');
    return this.keywords.some((keyword) =>
      new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'i').test(haystack),
    );
  }
}
