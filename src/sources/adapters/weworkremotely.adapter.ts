import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import Parser from 'rss-parser';
import {
  JobSource,
  RawJob,
} from '../../common/interfaces/job-source.interface';

const WWR_RSS_URL =
  'https://weworkremotely.com/categories/remote-programming-jobs.rss';

@Injectable()
export class WeWorkRemotelyAdapter implements JobSource {
  name = 'WeWorkRemotely';

  private readonly parser = new Parser({
    customFields: { item: ['region'] },
  });

  constructor(private readonly http: HttpService) {}

  async fetchJobs(): Promise<RawJob[]> {
    const response = await firstValueFrom(this.http.get<string>(WWR_RSS_URL));
    const feed = await this.parser.parseString(response.data);

    return feed.items.map((item) => ({ ...item }));
  }
}
