import { Test } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { WeWorkRemotelyAdapter } from './weworkremotely.adapter';

const SAMPLE_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>We Work Remotely</title>
    <link>https://weworkremotely.com/categories/remote-programming-jobs.rss</link>
    <description>Remote programming jobs</description>
    <item>
      <title>Stripe: Staff Backend Engineer</title>
      <link>https://weworkremotely.com/remote-jobs/stripe-staff-backend-engineer</link>
      <region>Anywhere in the World</region>
      <category>Full-Stack Programming</category>
      <pubDate>Wed, 22 Jul 2026 07:03:14 +0000</pubDate>
      <description>&lt;p&gt;Build payments infrastructure.&lt;/p&gt;</description>
      <guid>https://weworkremotely.com/remote-jobs/stripe-staff-backend-engineer</guid>
    </item>
  </channel>
</rss>`;

describe('WeWorkRemotelyAdapter', () => {
  it('fetches and parses the WeWorkRemotely programming RSS feed', async () => {
    const mockResponse = {
      data: SAMPLE_RSS,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    } as AxiosResponse<string>;

    const httpService = { get: jest.fn().mockReturnValue(of(mockResponse)) };

    const module = await Test.createTestingModule({
      providers: [
        WeWorkRemotelyAdapter,
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const adapter = module.get(WeWorkRemotelyAdapter);
    const jobs = await adapter.fetchJobs();

    expect(httpService.get).toHaveBeenCalledWith(
      'https://weworkremotely.com/categories/remote-programming-jobs.rss',
    );
    expect(adapter.name).toBe('WeWorkRemotely');
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      title: 'Stripe: Staff Backend Engineer',
      link: 'https://weworkremotely.com/remote-jobs/stripe-staff-backend-engineer',
      region: 'Anywhere in the World',
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
        WeWorkRemotelyAdapter,
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const adapter = module.get(WeWorkRemotelyAdapter);

    await expect(adapter.fetchJobs()).rejects.toThrow('network down');
  });
});
