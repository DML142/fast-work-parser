import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as cheerio from 'cheerio';
import {
  JobSource,
  RawJob,
} from '../../common/interfaces/job-source.interface';

// Rough query-side narrowing only — the real hard filter is StackMatchRule downstream,
// since hh.ru's `text=` search doesn't reliably honor OR/quoting as strict boolean logic.
const HH_SEARCH_TERMS = [
  'React',
  '"Next.js"',
  'NestJS',
  'TypeScript',
  '"Node.js"',
  'JavaScript',
];
const HH_SEARCH_URL = `https://hh.ru/search/vacancy?text=${encodeURIComponent(
  HH_SEARCH_TERMS.join(' OR '),
)}&schedule=remote`;

// hh.ru's WAF rejects axios's default User-Agent (406) — a browser-like one is required.
const HH_REQUEST_CONFIG = {
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  },
};

@Injectable()
export class HhAdapter implements JobSource {
  name = 'hh.ru';

  private readonly logger = new Logger(HhAdapter.name);

  constructor(private readonly http: HttpService) {}

  // Only the first results page is fetched (no pagination loop) to stay light on hh.ru's servers.
  async fetchJobs(): Promise<RawJob[]> {
    const response = await firstValueFrom(
      this.http.get<string>(HH_SEARCH_URL, HH_REQUEST_CONFIG),
    );
    const $ = cheerio.load(response.data);

    const listings = $('[data-qa="vacancy-serp__vacancy"]')
      .toArray()
      .map((el): RawJob => {
        const card = $(el);
        const link = card.find('[data-qa="serp-item__title"]').first();
        const href = link.attr('href');

        return {
          title: card
            .find('[data-qa="serp-item__title-text"]')
            .first()
            .text()
            .trim(),
          company: card
            .find('[data-qa="vacancy-serp__vacancy-employer-text"]')
            .first()
            .text()
            .trim(),
          href: href ? href.split('?')[0] : '',
          logoUrl: card
            .find('[data-qa="vacancy-serp__vacancy-employer-logo-image-small"]')
            .first()
            .attr('src'),
          location: card
            .find('[data-qa="vacancy-serp__vacancy-address"]')
            .first()
            .text()
            .trim(),
          isRemote:
            card.find('[data-qa="vacancy-label-work-schedule-remote"]').length >
            0,
          // The listing page renders no description at all; withFullDescription
          // below fills this in from the vacancy's own detail page.
          description: '',
        };
      });

    const jobs: RawJob[] = [];
    for (const listing of listings) {
      jobs.push(await this.withFullDescription(listing));
    }
    return jobs;
  }

  // Fetched sequentially (not Promise.all) and one request per job, to stay light on hh.ru's servers.
  private async withFullDescription(listing: RawJob): Promise<RawJob> {
    const href = listing.href;
    if (typeof href !== 'string' || href === '') {
      return listing;
    }

    try {
      const response = await firstValueFrom(
        this.http.get<string>(href, HH_REQUEST_CONFIG),
      );
      const $ = cheerio.load(response.data);
      const description = $('[data-qa="vacancy-description"]')
        .first()
        .text()
        .replace(/\s+/g, ' ')
        .trim();

      return description === '' ? listing : { ...listing, description };
    } catch (error) {
      this.logger.warn(
        `Failed to fetch full description from ${href}, falling back to no description`,
        error as Error,
      );
      return listing;
    }
  }
}
