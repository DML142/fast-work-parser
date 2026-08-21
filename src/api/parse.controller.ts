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
import {
  ParseSourceActivity,
  ParseActivityLog,
} from '../scheduler/parse-activity-log';
import { FilterConfigService } from '../filter/filter-config.service';
import { ParseCooldownTracker } from './parse-cooldown.tracker';
import { TelegramInitDataGuard } from './telegram-init-data.guard';

interface ParseStatusResponse {
  lastParsedAt: string | null;
  cooldownRemainingSeconds: number;
  parsing: boolean;
  sources: ParseSourceActivity[];
}

@UseGuards(TelegramInitDataGuard)
@Controller('api/parse')
export class ParseController {
  private readonly logger = new Logger(ParseController.name);

  constructor(
    private readonly schedulerService: SchedulerService,
    private readonly filterConfigService: FilterConfigService,
    private readonly cooldownTracker: ParseCooldownTracker,
    private readonly parseActivityLog: ParseActivityLog,
  ) {}

  @Get('status')
  status(): ParseStatusResponse {
    const { parsing, sources } = this.parseActivityLog.snapshot();
    return {
      lastParsedAt:
        this.filterConfigService.lastParsedAt?.toISOString() ?? null,
      cooldownRemainingSeconds: this.cooldownTracker.remainingSeconds(),
      parsing,
      sources,
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
