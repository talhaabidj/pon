import {
  LONG_TASK_MIN_DURATION_MS,
  LONG_TASK_WINDOW_MS,
} from '../PerformanceBudget.js';

export interface LongTaskStats {
  count: number;
  ratePerMin: number;
  totalMs: number;
  worstMs: number;
}

export class LongTaskTracker {
  private readonly longTaskDurations: number[] = [];
  private readonly longTaskStartTimes: number[] = [];
  private observer: PerformanceObserver | null = null;

  constructor() {
    this.init();
  }

  dispose() {
    this.observer?.disconnect();
    this.observer = null;
    this.longTaskDurations.length = 0;
    this.longTaskStartTimes.length = 0;
  }

  getStats(nowMs: number): LongTaskStats {
    const cutoffMs = nowMs - LONG_TASK_WINDOW_MS;

    while (
      this.longTaskStartTimes.length > 0 &&
      (this.longTaskStartTimes[0] ?? nowMs) < cutoffMs
    ) {
      this.longTaskStartTimes.shift();
      this.longTaskDurations.shift();
    }

    let totalMs = 0;
    let worstMs = 0;
    for (const duration of this.longTaskDurations) {
      totalMs += duration;
      if (duration > worstMs) worstMs = duration;
    }

    const count = this.longTaskDurations.length;
    const ratePerMin = count * (60000 / LONG_TASK_WINDOW_MS);

    return {
      count,
      ratePerMin,
      totalMs,
      worstMs,
    };
  }

  private init() {
    if (typeof window === 'undefined') return;
    if (typeof PerformanceObserver === 'undefined') return;

    const supportedTypes = PerformanceObserver.supportedEntryTypes;
    if (!Array.isArray(supportedTypes) || !supportedTypes.includes('longtask')) {
      return;
    }

    this.observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (!entries.length) return;

      for (const entry of entries) {
        if (entry.duration < LONG_TASK_MIN_DURATION_MS) continue;
        this.longTaskStartTimes.push(entry.startTime);
        this.longTaskDurations.push(entry.duration);
      }
    });

    try {
      this.observer.observe({ type: 'longtask', buffered: true });
    } catch {
      this.observer = null;
    }
  }
}
