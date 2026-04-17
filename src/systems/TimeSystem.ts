/**
 * In-game night clock. Time advances by actions rather than wall-clock seconds.
 */
export class TimeSystem {
  public static readonly SHIFT_START_HOUR = 22;
  public static readonly SHIFT_LENGTH_MINUTES = 8 * 60;
  private minutesAfterStart = 0;

  public constructor(initialMinutesAfterStart = 0) {
    this.minutesAfterStart = initialMinutesAfterStart;
  }

  public advanceMinutes(minutes: number): void {
    this.minutesAfterStart = Math.min(
      TimeSystem.SHIFT_LENGTH_MINUTES,
      this.minutesAfterStart + Math.max(0, Math.floor(minutes)),
    );
  }

  public getMinutesAfterStart(): number {
    return this.minutesAfterStart;
  }

  public getClock(): string {
    const totalMinutes = TimeSystem.SHIFT_START_HOUR * 60 + this.minutesAfterStart;
    const wrappedMinutes = totalMinutes % (24 * 60);
    const hours = Math.floor(wrappedMinutes / 60)
      .toString()
      .padStart(2, '0');
    const minutes = (wrappedMinutes % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  public isWithinWindow(startClock: string, endClock: string): boolean {
    const now = this.clockToShiftMinute(this.getClock());
    const start = this.clockToShiftMinute(startClock);
    const end = this.clockToShiftMinute(endClock);

    return now >= start && now <= end;
  }

  public isShiftOver(): boolean {
    return this.minutesAfterStart >= TimeSystem.SHIFT_LENGTH_MINUTES;
  }

  private clockToShiftMinute(clock: string): number {
    const [hoursText, minutesText] = clock.split(':');
    const absoluteMinutes = Number(hoursText) * 60 + Number(minutesText);
    const shiftStart = TimeSystem.SHIFT_START_HOUR * 60;
    return absoluteMinutes >= shiftStart
      ? absoluteMinutes - shiftStart
      : absoluteMinutes + 24 * 60 - shiftStart;
  }
}
