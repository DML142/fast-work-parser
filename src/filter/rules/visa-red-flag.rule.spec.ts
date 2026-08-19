import { VisaRedFlagRule, DEFAULT_VISA_RED_FLAGS } from './visa-red-flag.rule';
import { buildJobEntity } from '../../common/testing/job-entity.fixture';

describe('VisaRedFlagRule', () => {
  it('has the name VisaRedFlagRule', () => {
    const rule = new VisaRedFlagRule(DEFAULT_VISA_RED_FLAGS);
    expect(rule.name).toBe('VisaRedFlagRule');
  });

  it('passes (returns true) when the description has no red flag', () => {
    const rule = new VisaRedFlagRule(DEFAULT_VISA_RED_FLAGS);
    const job = buildJobEntity({
      description: 'Fully remote role open to applicants worldwide.',
    });

    expect(rule.matches(job)).toBe(true);
  });

  it('fails (returns false) when the description contains "US citizen"', () => {
    const rule = new VisaRedFlagRule(DEFAULT_VISA_RED_FLAGS);
    const job = buildJobEntity({
      description: 'Must be a US citizen due to federal contract requirements.',
    });

    expect(rule.matches(job)).toBe(false);
  });

  it('matches red flags case-insensitively', () => {
    const rule = new VisaRedFlagRule(DEFAULT_VISA_RED_FLAGS);
    const job = buildJobEntity({
      description: 'Candidate must hold an active SECURITY CLEARANCE.',
    });

    expect(rule.matches(job)).toBe(false);
  });

  it('fails on "no visa sponsorship"', () => {
    const rule = new VisaRedFlagRule(DEFAULT_VISA_RED_FLAGS);
    const job = buildJobEntity({
      description: 'Unfortunately we offer no visa sponsorship at this time.',
    });

    expect(rule.matches(job)).toBe(false);
  });

  it('fails on "must be based in the US"', () => {
    const rule = new VisaRedFlagRule(DEFAULT_VISA_RED_FLAGS);
    const job = buildJobEntity({
      description: 'Applicants must be based in the US for this role.',
    });

    expect(rule.matches(job)).toBe(false);
  });

  it('matches as a substring, not a whole-word boundary', () => {
    const rule = new VisaRedFlagRule(['clearance']);
    const job = buildJobEntity({
      description: 'Requires prior security-clearance-adjacent experience.',
    });

    expect(rule.matches(job)).toBe(false);
  });

  it('respects a custom red-flag list injected via the constructor', () => {
    const rule = new VisaRedFlagRule(['green card required']);
    const job = buildJobEntity({
      description: 'Green Card Required for this position.',
    });

    expect(rule.matches(job)).toBe(false);
  });
});
