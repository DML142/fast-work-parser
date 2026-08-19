// Canonical country codes for the location-requirement phrases below. Aliases are
// matched lowercase; add more as real postings surface phrasings we don't catch yet.
const COUNTRY_ALIASES: Record<string, string> = {
  ukraine: 'UA',
  украина: 'UA',
  украины: 'UA',
  украине: 'UA',
  украину: 'UA',

  us: 'US',
  usa: 'US',
  'the us': 'US',
  'the usa': 'US',
  'united states': 'US',
  'united states of america': 'US',

  uk: 'UK',
  'the uk': 'UK',
  'united kingdom': 'UK',
  'great britain': 'UK',

  russia: 'RU',
  'russian federation': 'RU',
  'the russian federation': 'RU',
  рф: 'RU',
  россия: 'RU',
  россии: 'RU',
  'российская федерация': 'RU',
  'российской федерации': 'RU',

  poland: 'PL',
  польша: 'PL',
  польше: 'PL',

  germany: 'DE',
  германия: 'DE',
  германии: 'DE',
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isCyrillic(value: string): boolean {
  return /[а-яё]/i.test(value);
}

// Sorted longest-first so e.g. "the united states of america" is tried before "us".
function namesPattern(predicate: (alias: string) => boolean): string {
  return Object.keys(COUNTRY_ALIASES)
    .filter(predicate)
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join('|');
}

const LATIN_NAMES = namesPattern((alias) => !isCyrillic(alias));
const CYRILLIC_NAMES = namesPattern(isCyrillic);

// Each pattern captures a known country name/alias (see COUNTRY_ALIASES) in group 1 —
// matching against the known alternatives directly, rather than capturing an arbitrary
// phrase and looking it up after, avoids over-greedy captures swallowing trailing words.
// English patterns cover sources like RemoteOK/Remotive/WeWorkRemotely; Russian patterns
// cover hh.ru.
const LOCATION_PATTERNS: readonly RegExp[] = [
  new RegExp(
    `\\bmust\\s+be\\s+(?:based|located|resident|residing)\\s+in\\s+(${LATIN_NAMES})\\b`,
    'i',
  ),
  new RegExp(`\\bmust\\s+(?:reside|live)\\s+in\\s+(${LATIN_NAMES})\\b`, 'i'),
  new RegExp(
    `\\bcandidates?\\s+must\\s+be\\s+located\\s+in\\s+(${LATIN_NAMES})\\b`,
    'i',
  ),
  new RegExp(`\\bmust\\s+be\\s+an?\\s+(${LATIN_NAMES})\\s+citizen\\b`, 'i'),
  new RegExp(`\\b(${LATIN_NAMES})\\s+citizens?\\s+only\\b`, 'i'),
  new RegExp(
    `прожива(?:ни[ея]|ть)\\s+(?:только\\s+)?(?:на\\s+территории\\s+|в\\s+)(${CYRILLIC_NAMES})`,
    'i',
  ),
  new RegExp(
    `необходимо\\s+находиться\\s+(?:на\\s+территории\\s+|в\\s+)(${CYRILLIC_NAMES})`,
    'i',
  ),
  new RegExp(`только\\s+(?:для\\s+)?резиденты?\\s+(${CYRILLIC_NAMES})`, 'i'),
  new RegExp(`гражданство\\s+(${CYRILLIC_NAMES})\\s+обязательно`, 'i'),
  new RegExp(
    `работа\\s+возможна\\s+только\\s+(?:на\\s+территории\\s+|в\\s+)(${CYRILLIC_NAMES})`,
    'i',
  ),
];

// Phrases that unambiguously imply Russia without naming it as a place — no capture
// group needed. "ТК РФ" (Russian Federation Labor Code) is a common hh.ru marker for
// formal employment that requires being legally employed in Russia.
// No \b here: JS's \b treats Cyrillic letters as non-word characters, so it doesn't
// work reliably around Cyrillic text (confirmed: \bпо\b fails to match at all).
const RUSSIA_ONLY_PATTERNS: readonly RegExp[] = [/по\s+тк\s+рф/i];

// Returns a canonical country code (e.g. "US", "RU", "UA") for the physical-presence
// requirement stated in the text, or null if no such requirement is stated (or the
// mentioned location isn't a recognized country) — permissive by default.
export function extractRequiredCountry(text: string): string | null {
  if (RUSSIA_ONLY_PATTERNS.some((pattern) => pattern.test(text))) {
    return 'RU';
  }

  for (const pattern of LOCATION_PATTERNS) {
    const match = pattern.exec(text);
    if (!match) continue;

    const country = COUNTRY_ALIASES[match[1].trim().toLowerCase()];
    if (country) return country;
  }
  return null;
}
