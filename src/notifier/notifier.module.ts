import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import TelegramBot from 'node-telegram-bot-api';
import { NotifierService } from './notifier.service';
import { TELEGRAM_CLIENT } from './telegram-client.token';

@Module({
  providers: [
    {
      provide: TELEGRAM_CLIENT,
      useFactory: (config: ConfigService) =>
        new TelegramBot(config.get<string>('TELEGRAM_BOT_TOKEN') as string, {
          polling: false,
        }),
      inject: [ConfigService],
    },
    NotifierService,
  ],
  exports: [NotifierService],
})
export class NotifierModule {}
