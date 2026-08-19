import { Test } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { RemotiveAdapter } from './remotive.adapter';

describe('RemotiveAdapter', () => {
  it('fetches jobs from the Remotive API', async () => {
    const mockResponse = {
      data: {
        jobs: [
          {
            id: 2091069,
            url: 'https://remotive.com/remote-jobs/medical/patient-care-specialist-2091069',
            title: 'Patient Care Specialist',
            company_name: 'STATLINX',
            category: 'Medical',
            tags: ['research', 'insurance'],
            job_type: 'full_time',
            publication_date: '2026-08-16T14:14:11',
            candidate_required_location: 'USA',
            salary: '$36k',
            description: '<p>Answering inbound calls.</p>',
          },
        ],
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    } as AxiosResponse<{ jobs: unknown[] }>;

    const httpService = { get: jest.fn().mockReturnValue(of(mockResponse)) };

    const module = await Test.createTestingModule({
      providers: [
        RemotiveAdapter,
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const adapter = module.get(RemotiveAdapter);
    const jobs = await adapter.fetchJobs();

    expect(httpService.get).toHaveBeenCalledWith(
      'https://remotive.com/api/remote-jobs',
    );
    expect(adapter.name).toBe('Remotive');
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      id: 2091069,
      title: 'Patient Care Specialist',
    });
  });

  it('propagates an HTTP error instead of swallowing it', async () => {
    const httpService = {
      get: jest
        .fn()
        .mockReturnValue(throwError(() => new Error('network down'))),
    };

    const module = await Test.createTestingModule({
      providers: [
        RemotiveAdapter,
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const adapter = module.get(RemotiveAdapter);

    await expect(adapter.fetchJobs()).rejects.toThrow('network down');
  });
});
