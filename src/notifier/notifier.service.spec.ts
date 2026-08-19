import { ConfigService } from '@nestjs/config';
import { NotifierService } from './notifier.service';
import { TelegramClient } from './telegram-client.token';
import { formatJobMessage } from './format-job-message';
import { buildJobEntity } from '../common/testing/job-entity.fixture';

function fakeConfig(chatId = 'chat-1'): ConfigService {
  return {
    get: jest.fn().mockReturnValue(chatId),
  } as unknown as ConfigService;
}

describe('NotifierService', () => {
  it('sends one message per job to the configured chat', async () => {
    const client: jest.Mocked<TelegramClient> = {
      sendMessage: jest.fn().mockResolvedValue(undefined),
    };
    const service = new NotifierService(client, fakeConfig('chat-1'));
    const jobA = buildJobEntity({ id: 'a', title: 'Job A' });
    const jobB = buildJobEntity({ id: 'b', title: 'Job B' });

    await service.notify([jobA, jobB]);

    expect(client.sendMessage).toHaveBeenCalledTimes(2);
    expect(client.sendMessage).toHaveBeenNthCalledWith(
      1,
      'chat-1',
      formatJobMessage(jobA),
    );
    expect(client.sendMessage).toHaveBeenNthCalledWith(
      2,
      'chat-1',
      formatJobMessage(jobB),
    );
  });

  it('continues sending remaining jobs when one send fails', async () => {
    const client: jest.Mocked<TelegramClient> = {
      sendMessage: jest
        .fn()
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValueOnce(undefined),
    };
    const service = new NotifierService(client, fakeConfig());
    const jobA = buildJobEntity({ id: 'a' });
    const jobB = buildJobEntity({ id: 'b' });

    await expect(service.notify([jobA, jobB])).resolves.toBeUndefined();

    expect(client.sendMessage).toHaveBeenCalledTimes(2);
  });

  it('sends nothing for an empty job list', async () => {
    const client: jest.Mocked<TelegramClient> = {
      sendMessage: jest.fn(),
    };
    const service = new NotifierService(client, fakeConfig());

    await service.notify([]);

    expect(client.sendMessage).not.toHaveBeenCalled();
  });
});
