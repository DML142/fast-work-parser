import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';

const MAX_AUTH_AGE_SECONDS = 24 * 60 * 60;

interface TelegramUser {
  id: number;
}

function compareHex(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  // Non-hex input decodes short, and timingSafeEqual throws on a length mismatch.
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

function buildDataCheckString(
  params: URLSearchParams,
  excludeSignature: boolean,
): string {
  return [...params.entries()]
    .filter(([key]) => !(excludeSignature && key === 'signature'))
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
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

  const secretKey = createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const computeHash = (dataCheckString: string): string =>
    createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  // Bot API 8.0+ adds a `signature` param. Telegram's docs only address
  // excluding it for the separate Ed25519 validation path, not this
  // bot-token HMAC path — accept either derivation so a real Telegram
  // client isn't rejected once `signature` starts appearing on requests.
  const withSignature = computeHash(buildDataCheckString(params, false));
  const withoutSignature = computeHash(buildDataCheckString(params, true));
  if (!compareHex(withSignature, hash) && !compareHex(withoutSignature, hash)) {
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
  let user: TelegramUser;
  try {
    user = JSON.parse(userRaw) as TelegramUser;
  } catch {
    return false;
  }
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
