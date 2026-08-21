import { Injectable } from '@nestjs/common';

export interface ParseActivityEntry {
  source: string;
  message: string;
}

const MAX_ENTRIES = 50;

// In-memory only: this is a "what's happening right now" view for the mini app
// while a parse run is in flight, not a persisted audit log.
@Injectable()
export class ParseActivityLog {
  private entries: ParseActivityEntry[] = [];
  private running = false;

  start(): void {
    this.entries = [];
    this.running = true;
  }

  finish(): void {
    this.running = false;
  }

  record(source: string, message: string): void {
    this.entries.push({ source, message });
    if (this.entries.length > MAX_ENTRIES) {
      this.entries = this.entries.slice(-MAX_ENTRIES);
    }
  }

  snapshot(): { parsing: boolean; activity: ParseActivityEntry[] } {
    return { parsing: this.running, activity: [...this.entries] };
  }
}
