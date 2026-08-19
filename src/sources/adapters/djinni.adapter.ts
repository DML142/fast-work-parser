import { Injectable } from '@nestjs/common';
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

  constructor(private readonly http: HttpService) {}

  // Only the first listing page is fetched (no pagination loop) to stay light on Djinni's servers.
  async fetchJobs(): Promise<RawJob[]> {
    const response = await firstValueFrom(
      this.http.get<string>(DJINNI_JOBS_URL),
    );
    const $ = cheerio.load(response.data);

    return $('.job-item')
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
          location: card.find('.location-text').first().text().trim(),
          description: card.find('.js-truncated-text').first().text().trim(),
        };
      });
  }
}
