import { Module } from '@nestjs/common';
import { JobsModule } from '../jobs/jobs.module';
import { FilterModule } from '../filter/filter.module';
import { SourcesModule } from '../sources/sources.module';
import { SchedulerModule } from '../scheduler/scheduler.module';
import { JobsController } from './jobs.controller';
import { FiltersController } from './filters.controller';
import { ParseController } from './parse.controller';
import { ParseCooldownTracker } from './parse-cooldown.tracker';
import { TelegramInitDataGuard } from './telegram-init-data.guard';

@Module({
  imports: [JobsModule, FilterModule, SourcesModule, SchedulerModule],
  controllers: [JobsController, FiltersController, ParseController],
  providers: [
    {
      provide: ParseCooldownTracker,
      useFactory: () => new ParseCooldownTracker(),
    },
    TelegramInitDataGuard,
  ],
})
export class ApiModule {}
