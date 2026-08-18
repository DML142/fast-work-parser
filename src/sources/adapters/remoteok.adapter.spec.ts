import { Test } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { AxiosResponse } from 'axios';
import { RemoteOkAdapter } from './remoteok.adapter';

describe('RemoteOkAdapter', () => {
  it('fetches jobs from the RemoteOK API and filters out the legal-notice entry', async () => {
    const mockResponse = {
      data: [
        { legal: 'API Terms of Service: please link back to Remote OK.' },
        {
          id: '1136926',
          slug: 'remote-fire-fighter-adani-airport-holdings-ltd-1136926',
          company: 'Adani Airport Holdings Ltd',
          position: 'Fire Fighter',
          tags: ['infosec', 'education'],
          description: '<strong>About Business</strong>',
          location: 'Mangaluru, ',
          url: 'https://remoteok.com/remote-jobs/remote-fire-fighter-adani-airport-holdings-ltd-1136926',
          date: '2026-08-17T17:14:35+00:00',
          salary_min: 150000,
          salary_max: 185000,
        },
      ],
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    } as unknown as AxiosResponse<unknown[]>;

    const httpService = { get: jest.fn().mockReturnValue(of(mockResponse)) };

    const module = await Test.createTestingModule({
      providers: [
        RemoteOkAdapter,
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const adapter = module.get(RemoteOkAdapter);
    const jobs = await adapter.fetchJobs();

    expect(httpService.get).toHaveBeenCalledWith('https://remoteok.com/api');
    expect(adapter.name).toBe('RemoteOK');
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({ id: '1136926', position: 'Fire Fighter' });
  });
});
