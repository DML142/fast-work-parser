import { JobSource, RawJob } from './job-source.interface';

class FakeSource implements JobSource {
  name = 'Fake';

  // eslint-disable-next-line @typescript-eslint/require-await
  async fetchJobs(): Promise<RawJob[]> {
    return [{ id: '1', title: 'Fake Job' }];
  }
}

describe('JobSource interface', () => {
  it('allows a concrete adapter to implement fetchJobs', async () => {
    const source = new FakeSource();
    const jobs = await source.fetchJobs();

    expect(source.name).toBe('Fake');
    expect(jobs).toEqual([{ id: '1', title: 'Fake Job' }]);
  });
});
