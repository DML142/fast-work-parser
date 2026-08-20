import { createHmac } from 'node:crypto';
import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramInitDataGuard } from './telegram-init-data.guard';

function signInitData(
  fields: Record<string, string>,
  botToken: string,
): string {
  const dataCheckString = Object.keys(fields)
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join('\n');
  const secretKey = createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();
  const hash = createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');
  return new URLSearchParams({ ...fields, hash }).toString();
}

function fakeConfigService(values: Record<string, string>): ConfigService {
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}

function contextWithHeader(initData: string | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers:
          initData !== undefined ? { 'x-telegram-init-data': initData } : {},
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('TelegramInitDataGuard', () => {
  const botToken = 'fake-bot-token';
  const chatId = '12345';
  const nowSeconds = Math.floor(Date.now() / 1000);

  function validInitData(overrides: Record<string, string> = {}): string {
    return signInitData(
      {
        auth_date: String(nowSeconds),
        user: JSON.stringify({ id: 12345, first_name: 'Test' }),
        ...overrides,
      },
      botToken,
    );
  }

  it('allows a request with validly signed initData for the configured chat id', () => {
    const guard = new TelegramInitDataGuard(
      fakeConfigService({
        TELEGRAM_BOT_TOKEN: botToken,
        TELEGRAM_CHAT_ID: chatId,
      }),
    );

    expect(guard.canActivate(contextWithHeader(validInitData()))).toBe(true);
  });

  it('rejects a request with no initData header', () => {
    const guard = new TelegramInitDataGuard(
      fakeConfigService({
        TELEGRAM_BOT_TOKEN: botToken,
        TELEGRAM_CHAT_ID: chatId,
      }),
    );

    expect(() => guard.canActivate(contextWithHeader(undefined))).toThrow();
  });

  it('rejects a request with a tampered payload', () => {
    const guard = new TelegramInitDataGuard(
      fakeConfigService({
        TELEGRAM_BOT_TOKEN: botToken,
        TELEGRAM_CHAT_ID: chatId,
      }),
    );
    const tampered = validInitData().replace(
      /user=[^&]+/,
      `user=${encodeURIComponent(JSON.stringify({ id: 999 }))}`,
    );

    expect(() => guard.canActivate(contextWithHeader(tampered))).toThrow();
  });

  it('rejects a request whose user id does not match TELEGRAM_CHAT_ID', () => {
    const guard = new TelegramInitDataGuard(
      fakeConfigService({
        TELEGRAM_BOT_TOKEN: botToken,
        TELEGRAM_CHAT_ID: '99999',
      }),
    );

    expect(() =>
      guard.canActivate(contextWithHeader(validInitData())),
    ).toThrow();
  });

  it('rejects stale initData older than 24 hours', () => {
    const guard = new TelegramInitDataGuard(
      fakeConfigService({
        TELEGRAM_BOT_TOKEN: botToken,
        TELEGRAM_CHAT_ID: chatId,
      }),
    );
    const stale = validInitData({
      auth_date: String(nowSeconds - 25 * 60 * 60),
    });

    expect(() => guard.canActivate(contextWithHeader(stale))).toThrow();
  });
});
