import { getInitDataRaw } from './telegram';
import type { FiltersState, Job, ParseStatus, SourceStatus } from './types';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const initDataRaw = getInitDataRaw();
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      'X-Telegram-Init-Data': initDataRaw ?? '',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      (body as { message?: string } | null)?.message ?? response.statusText;
    throw new ApiError(message, response.status, body);
  }
  return response.json() as Promise<T>;
}

export function getJobs(): Promise<Job[]> {
  return request<Job[]>('/api/jobs');
}

export function getFilters(): Promise<FiltersState> {
  return request<FiltersState>('/api/filters');
}

export function updateFilters(changes: {
  includeKeywords?: string[];
  excludeKeywords?: string[];
}): Promise<FiltersState> {
  return request<FiltersState>('/api/filters', {
    method: 'PUT',
    body: JSON.stringify(changes),
  });
}

export function updateSource(
  name: string,
  enabled: boolean,
): Promise<SourceStatus> {
  return request<SourceStatus>(`/api/sources/${encodeURIComponent(name)}`, {
    method: 'PUT',
    body: JSON.stringify({ enabled }),
  });
}

export function getParseStatus(): Promise<ParseStatus> {
  return request<ParseStatus>('/api/parse/status');
}

export function triggerParse(): Promise<ParseStatus> {
  return request<ParseStatus>('/api/parse', { method: 'POST' });
}
