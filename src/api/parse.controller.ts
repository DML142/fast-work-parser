import {
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SchedulerService } from '../scheduler/scheduler.service';
import { FilterConfigService } from '../filter/filter-config.service';
import { ParseCooldownTracker } from './parse-cooldown.tracker';
import { TelegramInitDataGuard } from './telegram-init-data.guard';

interface ParseStatusResponse {
  lastParsedAt: string | null;
  cooldownRemainingSeconds: number;
}

@UseGuards(TelegramInitDataGuard)
@Controller('api/parse')
export class ParseController {
  private readonly logger = new Logger(ParseController.name);

  constructor(
    private readonly schedulerService: SchedulerService,
    private readonly filterConfigService: FilterConfigService,
    private readonly cooldownTracker: ParseCooldownTracker,
  ) {}

  @Get('status')
  status(): ParseStatusResponse {
    return {
      lastParsedAt:
        this.filterConfigService.lastParsedAt?.toISOString() ?? null,
      cooldownRemainingSeconds: this.cooldownTracker.remainingSeconds(),
    };
  }

  // Fire-and-forget: a full run can outlast both the HTTP request and the
  // cooldown window, so the response must not wait on it.
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  trigger(): ParseStatusResponse {
    if (!this.cooldownTracker.tryAcquire()) {
      throw new HttpException(
        { cooldownRemainingSeconds: this.cooldownTracker.remainingSeconds() },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    this.schedulerService.runPipeline().catch((error: Error) => {
      this.logger.error('Manual parse run failed', error);
    });
    return this.status();
  }
}
