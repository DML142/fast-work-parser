import { Test } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { HhAdapter } from './hh.adapter';

const DETAIL_URL = 'https://hh.ru/vacancy/136400949';

const LISTING_HTML = `
<div data-qa="vacancy-serp__results">
  <article data-qa="vacancy-serp__vacancy">
    <a data-qa="serp-item__title" href="${DETAIL_URL}?query=React&amp;hhtmFrom=vacancy_search_list">
      <span data-qa="serp-item__title-text">Senior Frontend Developer (React)</span>
    </a>
    <div data-qa="vacancy-label-work-schedule-remote">Можно удалённо</div>
    <img data-qa="vacancy-serp__vacancy-employer-logo-image-small" src="https://img.hhcdn.ru/employer-logo-round/6647499.jpeg" alt="" />
    <a data-qa="vacancy-serp__vacancy-employer" href="#">
      <span data-qa="vacancy-serp__vacancy-employer-text">ООО Рога и Копыта</span>
    </a>
    <div data-qa="vacancy-serp__vacancy-address">Москва</div>
  </article>
</div>`;

const DETAIL_HTML = `
<div data-qa="vacancy-description">
  <p>We are looking for a Senior Frontend Developer with React experience.</p>
</div>`;

function respond(data: string) {
  return of({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
  } as AxiosResponse<string>);
}

async function createAdapter(httpService: { get: jest.Mock }) {
  const module = await Test.createTestingModule({
    providers: [HhAdapter, { provide: HttpService, useValue: httpService }],
  }).compile();

  return module.get(HhAdapter);
}

describe('HhAdapter', () => {
  it('scrapes listings and enriches each with the full description from its detail page', async () => {
    const httpService = {
      get: jest.fn((url: string) =>
        url.startsWith('https://hh.ru/search/vacancy')
          ? respond(LISTING_HTML)
          : respond(DETAIL_HTML),
      ),
    };

    const adapter = await createAdapter(httpService);
    const jobs = await adapter.fetchJobs();

    expect(httpService.get.mock.calls[0][0]).toContain(
      'https://hh.ru/search/vacancy',
    );
    expect(adapter.name).toBe('hh.ru');
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      title: 'Senior Frontend Developer (React)',
      company: 'ООО Рога и Копыта',
      href: DETAIL_URL,
      logoUrl: 'https://img.hhcdn.ru/employer-logo-round/6647499.jpeg',
      location: 'Москва',
      isRemote: true,
      description:
        'We are looking for a Senior Frontend Developer with React experience.',
    });
  });

  it('omits logoUrl when a listing has no employer logo image', async () => {
    const listingWithoutLogo = LISTING_HTML.replace(
      /<img data-qa="vacancy-serp__vacancy-employer-logo-image-small"[^>]*\/>\s*/,
      '',
    );
    const httpService = {
      get: jest.fn((url: string) =>
        url.startsWith('https://hh.ru/search/vacancy')
          ? respond(listingWithoutLogo)
          : respond(DETAIL_HTML),
      ),
    };

    const adapter = await createAdapter(httpService);
    const jobs = await adapter.fetchJobs();

    expect(jobs[0].logoUrl).toBeUndefined();
  });

  it('falls back to an empty description when a detail-page fetch fails', async () => {
    const httpService = {
      get: jest.fn((url: string) => {
        if (url.startsWith('https://hh.ru/search/vacancy')) {
          return respond(LISTING_HTML);
        }
        return throwError(() => new Error('network down'));
      }),
    };

    const adapter = await createAdapter(httpService);
    const jobs = await adapter.fetchJobs();

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({ description: '' });
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
