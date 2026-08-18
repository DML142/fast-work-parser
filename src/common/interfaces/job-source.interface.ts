/** Raw, source-specific payload before normalization into a JobEntity. */
export type RawJob = Record<string, unknown>;

export interface JobSource {
  name: string;
  fetchJobs(): Promise<RawJob[]>;
}
