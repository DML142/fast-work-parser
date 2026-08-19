import { StackMatchRule, DEFAULT_STACK_KEYWORDS } from './stack-match.rule';
import { buildJobEntity } from '../../common/testing/job-entity.fixture';

describe('StackMatchRule', () => {
  it('has the name StackMatchRule', () => {
    const rule = new StackMatchRule(DEFAULT_STACK_KEYWORDS);
    expect(rule.name).toBe('StackMatchRule');
  });

  it('matches when the description contains a default keyword', () => {
    const rule = new StackMatchRule(DEFAULT_STACK_KEYWORDS);
    const job = buildJobEntity({
      description: 'Join our team building products with React.',
      stack: [],
    });

    expect(rule.matches(job)).toBe(true);
  });

  it('matches case-insensitively', () => {
    const rule = new StackMatchRule(DEFAULT_STACK_KEYWORDS);
    const job = buildJobEntity({
      description: 'We use typescript across the whole stack.',
      stack: [],
    });

    expect(rule.matches(job)).toBe(true);
  });

  // RemoteOK's `tags` field is sometimes a generic site-wide taxonomy rather than
  // per-job tags (e.g. an "Aviation Maintenance Technician" posting tagged "react",
  // "typescript"), so the stack array isn't a trustworthy match source.
  it('does not match a keyword found only in the stack array', () => {
    const rule = new StackMatchRule(DEFAULT_STACK_KEYWORDS);
    const job = buildJobEntity({
      title: 'Aviation Maintenance Technician',
      description: 'Great opportunity, apply now.',
      stack: ['Zustand', 'Vite'],
    });

    expect(rule.matches(job)).toBe(false);
  });

  it('matches a multi-token keyword like Next.js', () => {
    const rule = new StackMatchRule(DEFAULT_STACK_KEYWORDS);
    const job = buildJobEntity({
      description: 'Experience with Next.js is a big plus.',
      stack: [],
    });

    expect(rule.matches(job)).toBe(true);
  });

  it('does not match when no keyword is present', () => {
    const rule = new StackMatchRule(DEFAULT_STACK_KEYWORDS);
    const job = buildJobEntity({
      title: 'Backend Java Engineer',
      description: 'Looking for a Java and Spring Boot expert.',
      stack: ['Java', 'Spring'],
    });

    expect(rule.matches(job)).toBe(false);
  });

  it('does not match a substring false positive (Reactive vs React)', () => {
    const rule = new StackMatchRule(DEFAULT_STACK_KEYWORDS);
    const job = buildJobEntity({
      title: 'Reactive Systems Engineer',
      description:
        'Experience with reactive programming (RxJS, reactive streams).',
      stack: [],
    });

    expect(rule.matches(job)).toBe(false);
  });

  it('respects a custom keyword list injected via the constructor', () => {
    const rule = new StackMatchRule(['Rust']);
    const job = buildJobEntity({
      description: 'We are a Rust shop.',
      stack: [],
    });

    expect(rule.matches(job)).toBe(true);
  });
});
