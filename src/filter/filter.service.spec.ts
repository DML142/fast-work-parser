import { FilterService } from './filter.service';
import { FilterRule } from '../common/interfaces/filter-rule.interface';
import { buildJobEntity } from '../common/testing/job-entity.fixture';
import {
  StackMatchRule,
  DEFAULT_STACK_KEYWORDS,
} from './rules/stack-match.rule';
import {
  VisaRedFlagRule,
  DEFAULT_VISA_RED_FLAGS,
} from './rules/visa-red-flag.rule';

function fakeRule(name: string, result: boolean): FilterRule {
  return { name, matches: () => result };
}

describe('FilterService', () => {
  it('passes a job when every rule matches', () => {
    const service = new FilterService([
      fakeRule('A', true),
      fakeRule('B', true),
    ]);
    expect(service.passes(buildJobEntity())).toBe(true);
  });

  it('rejects a job when any rule does not match', () => {
    const service = new FilterService([
      fakeRule('A', true),
      fakeRule('B', false),
    ]);
    expect(service.passes(buildJobEntity())).toBe(false);
  });

  it('rejects a job when the first rule fails, without needing the rest to pass', () => {
    const service = new FilterService([
      fakeRule('A', false),
      fakeRule('B', false),
    ]);
    expect(service.passes(buildJobEntity())).toBe(false);
  });

  it('passes a job by default when there are no rules', () => {
    const service = new FilterService([]);
    expect(service.passes(buildJobEntity())).toBe(true);
  });

  it('combines the real StackMatchRule and VisaRedFlagRule end to end', () => {
    const service = new FilterService([
      new StackMatchRule(DEFAULT_STACK_KEYWORDS),
      new VisaRedFlagRule(DEFAULT_VISA_RED_FLAGS),
    ]);

    const goodJob = buildJobEntity({
      description:
        'Remote React and TypeScript role, worldwide applicants welcome.',
    });
    const wrongStackJob = buildJobEntity({
      title: 'Java Backend Engineer',
      description: 'Java and Spring Boot only.',
      stack: ['Java'],
    });
    const redFlagJob = buildJobEntity({
      description: 'React role, but must be a US citizen due to compliance.',
    });

    expect(service.passes(goodJob)).toBe(true);
    expect(service.passes(wrongStackJob)).toBe(false);
    expect(service.passes(redFlagJob)).toBe(false);
  });
});
