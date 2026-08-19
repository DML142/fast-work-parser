import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobsModule } from './jobs/jobs.module';
import { JobEntity } from './jobs/entities/job.entity';
import { SourcesModule } from './sources/sources.module';
import { FilterModule } from './filter/filter.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env.DB_PATH ?? 'data/jobs.sqlite',
      entities: [JobEntity],
      synchronize: true,
    }),
    JobsModule,
    SourcesModule,
    FilterModule,
  ],
})
export class AppModule {}
