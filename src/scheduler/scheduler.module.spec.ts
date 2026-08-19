import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulerModule } from './scheduler.module';
import { SchedulerService } from './scheduler.service';
import { JobEntity } from '../jobs/entities/job.entity';
import {
  TELEGRAM_CLIENT,
  TelegramClient,
} from '../notifier/telegram-client.token';

describe('SchedulerModule', () => {
  it('wires SchedulerService with its full dependency graph', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              TELEGRAM_BOT_TOKEN: 'fake-token',
              TELEGRAM_CHAT_ID: 'fake-chat',
            }),
          ],
        }),
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [JobEntity],
          synchronize: true,
        }),
        SchedulerModule,
      ],
    })
      .overrideProvider(TELEGRAM_CLIENT)
      .useValue({ sendMessage: jest.fn() } satisfies TelegramClient)
      .compile();

    const schedulerService = moduleRef.get(SchedulerService);

    expect(schedulerService).toBeInstanceOf(SchedulerService);

    await moduleRef.close();
  });
});
