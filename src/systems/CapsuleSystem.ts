/**
 * Capsule pull logic will live here so rarity math stays testable.
 */
export interface CapsulePullResult {
  readonly itemId: string;
  readonly isNew: boolean;
}

export class CapsuleSystem {
  public previewNextPull(): CapsulePullResult {
    return {
      itemId: 'pending-item',
      isNew: true,
    };
  }
}
