import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AutoStackController,
  INITIALIZATION_RETRY_MS,
  stackGroupIfNeeded,
  type Scheduler,
} from '../src/stack-controller';

type Group = { isStacked: boolean; setStacked: (value: boolean) => void };
type Target = { groups: Group[] };

class FakeScheduler implements Scheduler {
  time = 0;
  private nextId = 0;
  private timers = new Map<number, { due: number; callback: () => void }>();

  now(): number { return this.time; }
  setTimeout(callback: () => void, delayMs: number): ReturnType<typeof setTimeout> {
    const id = ++this.nextId;
    this.timers.set(id, { due: this.time + delayMs, callback });
    return id as unknown as ReturnType<typeof setTimeout>;
  }
  clearTimeout(handle: ReturnType<typeof setTimeout>): void {
    this.timers.delete(handle as unknown as number);
  }
  advance(ms: number): void {
    const until = this.time + ms;
    while (true) {
      const next = [...this.timers.entries()]
        .filter(([, timer]) => timer.due <= until)
        .sort((a, b) => a[1].due - b[1].due)[0];
      if (!next) break;
      this.time = next[1].due;
      this.timers.delete(next[0]);
      next[1].callback();
    }
    this.time = until;
  }
  get pending(): number { return this.timers.size; }
}

function group(initial: boolean): { value: Group; calls: boolean[] } {
  const calls: boolean[] = [];
  return {
    value: {
      isStacked: initial,
      setStacked(value) { calls.push(value); this.isStacked = value; },
    },
    calls,
  };
}

test('sets only unstacked groups, with no blind toggle', () => {
  const normal = group(false);
  const stacked = group(true);
  assert.equal(stackGroupIfNeeded(normal.value), 'stacked');
  assert.equal(stackGroupIfNeeded(stacked.value), 'already-stacked');
  assert.deepEqual(normal.calls, [true]);
  assert.deepEqual(stacked.calls, []);
  assert.equal(stackGroupIfNeeded({ isStacked: false }), 'unsupported');
});

test('initializes each window once and does not restore a later manual switch', () => {
  const a = group(false);
  const b = group(false);
  const first: Target = { groups: [a.value, a.value] };
  const second: Target = { groups: [b.value] };
  const controller = new AutoStackController<Target, Group>(
    (target) => target.groups,
    (item) => { stackGroupIfNeeded(item); },
  );
  controller.setEnabled(true);
  controller.initialize(first);
  a.value.isStacked = false; // the user switches back to ordinary tabs
  controller.initialize(first);
  controller.initialize(second);
  assert.deepEqual(a.calls, [true]);
  assert.deepEqual(b.calls, [true]);
});

test('waits briefly for a new window and cancels pending work when disabled', () => {
  const scheduler = new FakeScheduler();
  const item = group(false);
  const target: Target = { groups: [] };
  const controller = new AutoStackController<Target, Group>(
    (window) => window.groups,
    (value) => { stackGroupIfNeeded(value); },
    scheduler,
  );
  controller.setEnabled(true);
  controller.initialize(target);
  assert.equal(scheduler.pending, 1);
  target.groups.push(item.value);
  scheduler.advance(INITIALIZATION_RETRY_MS);
  assert.deepEqual(item.calls, [true]);

  const later = group(false);
  const next: Target = { groups: [] };
  controller.initialize(next);
  controller.setEnabled(false);
  next.groups.push(later.value);
  scheduler.advance(5000);
  assert.equal(scheduler.pending, 0);
  assert.deepEqual(later.calls, []);
});

test('manual action works while auto mode is off and does not enable it', () => {
  const scheduler = new FakeScheduler();
  const item = group(false);
  const target: Target = { groups: [item.value] };
  const controller = new AutoStackController<Target, Group>(
    (window) => window.groups,
    (value) => { stackGroupIfNeeded(value); },
    scheduler,
  );
  assert.equal(controller.stackNow(target), 1);
  assert.deepEqual(item.calls, [true]);
  item.value.isStacked = false;
  controller.initialize(target); // still disabled
  assert.deepEqual(item.calls, [true]);
});
