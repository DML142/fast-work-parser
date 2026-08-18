import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  JobSource,
  RawJob,
} from '../../common/interfaces/job-source.interface';

const REMOTEOK_API_URL = 'https://remoteok.com/api';

@Injectable()
export class RemoteOkAdapter implements JobSource {
  name = 'RemoteOK';

  constructor(private readonly http: HttpService) {}

  async fetchJobs(): Promise<RawJob[]> {
    const response = await firstValueFrom(
      this.http.get<unknown[]>(REMOTEOK_API_URL),
    );

    return response.data.filter(
      (item): item is RawJob =>
        typeof item === 'object' && item !== null && 'id' in item,
    );
  }
}
