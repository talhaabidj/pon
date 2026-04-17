/**
 * In-game night clock. Time advances by actions rather than wall-clock seconds.
 */
export class TimeSystem {
  private minutesAfterStart = 0;

  public advanceMinutes(minutes: number): void {
    this.minutesAfterStart += Math.max(0, minutes);
  }

  public getMinutesAfterStart(): number {
    return this.minutesAfterStart;
  }
}
