import { Injectable, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { NotifierModule } from './notifier.module';
import { NotifierService } from './notifier.service';
import { TELEGRAM_CLIENT, TelegramClient } from './telegram-client.token';
import { buildJobEntity } from '../common/testing/job-entity.fixture';

@Injectable()
class ConsumerService {
  constructor(readonly notifierService: NotifierService) {}
}

@Module({ imports: [NotifierModule], providers: [ConsumerService] })
class ConsumerModule {}

describe('NotifierModule', () => {
  it('exports NotifierService for a consuming module to inject', async () => {
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
        ConsumerModule,
      ],
    })
      .overrideProvider(TELEGRAM_CLIENT)
      .useValue({ sendMessage: jest.fn() } satisfies TelegramClient)
      .compile();

    const consumerService = moduleRef.get(ConsumerService);

    expect(consumerService.notifierService).toBeInstanceOf(NotifierService);

    await moduleRef.close();
  });

  it('sends a job through the overridden client without a live network call', async () => {
    const client: jest.Mocked<TelegramClient> = {
      sendMessage: jest.fn().mockResolvedValue(undefined),
    };

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
        NotifierModule,
      ],
    })
      .overrideProvider(TELEGRAM_CLIENT)
      .useValue(client)
      .compile();

    const notifierService = moduleRef.get(NotifierService);
    await notifierService.notify([buildJobEntity()]);

    expect(client.sendMessage).toHaveBeenCalledWith(
      'fake-chat',
      expect.any(String),
    );

    await moduleRef.close();
  });
});
