import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TELEGRAM_CLIENT, type TelegramClient } from './telegram-client.token';
import { formatJobMessage } from './format-job-message';
import { JobEntity } from '../jobs/entities/job.entity';

@Injectable()
export class NotifierService {
  private readonly logger = new Logger(NotifierService.name);

  constructor(
    @Inject(TELEGRAM_CLIENT) private readonly client: TelegramClient,
    private readonly config: ConfigService,
  ) {}

  async notify(jobs: JobEntity[]): Promise<void> {
    const chatId = this.config.get<string>('TELEGRAM_CHAT_ID') as string;

    for (const job of jobs) {
      try {
        await this.client.sendMessage(chatId, formatJobMessage(job));
      } catch (error) {
        this.logger.error(`Failed to notify job ${job.id}`, error as Error);
      }
    }
  }
}
