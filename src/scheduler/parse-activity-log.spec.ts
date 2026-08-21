import { ParseActivityLog } from './parse-activity-log';

describe('ParseActivityLog', () => {
  it('reports not parsing with no sources before a run has started', () => {
    const log = new ParseActivityLog();

    expect(log.snapshot()).toEqual({ parsing: false, sources: [] });
  });

  it('tracks a source through fetching, job progress, and completion', () => {
    const log = new ParseActivityLog();

    log.start();
    log.startSource('hh.ru');
    log.recordJob('hh.ru', 'Senior React Developer');
    log.recordJob('hh.ru', 'Backend Engineer');
    log.finishSource('hh.ru');

    expect(log.snapshot()).toEqual({
      parsing: true,
      sources: [
        {
          source: 'hh.ru',
          status: 'done',
          jobCount: 2,
          lastJobTitle: 'Backend Engineer',
        },
      ],
    });
  });

  it('marks a source as failed without affecting other sources', () => {
    const log = new ParseActivityLog();

    log.start();
    log.startSource('hh.ru');
    log.startSource('Djinni');
    log.recordJob('Djinni', 'Senior React Developer');
    log.finishSource('Djinni');
    log.failSource('hh.ru');

    expect(log.snapshot().sources).toEqual([
      { source: 'hh.ru', status: 'failed', jobCount: 0, lastJobTitle: null },
      {
        source: 'Djinni',
        status: 'done',
        jobCount: 1,
        lastJobTitle: 'Senior React Developer',
      },
    ]);
  });

  it('reports parsing false again once finish is called', () => {
    const log = new ParseActivityLog();

    log.start();
    log.finish();

    expect(log.snapshot().parsing).toBe(false);
  });

  it('clears previous sources when a new run starts', () => {
    const log = new ParseActivityLog();

    log.start();
    log.startSource('hh.ru');
    log.finishSource('hh.ru');
    log.finish();

    log.start();

    expect(log.snapshot()).toEqual({ parsing: true, sources: [] });
  });

  it('ignores job/finish/fail calls for a source that was never started', () => {
    const log = new ParseActivityLog();

    log.start();
    log.recordJob('Unknown', 'Some Job');
    log.finishSource('Unknown');
    log.failSource('Unknown');

    expect(log.snapshot().sources).toEqual([]);
  });
});
