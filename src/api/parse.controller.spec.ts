import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ParseController } from './parse.controller';
import { SchedulerService } from '../scheduler/scheduler.service';
import {
  ParseActivityLog,
  ParseSourceActivity,
} from '../scheduler/parse-activity-log';
import { FilterConfigService } from '../filter/filter-config.service';
import { ParseCooldownTracker } from './parse-cooldown.tracker';

function fakeSchedulerService(): {
  service: SchedulerService;
  runPipeline: jest.Mock;
} {
  const runPipeline = jest.fn().mockResolvedValue(undefined);
  return {
    service: { runPipeline } as unknown as SchedulerService,
    runPipeline,
  };
}

function fakeFilterConfigService(
  lastParsedAt: Date | null,
): FilterConfigService {
  return { lastParsedAt } as unknown as FilterConfigService;
}

function fakeCooldownTracker(overrides: {
  tryAcquire?: boolean;
  remainingSeconds?: number;
}): ParseCooldownTracker {
  return {
    tryAcquire: jest.fn().mockReturnValue(overrides.tryAcquire ?? true),
    remainingSeconds: jest
      .fn()
      .mockReturnValue(overrides.remainingSeconds ?? 0),
  } as unknown as ParseCooldownTracker;
}

function fakeParseActivityLog(
  overrides: {
    parsing?: boolean;
    sources?: ParseSourceActivity[];
  } = {},
): ParseActivityLog {
  return {
    snapshot: jest.fn().mockReturnValue({
      parsing: overrides.parsing ?? false,
      sources: overrides.sources ?? [],
    }),
  } as unknown as ParseActivityLog;
}

describe('ParseController', () => {
  it('reports last parsed time, cooldown remaining, and current activity on status', () => {
    const { service: schedulerService } = fakeSchedulerService();
    const controller = new ParseController(
      schedulerService,
      fakeFilterConfigService(new Date('2026-08-20T12:00:00.000Z')),
      fakeCooldownTracker({ remainingSeconds: 15 }),
      fakeParseActivityLog({
        parsing: true,
        sources: [
          {
            source: 'hh.ru',
            status: 'fetching',
            jobCount: 0,
            lastJobTitle: null,
          },
        ],
      }),
    );

    expect(controller.status()).toEqual({
      lastParsedAt: '2026-08-20T12:00:00.000Z',
      cooldownRemainingSeconds: 15,
      parsing: true,
      sources: [
        {
          source: 'hh.ru',
          status: 'fetching',
          jobCount: 0,
          lastJobTitle: null,
        },
      ],
    });
  });

  it('reports a null lastParsedAt before any run has happened', () => {
    const { service: schedulerService } = fakeSchedulerService();
    const controller = new ParseController(
      schedulerService,
      fakeFilterConfigService(null),
      fakeCooldownTracker({ remainingSeconds: 0 }),
      fakeParseActivityLog(),
    );

    expect(controller.status().lastParsedAt).toBeNull();
  });

  it('runs the pipeline and returns fresh status when the cooldown allows it', () => {
    const { service: schedulerService, runPipeline } = fakeSchedulerService();
    const controller = new ParseController(
      schedulerService,
      fakeFilterConfigService(null),
      fakeCooldownTracker({ tryAcquire: true }),
      fakeParseActivityLog(),
    );

    controller.trigger();

    expect(runPipeline).toHaveBeenCalled();
  });

  it('rejects with 429 and the remaining cooldown when triggered too soon', () => {
    const { service: schedulerService, runPipeline } = fakeSchedulerService();
    const controller = new ParseController(
      schedulerService,
      fakeFilterConfigService(null),
      fakeCooldownTracker({ tryAcquire: false, remainingSeconds: 42 }),
      fakeParseActivityLog(),
    );

    try {
      controller.trigger();
      throw new Error('expected trigger() to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(
        HttpStatus.TOO_MANY_REQUESTS,
      );
      expect((error as HttpException).getResponse()).toEqual({
        cooldownRemainingSeconds: 42,
      });
    }

    expect(runPipeline).not.toHaveBeenCalled();
  });

  it('returns the current status without waiting for the run to finish', async () => {
    let finishPipeline!: () => void;
    const pipelineRun = new Promise<void>((resolve) => {
      finishPipeline = resolve;
    });
    const runPipeline = jest.fn().mockReturnValue(pipelineRun);
    const controller = new ParseController(
      { runPipeline } as unknown as SchedulerService,
      fakeFilterConfigService(new Date('2026-08-20T12:00:00.000Z')),
      fakeCooldownTracker({ tryAcquire: true, remainingSeconds: 60 }),
      fakeParseActivityLog({ parsing: true }),
    );

    const response = controller.trigger();

    expect(runPipeline).toHaveBeenCalled();
    expect(response).toEqual({
      lastParsedAt: '2026-08-20T12:00:00.000Z',
      cooldownRemainingSeconds: 60,
      parsing: true,
      sources: [],
    });

    finishPipeline();
    await pipelineRun;
  });

  it('logs rather than throws when the background run fails', async () => {
    const runPipeline = jest
      .fn()
      .mockRejectedValue(new Error('pipeline exploded'));
    const controller = new ParseController(
      { runPipeline } as unknown as SchedulerService,
      fakeFilterConfigService(null),
      fakeCooldownTracker({ tryAcquire: true }),
      fakeParseActivityLog(),
    );
    const logError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    expect(() => controller.trigger()).not.toThrow();
    await new Promise((resolve) => setImmediate(resolve));

    expect(logError).toHaveBeenCalledWith(
      'Manual parse run failed',
      expect.any(Error),
    );
    logError.mockRestore();
  });
});
