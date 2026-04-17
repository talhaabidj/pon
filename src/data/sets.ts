/**
 * Collection set data definitions.
 */
export interface SetDefinition {
  readonly id: string;
  readonly name: string;
  readonly theme: string;
  readonly itemIds: readonly string[];
  readonly completionReward: string;
}

export const SETS: readonly SetDefinition[] = [];
