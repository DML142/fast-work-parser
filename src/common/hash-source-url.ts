import { createHash } from 'node:crypto';

export function hashSourceUrl(sourceUrl: string): string {
  return createHash('sha256').update(sourceUrl).digest('hex');
}
