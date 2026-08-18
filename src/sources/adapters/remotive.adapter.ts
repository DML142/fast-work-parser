import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  JobSource,
  RawJob,
} from '../../common/interfaces/job-source.interface';

const REMOTIVE_API_URL = 'https://remotive.com/api/remote-jobs';

interface RemotiveApiResponse {
  jobs: RawJob[];
}

@Injectable()
export class RemotiveAdapter implements JobSource {
  name = 'Remotive';

  constructor(private readonly http: HttpService) {}

  async fetchJobs(): Promise<RawJob[]> {
    const response = await firstValueFrom(
      this.http.get<RemotiveApiResponse>(REMOTIVE_API_URL),
    );

    return response.data.jobs;
  }
}
