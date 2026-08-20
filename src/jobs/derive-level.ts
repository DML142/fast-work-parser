export type JobLevel = 'junior' | 'middle' | 'senior' | 'lead';

const LEVEL_KEYWORDS: Record<JobLevel, RegExp> = {
  lead: /\b(lead)\b|(?<![а-яё])(лид)/i,
  senior: /\b(senior)\b|(?<![а-яё])(сеньор|синьор)/i,
  middle: /\b(middle)\b|(?<![а-яё])(миддл|мидл)/i,
  junior: /\b(junior)\b|(?<![а-яё])(джун)/i,
};

// Checked highest-seniority-first so a posting mentioning more than one
// level (e.g. "Senior to Lead") reports the more senior match.
const LEVEL_PRIORITY: JobLevel[] = ['lead', 'senior', 'middle', 'junior'];

export function deriveLevel(
  title: string,
  description: string,
): JobLevel | null {
  const haystack = `${title} ${description}`;
  for (const level of LEVEL_PRIORITY) {
    if (LEVEL_KEYWORDS[level].test(haystack)) {
      return level;
    }
  }
  return null;
}
