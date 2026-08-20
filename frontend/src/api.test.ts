import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getFilters,
  getJobs,
  getParseStatus,
  triggerParse,
  updateFilters,
  updateSource,
} from './api';

vi.mock('./telegram', () => ({
  getInitDataRaw: () => 'query_id=abc&user=%7B%7D&hash=deadbeef',
}));

function mockFetchOnce(
  response: Partial<Response> & { json?: () => Promise<unknown> },
): void {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => ({}),
    ...response,
  } as Response);
}

describe('api client', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('attaches the Telegram init data header on every request', async () => {
    mockFetchOnce({ json: async () => [] });
    await getJobs();
    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0] as [string, RequestInit];
    expect(
      (init.headers as Record<string, string>)['X-Telegram-Init-Data'],
    ).toBe('query_id=abc&user=%7B%7D&hash=deadbeef');
  });

  it('getJobs returns the parsed job list', async () => {
    mockFetchOnce({ json: async () => [{ id: '1' }] });
    await expect(getJobs()).resolves.toEqual([{ id: '1' }]);
  });

  it('getFilters calls GET /api/filters', async () => {
    mockFetchOnce({
      json: async () => ({
        includeKeywords: [],
        excludeKeywords: [],
        sources: [],
      }),
    });
    await getFilters();
    const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0] as [string];
    expect(url).toBe('/api/filters');
  });

  it('updateFilters sends a PUT with a JSON body', async () => {
    mockFetchOnce({
      json: async () => ({
        includeKeywords: ['node'],
        excludeKeywords: [],
        sources: [],
      }),
    });
    await updateFilters({ includeKeywords: ['node'] });
    const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0] as [string, RequestInit];
    expect(url).toBe('/api/filters');
    expect(init.method).toBe('PUT');
    expect(init.body).toBe(JSON.stringify({ includeKeywords: ['node'] }));
  });

  it('updateSource PUTs to /api/sources/:name', async () => {
    mockFetchOnce({ json: async () => ({ name: 'RemoteOK', enabled: false }) });
    await updateSource('RemoteOK', false);
    const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0] as [string, RequestInit];
    expect(url).toBe('/api/sources/RemoteOK');
    expect(JSON.parse(init.body as string)).toEqual({ enabled: false });
  });

  it('getParseStatus calls GET /api/parse/status', async () => {
    mockFetchOnce({
      json: async () => ({ lastParsedAt: null, cooldownRemainingSeconds: 0 }),
    });
    await getParseStatus();
    const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0] as [string];
    expect(url).toBe('/api/parse/status');
  });

  it('triggerParse POSTs to /api/parse', async () => {
    mockFetchOnce({
      status: 202,
      json: async () => ({
        lastParsedAt: '2026-08-20T00:00:00.000Z',
        cooldownRemainingSeconds: 60,
      }),
    });
    await triggerParse();
    const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0] as [string, RequestInit];
    expect(url).toBe('/api/parse');
    expect(init.method).toBe('POST');
  });

  it('throws an ApiError carrying the parsed body on a non-ok response', async () => {
    mockFetchOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      json: async () => ({ cooldownRemainingSeconds: 42 }),
    });
    await expect(triggerParse()).rejects.toMatchObject({
      status: 429,
      body: { cooldownRemainingSeconds: 42 },
    });
    expect(triggerParse).toBeDefined(); // sanity: import resolved
  });
});
