import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'node:crypto';

const MAX_AUTH_AGE_SECONDS = 24 * 60 * 60;

interface TelegramUser {
  id: number;
}

export function verifyTelegramInitData(
  initData: string,
  botToken: string,
  expectedChatId: string,
): boolean {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) {
    return false;
  }
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();
  const computedHash = createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');
  if (computedHash !== hash) {
    return false;
  }

  const authDate = Number(params.get('auth_date'));
  if (!Number.isFinite(authDate)) {
    return false;
  }
  const ageSeconds = Date.now() / 1000 - authDate;
  if (ageSeconds > MAX_AUTH_AGE_SECONDS || ageSeconds < 0) {
    return false;
  }

  const userRaw = params.get('user');
  if (!userRaw) {
    return false;
  }
  const user = JSON.parse(userRaw) as TelegramUser;
  return String(user.id) === expectedChatId;
}

@Injectable()
export class TelegramInitDataGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | string[] | undefined> }>();

    const header = request.headers['x-telegram-init-data'];
    const initData = Array.isArray(header) ? header[0] : header;
    if (!initData) {
      throw new UnauthorizedException('Missing Telegram init data');
    }

    const botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN') as string;
    const expectedChatId = this.config.get<string>(
      'TELEGRAM_CHAT_ID',
    ) as string;

    if (!verifyTelegramInitData(initData, botToken, expectedChatId)) {
      throw new UnauthorizedException('Invalid Telegram init data');
    }

    return true;
  }
}
