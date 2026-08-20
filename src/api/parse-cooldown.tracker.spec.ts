import {
  ParseCooldownTracker,
  PARSE_COOLDOWN_MS,
} from './parse-cooldown.tracker';

describe('ParseCooldownTracker', () => {
  it('reports zero remaining cooldown and allows the first trigger', () => {
    const tracker = new ParseCooldownTracker(() => 0);

    expect(tracker.remainingSeconds()).toBe(0);
    expect(tracker.tryAcquire()).toBe(true);
  });

  it('rejects a second trigger within the cooldown window and reports seconds remaining', () => {
    let now = 0;
    const tracker = new ParseCooldownTracker(() => now);

    expect(tracker.tryAcquire()).toBe(true);

    now += 30_000;
    expect(tracker.tryAcquire()).toBe(false);
    expect(tracker.remainingSeconds()).toBe(30);
  });

  it('allows a trigger again once the full cooldown has elapsed', () => {
    let now = 0;
    const tracker = new ParseCooldownTracker(() => now);

    expect(tracker.tryAcquire()).toBe(true);

    now += PARSE_COOLDOWN_MS;
    expect(tracker.remainingSeconds()).toBe(0);
    expect(tracker.tryAcquire()).toBe(true);
  });
});
