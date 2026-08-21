import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as cheerio from 'cheerio';
import {
  JobSource,
  RawJob,
} from '../../common/interfaces/job-source.interface';

const DJINNI_JOBS_URL = 'https://djinni.co/jobs/';

@Injectable()
export class DjinniAdapter implements JobSource {
  name = 'Djinni';

  private readonly logger = new Logger(DjinniAdapter.name);

  constructor(private readonly http: HttpService) {}

  // Only the first listing page is fetched (no pagination loop) to stay light on Djinni's servers.
  async fetchJobs(): Promise<RawJob[]> {
    const response = await firstValueFrom(
      this.http.get<string>(DJINNI_JOBS_URL),
    );
    const $ = cheerio.load(response.data);

    const listings = $('.job-item')
      .toArray()
      .map((el): RawJob => {
        const card = $(el);
        const link = card.find('.job_item__header-link').first();
        const href = link.attr('href');

        return {
          title: card.find('.job-item__position').first().text().trim(),
          company: card
            .find('.job_item__header-link span.small')
            .first()
            .text()
            .trim(),
          href: href ? new URL(href, DJINNI_JOBS_URL).toString() : '',
          logoUrl: card
            .find('.userpic-wrapper img.userpic-image')
            .first()
            .attr('src'),
          location: card.find('.location-text').first().text().trim(),
          // The listing page only renders a ~500-char truncated snippet;
          // fetchFullDescription replaces it with the real description below.
          description: card.find('.js-truncated-text').first().text().trim(),
        };
      });

    const jobs: RawJob[] = [];
    for (const listing of listings) {
      jobs.push(await this.withFullDescription(listing));
    }
    return jobs;
  }

  // Fetched sequentially (not Promise.all) and one request per job, to stay light on Djinni's servers.
  private async withFullDescription(listing: RawJob): Promise<RawJob> {
    const href = listing.href;
    if (typeof href !== 'string' || href === '') {
      return listing;
    }

    try {
      const response = await firstValueFrom(this.http.get<string>(href));
      const $ = cheerio.load(response.data);
      const description = $('.job-post__description')
        .first()
        .text()
        .replace(/\s+/g, ' ')
        .trim();

      return description === '' ? listing : { ...listing, description };
    } catch (error) {
      this.logger.warn(
        `Failed to fetch full description from ${href}, falling back to the listing snippet`,
        error as Error,
      );
      return listing;
    }
  }
}
