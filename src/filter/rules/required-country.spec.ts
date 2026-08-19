import { extractRequiredCountry } from './required-country';

describe('extractRequiredCountry', () => {
  it('returns null when no location-requirement phrase is present', () => {
    expect(
      extractRequiredCountry('Fully remote role, open worldwide.'),
    ).toBeNull();
  });

  it('extracts US from "must be based in the US"', () => {
    expect(
      extractRequiredCountry(
        'Applicants must be based in the US for this role.',
      ),
    ).toBe('US');
  });

  it('extracts UK from "must reside in the UK"', () => {
    expect(extractRequiredCountry('You must reside in the UK.')).toBe('UK');
  });

  it('extracts US from "must be a US citizen"', () => {
    expect(
      extractRequiredCountry('Candidates must be a US citizen to apply.'),
    ).toBe('US');
  });

  it('extracts Ukraine from "must be based in Ukraine"', () => {
    expect(
      extractRequiredCountry(
        'This role requires you must be based in Ukraine.',
      ),
    ).toBe('UA');
  });

  it('extracts Russia from Russian residency phrasing ("проживание в РФ")', () => {
    expect(
      extractRequiredCountry('Требуется проживание в РФ на постоянной основе.'),
    ).toBe('RU');
  });

  it('extracts Russia from "необходимо находиться на территории России"', () => {
    expect(
      extractRequiredCountry(
        'Кандидат должен необходимо находиться на территории России.',
      ),
    ).toBe('RU');
  });

  it('extracts Russia from "только резиденты РФ"', () => {
    expect(extractRequiredCountry('Рассматриваем только резиденты РФ.')).toBe(
      'RU',
    );
  });

  // "ТК РФ" (Russian Federation Labor Code) is a common hh.ru marker for formal
  // employment that requires being legally employed in Russia.
  it('extracts Russia from "трудоустройство по ТК РФ"', () => {
    expect(
      extractRequiredCountry('Официальное трудоустройство по ТК РФ.'),
    ).toBe('RU');
  });

  it('matches case-insensitively', () => {
    expect(
      extractRequiredCountry('must be based in THE US for this role'),
    ).toBe('US');
  });

  it('returns null when the captured location is not a recognized country', () => {
    expect(
      extractRequiredCountry('You must be based in a galaxy far away.'),
    ).toBeNull();
  });
});
