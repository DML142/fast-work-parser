import { Injectable } from '@nestjs/common';

export type ParseSourceStatus = 'fetching' | 'done' | 'failed';

export interface ParseSourceActivity {
  source: string;
  status: ParseSourceStatus;
  jobCount: number;
  lastJobTitle: string | null;
}

// In-memory only: this is a "what's happening right now" view for the mini app
// while a parse run is in flight, not a persisted audit log. Grouped per source
// (rather than one flat list) so a source with many jobs can't push another
// source's progress out of view, and so the mini app can render one line per
// source instead of a long, hard-to-scan job-title transcript.
@Injectable()
export class ParseActivityLog {
  private sources = new Map<string, ParseSourceActivity>();
  private running = false;

  start(): void {
    this.sources = new Map();
    this.running = true;
  }

  finish(): void {
    this.running = false;
  }

  startSource(source: string): void {
    this.sources.set(source, {
      source,
      status: 'fetching',
      jobCount: 0,
      lastJobTitle: null,
    });
  }

  recordJob(source: string, title: string): void {
    const entry = this.sources.get(source);
    if (!entry) {
      return;
    }
    entry.jobCount += 1;
    entry.lastJobTitle = title;
  }

  finishSource(source: string): void {
    const entry = this.sources.get(source);
    if (entry) {
      entry.status = 'done';
    }
  }

  failSource(source: string): void {
    const entry = this.sources.get(source);
    if (entry) {
      entry.status = 'failed';
    }
  }

  snapshot(): { parsing: boolean; sources: ParseSourceActivity[] } {
    return {
      parsing: this.running,
      sources: [...this.sources.values()].map((entry) => ({ ...entry })),
    };
  }
}
