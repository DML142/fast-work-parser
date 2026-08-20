import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobsModule } from './jobs/jobs.module';
import { JobEntity } from './jobs/entities/job.entity';
import { FilterConfigEntity } from './filter/entities/filter-config.entity';
import { SchedulerModule } from './scheduler/scheduler.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env.DB_PATH ?? 'data/jobs.sqlite',
      entities: [JobEntity, FilterConfigEntity],
      synchronize: true,
    }),
    JobsModule,
    SchedulerModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
