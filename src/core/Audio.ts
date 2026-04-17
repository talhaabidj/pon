/**
 * Thin Howler wrapper for UI and game audio. Milestone 1 only exposes volume state.
 */
import { Howler } from 'howler';

export class AudioSystem {
  private masterVolume = 0.8;

  public setMasterVolume(volume: number): void {
    this.masterVolume = Math.min(1, Math.max(0, volume));
    Howler.volume(this.masterVolume);
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }
}
