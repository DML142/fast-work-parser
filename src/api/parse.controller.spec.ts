import { HttpException, HttpStatus } from '@nestjs/common';
import { ParseController } from './parse.controller';
import { SchedulerService } from '../scheduler/scheduler.service';
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

describe('ParseController', () => {
  it('reports last parsed time and cooldown remaining on status', () => {
    const { service: schedulerService } = fakeSchedulerService();
    const controller = new ParseController(
      schedulerService,
      fakeFilterConfigService(new Date('2026-08-20T12:00:00.000Z')),
      fakeCooldownTracker({ remainingSeconds: 15 }),
    );

    expect(controller.status()).toEqual({
      lastParsedAt: '2026-08-20T12:00:00.000Z',
      cooldownRemainingSeconds: 15,
    });
  });

  it('reports a null lastParsedAt before any run has happened', () => {
    const { service: schedulerService } = fakeSchedulerService();
    const controller = new ParseController(
      schedulerService,
      fakeFilterConfigService(null),
      fakeCooldownTracker({ remainingSeconds: 0 }),
    );

    expect(controller.status().lastParsedAt).toBeNull();
  });

  it('runs the pipeline and returns fresh status when the cooldown allows it', async () => {
    const { service: schedulerService, runPipeline } = fakeSchedulerService();
    const controller = new ParseController(
      schedulerService,
      fakeFilterConfigService(null),
      fakeCooldownTracker({ tryAcquire: true }),
    );

    await controller.trigger();

    expect(runPipeline).toHaveBeenCalled();
  });

  it('rejects with 429 and the remaining cooldown when triggered too soon', async () => {
    const { service: schedulerService, runPipeline } = fakeSchedulerService();
    const controller = new ParseController(
      schedulerService,
      fakeFilterConfigService(null),
      fakeCooldownTracker({ tryAcquire: false, remainingSeconds: 42 }),
    );

    try {
      await controller.trigger();
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
});
