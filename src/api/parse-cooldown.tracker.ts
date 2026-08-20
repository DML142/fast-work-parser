import { Injectable } from '@nestjs/common';

export const PARSE_COOLDOWN_MS = 60_000;

@Injectable()
export class ParseCooldownTracker {
  private lastTriggeredAt: number | null = null;

  // `now` is injectable so tests can control elapsed time deterministically
  // instead of sleeping real milliseconds.
  constructor(private readonly now: () => number = Date.now) {}

  remainingSeconds(): number {
    if (this.lastTriggeredAt === null) {
      return 0;
    }
    const remainingMs = PARSE_COOLDOWN_MS - (this.now() - this.lastTriggeredAt);
    return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
  }

  tryAcquire(): boolean {
    if (this.remainingSeconds() > 0) {
      return false;
    }
    this.lastTriggeredAt = this.now();
    return true;
  }
}
