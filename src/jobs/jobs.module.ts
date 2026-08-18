import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobEntity } from './entities/job.entity';

@Module({
  imports: [TypeOrmModule.forFeature([JobEntity])],
  exports: [TypeOrmModule],
})
export class JobsModule {}
