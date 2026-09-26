export const INITIALIZATION_TIMEOUT_MS = 3000;
export const INITIALIZATION_RETRY_MS = 100;

export type StackResult = 'stacked' | 'already-stacked' | 'unsupported';

/** The stack controls exist at runtime but are not part of Obsidian's public API. */
export function stackGroupIfNeeded(group: unknown): StackResult {
  if (typeof group !== 'object' || group === null) return 'unsupported';

  const stackable = group as {
    isStacked?: unknown;
    setStacked?: (stacked: boolean) => void;
  };
  if (typeof stackable.isStacked !== 'boolean' || typeof stackable.setStacked !== 'function') {
    return 'unsupported';
  }
  if (stackable.isStacked) return 'already-stacked';

  stackable.setStacked(true);
  return stackable.isStacked ? 'stacked' : 'unsupported';
}

export interface Scheduler {
  now(): number;
  setTimeout(callback: () => void, delayMs: number): ReturnType<typeof setTimeout>;
  clearTimeout(handle: ReturnType<typeof setTimeout>): void;
}

const defaultScheduler: Scheduler = {
  now: () => Date.now(),
  setTimeout: (callback, delayMs) => setTimeout(callback, delayMs),
  clearTimeout: (handle) => clearTimeout(handle),
};

/** Only retries while a newly created window is acquiring its first editor group. */
export class AutoStackController<TWindow extends object, TGroup> {
  private enabled = false;
  private disposed = false;
  private processed = new WeakSet<TWindow>();
  private pending = new Map<TWindow, ReturnType<typeof setTimeout>>();

  constructor(
    private readonly collectGroups: (target: TWindow) => readonly TGroup[],
    private readonly stackGroup: (group: TGroup) => void,
    private readonly scheduler: Scheduler = defaultScheduler,
  ) {}

  setEnabled(enabled: boolean): void {
    if (this.disposed) return;
    this.enabled = enabled;
    if (!enabled) this.cancelPending();
  }

  initialize(target: TWindow): void {
    if (!this.enabled || this.disposed || this.processed.has(target) || this.pending.has(target)) return;
    this.tryInitialize(target, this.scheduler.now());
  }

  stackNow(target: TWindow): number {
    if (this.disposed) return 0;
    const groups = new Set(this.collectGroups(target));
    for (const group of groups) this.stackGroup(group);
    return groups.size;
  }

  forget(target: TWindow): void {
    const timer = this.pending.get(target);
    if (timer !== undefined) this.scheduler.clearTimeout(timer);
    this.pending.delete(target);
    this.processed.delete(target);
  }

  dispose(): void {
    this.disposed = true;
    this.cancelPending();
  }

  private tryInitialize(target: TWindow, startedAt: number): void {
    if (!this.enabled || this.disposed || this.processed.has(target)) return;

    const groups = new Set(this.collectGroups(target));
    if (groups.size > 0) {
      this.processed.add(target);
      for (const group of groups) this.stackGroup(group);
      return;
    }

    if (this.scheduler.now() - startedAt >= INITIALIZATION_TIMEOUT_MS) {
      this.processed.add(target);
      return;
    }

    const timer = this.scheduler.setTimeout(() => {
      this.pending.delete(target);
      this.tryInitialize(target, startedAt);
    }, INITIALIZATION_RETRY_MS);
    this.pending.set(target, timer);
  }

  private cancelPending(): void {
    for (const timer of this.pending.values()) this.scheduler.clearTimeout(timer);
    this.pending.clear();
  }
}
