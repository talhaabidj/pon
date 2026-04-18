/**
 * TimeSystem — In-game clock for the night shift.
 *
 * Tracks time from 22:00 to 06:00 (next day).
 * Actions advance the clock. Emits end-of-night when time runs out.
 */

import {
  NIGHT_START_MINUTES,
  NIGHT_END_MINUTES,
  IDLE_TIME_PER_REAL_SECOND,
} from '../core/Config.js';

export class TimeSystem {
  private currentMinutes: number;
  private endMinutes: number;
  private isNightOver = false;

  constructor(
    startMinutes = NIGHT_START_MINUTES,
    endMinutes = NIGHT_END_MINUTES,
  ) {
    this.currentMinutes = startMinutes;
    this.endMinutes = endMinutes;
  }

  /** Advance the clock by a number of game-minutes */
  advance(minutes: number) {
    if (this.isNightOver) return;
    this.currentMinutes += minutes;
    if (this.currentMinutes >= this.endMinutes) {
      this.isNightOver = true;
    }
  }

  /** Advance based on real-time delta (idle passage) */
  advanceRealTime(dtSeconds: number) {
    this.advance(dtSeconds * IDLE_TIME_PER_REAL_SECOND);
  }

  /** Get current time as hours (0–23 range, wrapping past midnight) */
  getCurrentHour(): number {
    const totalMinutes = this.currentMinutes % (24 * 60);
    return Math.floor(totalMinutes / 60);
  }

  /** Get current time as minutes within the hour */
  getCurrentMinuteOfHour(): number {
    return Math.floor(this.currentMinutes % 60);
  }

  /** Get formatted time string (e.g., "02:34 AM") */
  getFormattedTime(): string {
    let hour = this.getCurrentHour();
    const minute = this.getCurrentMinuteOfHour();
    const ampm = hour >= 12 ? 'PM' : 'AM';
    if (hour > 12) hour -= 12;
    if (hour === 0) hour = 12;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${ampm}`;
  }

  /** Get raw current minutes (for calculations) */
  getCurrentMinutes(): number {
    return this.currentMinutes;
  }

  /** Get remaining minutes in the night */
  getRemainingMinutes(): number {
    return Math.max(0, this.endMinutes - this.currentMinutes);
  }

  /** Get progress through the night (0 to 1) */
  getNightProgress(): number {
    const total = this.endMinutes - NIGHT_START_MINUTES;
    const elapsed = this.currentMinutes - NIGHT_START_MINUTES;
    return Math.min(1, Math.max(0, elapsed / total));
  }

  /** Check if night is ending soon (within 15 game-minutes) */
  isEndingSoon(): boolean {
    return this.getRemainingMinutes() <= 15 && !this.isNightOver;
  }

  /** Check if the night shift has ended */
  isOver(): boolean {
    return this.isNightOver;
  }

  /** Reset for a new night */
  reset() {
    this.currentMinutes = NIGHT_START_MINUTES;
    this.isNightOver = false;
  }
}
