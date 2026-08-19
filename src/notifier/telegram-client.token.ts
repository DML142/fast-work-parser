export interface TelegramClient {
  sendMessage: (chatId: string, text: string) => Promise<unknown>;
}

export const TELEGRAM_CLIENT = Symbol('TELEGRAM_CLIENT');
