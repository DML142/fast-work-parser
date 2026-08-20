import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
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

  @Post()
  async trigger(): Promise<ParseStatusResponse> {
    if (!this.cooldownTracker.tryAcquire()) {
      throw new HttpException(
        { cooldownRemainingSeconds: this.cooldownTracker.remainingSeconds() },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    await this.schedulerService.runPipeline();
    return this.status();
  }
}
