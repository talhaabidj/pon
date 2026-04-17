/**
 * Night progression and unlock checks.
 */
export class ProgressionSystem {
  public getTaskCountForNight(night: number): number {
    return Math.max(3, Math.min(8, 2 + night));
  }
}
