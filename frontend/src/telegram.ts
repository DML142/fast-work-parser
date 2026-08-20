import { init, initData, backButton } from '@telegram-apps/sdk';

let initialized = false;

export function initTelegram(): void {
  if (initialized) {
    return;
  }
  try {
    init();
    initData.restore();
    if (backButton.mount.isAvailable()) {
      backButton.mount();
    }
  } catch {
    // Outside Telegram (e.g. local dev in a plain browser): leave
    // initData empty. Every /api/* call will 401, and the app already
    // has a dedicated "open this from Telegram" state for that.
  }
  initialized = true;
}

export function getInitDataRaw(): string | undefined {
  return initData.raw();
}

export function setBackButtonVisible(visible: boolean): void {
  if (visible) {
    if (backButton.show.isAvailable()) {
      backButton.show();
    }
  } else if (backButton.hide.isAvailable()) {
    backButton.hide();
  }
}

export function onBackButtonClick(handler: () => void): () => void {
  if (!backButton.onClick.isAvailable()) {
    return () => {};
  }
  return backButton.onClick(handler);
}
