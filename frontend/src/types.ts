export type JobLevel = 'junior' | 'middle' | 'senior' | 'lead';
export type RemoteType = 'remote' | 'hybrid' | 'onsite' | 'unknown';
export type ContractType = 'full-time' | 'contract' | 'unknown';

export interface Job {
  id: string;
  source: string;
  title: string;
  company: string;
  companyLogoUrl: string | null;
  description: string;
  stack: string[];
  location: string;
  remoteType: RemoteType;
  contractType: ContractType;
  compensation: string | null;
  sourceUrl: string;
  postedAt: string | null;
  fetchedAt: string;
  level: JobLevel | null;
}

export interface SourceStatus {
  name: string;
  enabled: boolean;
}

export interface FiltersState {
  includeKeywords: string[];
  excludeKeywords: string[];
  sources: SourceStatus[];
}

export interface ParseStatus {
  lastParsedAt: string | null;
  cooldownRemainingSeconds: number;
}
