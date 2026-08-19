import { LocationRequirementRule } from './location-requirement.rule';
import { buildJobEntity } from '../../common/testing/job-entity.fixture';

describe('LocationRequirementRule', () => {
  it('has the name LocationRequirementRule', () => {
    const rule = new LocationRequirementRule('UA');
    expect(rule.name).toBe('LocationRequirementRule');
  });

  it('passes when no location-requirement phrase is present', () => {
    const rule = new LocationRequirementRule('UA');
    const job = buildJobEntity({
      description: 'Fully remote role, open to applicants worldwide.',
    });

    expect(rule.matches(job)).toBe(true);
  });

  it('passes when the requirement is the home country', () => {
    const rule = new LocationRequirementRule('UA');
    const job = buildJobEntity({
      description: 'Applicants must be based in Ukraine.',
    });

    expect(rule.matches(job)).toBe(true);
  });

  it('fails when the posting requires residency in a different country (English)', () => {
    const rule = new LocationRequirementRule('UA');
    const job = buildJobEntity({
      description: 'Applicants must be based in the US for this role.',
    });

    expect(rule.matches(job)).toBe(false);
  });

  it('fails when the posting requires residency in a different country (Russian, hh.ru style)', () => {
    const rule = new LocationRequirementRule('UA');
    const job = buildJobEntity({
      description: 'Требуется проживание в РФ на постоянной основе.',
    });

    expect(rule.matches(job)).toBe(false);
  });

  it('respects a different home country injected via the constructor', () => {
    const rule = new LocationRequirementRule('US');
    const job = buildJobEntity({
      description: 'Applicants must be based in the US for this role.',
    });

    expect(rule.matches(job)).toBe(true);
  });
});
