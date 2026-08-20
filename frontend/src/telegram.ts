import { init, initData, backButton } from '@telegram-apps/sdk';

let initialized = false;

export function initTelegram(): void {
  if (initialized) {
    return;
  }
  init();
  if (backButton.mount.isAvailable()) {
    backButton.mount();
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
  return backButton.onClick(handler);
}
