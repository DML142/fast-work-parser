import { deriveLevel } from './derive-level';

describe('deriveLevel', () => {
  it('detects "junior" in the title', () => {
    expect(deriveLevel('Junior React Developer', '')).toBe('junior');
  });

  it('detects "джун" (Cyrillic) in the description', () => {
    expect(deriveLevel('React Developer', 'Ищем джуна в команду.')).toBe(
      'junior',
    );
  });

  it('detects "middle" and its Cyrillic variants', () => {
    expect(deriveLevel('Middle Backend Engineer', '')).toBe('middle');
    expect(deriveLevel('', 'Нужен миддл фронтенд разработчик')).toBe('middle');
    expect(deriveLevel('', 'Ищем мидл-разработчика')).toBe('middle');
  });

  it('detects "senior" and its Cyrillic variants', () => {
    expect(deriveLevel('Senior Backend Engineer', '')).toBe('senior');
    expect(deriveLevel('', 'Требуется сеньор разработчик')).toBe('senior');
    expect(deriveLevel('', 'Требуется синьор разработчик')).toBe('senior');
  });

  it('detects "lead" and its Cyrillic variant', () => {
    expect(deriveLevel('Team Lead', '')).toBe('lead');
    expect(deriveLevel('', 'Ищем лида команды')).toBe('lead');
  });

  it('detects "тимлид" and "техлид", including inflected forms', () => {
    expect(deriveLevel('', 'Ищем тимлида в команду')).toBe('lead');
    expect(deriveLevel('', 'Требуется техлид на проект')).toBe('lead');
  });

  it('returns null when no seniority keyword is present', () => {
    expect(deriveLevel('React Developer', 'Build great products.')).toBeNull();
  });

  it('does not match a keyword embedded inside another word', () => {
    expect(deriveLevel('Leadership Coach', 'Helping teams grow.')).toBeNull();
  });

  it('prefers the highest seniority when multiple keywords appear', () => {
    expect(
      deriveLevel('Senior to Lead Backend Engineer', 'Growth path included.'),
    ).toBe('lead');
  });

  it('does not match "лид" as a prefix of an unrelated word like "лидер"', () => {
    expect(deriveLevel('', 'Мы лидер рынка среди IT компаний')).toBeNull();
  });

  it('does not match "джун" as a prefix of an unrelated word like "джунгли"', () => {
    expect(deriveLevel('', 'Добро пожаловать в джунгли стартапов')).toBeNull();
  });
});
