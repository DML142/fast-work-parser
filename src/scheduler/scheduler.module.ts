import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SourcesModule } from '../sources/sources.module';
import { FilterModule } from '../filter/filter.module';
import { PersistenceModule } from '../persistence/persistence.module';
import { NotifierModule } from '../notifier/notifier.module';
import { SchedulerService } from './scheduler.service';
import { ParseActivityLog } from './parse-activity-log';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    SourcesModule,
    FilterModule,
    PersistenceModule,
    NotifierModule,
  ],
  providers: [SchedulerService, ParseActivityLog],
  exports: [SchedulerService, ParseActivityLog],
})
export class SchedulerModule {}
