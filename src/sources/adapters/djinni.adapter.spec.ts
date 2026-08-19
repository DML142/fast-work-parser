import { Test } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { DjinniAdapter } from './djinni.adapter';

const LISTING_URL = 'https://djinni.co/jobs/';
const DETAIL_URL = 'https://djinni.co/jobs/843917-senior-react-developer/';

const LISTING_HTML = `
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

const DETAIL_HTML = `
<div class="mb-4 job-post__description">
  <p>We are looking for a Senior React Developer to join our team.</p>
  <p>Requirements: 5+ years with React, TypeScript, and Redux.</p>
</div>`;

function mockHttpFor(responses: Record<string, string>) {
  return {
    get: jest.fn((url: string) => {
      const data = responses[url];
      if (data === undefined) {
        return throwError(() => new Error(`unexpected URL: ${url}`));
      }
      return of({
        data,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      } as AxiosResponse<string>);
    }),
  };
}

async function createAdapter(httpService: { get: jest.Mock }) {
  const module = await Test.createTestingModule({
    providers: [DjinniAdapter, { provide: HttpService, useValue: httpService }],
  }).compile();

  return module.get(DjinniAdapter);
}

describe('DjinniAdapter', () => {
  it('scrapes listings and enriches each with the full description from its detail page', async () => {
    const httpService = mockHttpFor({
      [LISTING_URL]: LISTING_HTML,
      [DETAIL_URL]: DETAIL_HTML,
    });

    const adapter = await createAdapter(httpService);
    const jobs = await adapter.fetchJobs();

    expect(adapter.name).toBe('Djinni');
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      title: 'Senior React Developer',
      company: 'N-iX',
      href: DETAIL_URL,
      location: 'Україна',
      description:
        'We are looking for a Senior React Developer to join our team. Requirements: 5+ years with React, TypeScript, and Redux.',
    });
  });

  it('falls back to the truncated listing description when a detail-page fetch fails', async () => {
    const httpService = {
      get: jest.fn((url: string) => {
        if (url === LISTING_URL) {
          return of({
            data: LISTING_HTML,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {},
          } as AxiosResponse<string>);
        }
        return throwError(() => new Error('network down'));
      }),
    };

    const adapter = await createAdapter(httpService);
    const jobs = await adapter.fetchJobs();

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      description: 'We are looking for a Senior React Developer...',
    });
  });

  it('propagates an HTTP error instead of swallowing it when the listing page fetch fails', async () => {
    const httpService = {
      get: jest
        .fn()
        .mockReturnValue(throwError(() => new Error('network down'))),
    };

    const adapter = await createAdapter(httpService);

    await expect(adapter.fetchJobs()).rejects.toThrow('network down');
  });
});
