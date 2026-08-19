import { Test } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { DjinniAdapter } from './djinni.adapter';

const SAMPLE_HTML = `
<ul class="list-unstyled list-jobs mb-4">
  <div id="job-item-843917" class="job-item card-link fs-5 mb-4 rounded-2 p-2">
    <div class="d-flex flex-column gap-1">
      <a href="/jobs/843917-senior-react-developer/" class="job_item__header-link d-flex flex-column gap-1 text-decoration-none">
        <header class="row gx-2 align-items-start">
          <div class="col">
            <h2 class="job-item__position fs-4 m-0 mb-1">Senior React Developer</h2>
            <div class="d-flex flex-wrap align-items-center column-gap-1">
              <span class="small text-gray-800 opacity-75 font-weight-500">N-iX</span>
            </div>
          </div>
        </header>
      </a>
      <div class="fw-medium d-flex flex-wrap align-items-center column-gap-1">
        <span><span class="location-text">Україна</span></span>
      </div>
      <div id="job-description-843917">
        <span class="js-truncated-text">We are looking for a Senior React Developer...</span>
      </div>
    </div>
  </div>
</ul>`;

describe('DjinniAdapter', () => {
  it('scrapes job listings from the Djinni jobs page', async () => {
    const mockResponse = {
      data: SAMPLE_HTML,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    } as AxiosResponse<string>;

    const httpService = { get: jest.fn().mockReturnValue(of(mockResponse)) };

    const module = await Test.createTestingModule({
      providers: [
        DjinniAdapter,
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const adapter = module.get(DjinniAdapter);
    const jobs = await adapter.fetchJobs();

    expect(httpService.get).toHaveBeenCalledWith('https://djinni.co/jobs/');
    expect(adapter.name).toBe('Djinni');
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      title: 'Senior React Developer',
      company: 'N-iX',
      href: 'https://djinni.co/jobs/843917-senior-react-developer/',
      location: 'Україна',
      description: 'We are looking for a Senior React Developer...',
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
        DjinniAdapter,
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const adapter = module.get(DjinniAdapter);

    await expect(adapter.fetchJobs()).rejects.toThrow('network down');
  });
});
