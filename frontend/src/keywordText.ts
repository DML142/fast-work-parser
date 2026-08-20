export function keywordsToText(keywords: string[]): string {
  return keywords.join('\n');
}

export function textToKeywords(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}
