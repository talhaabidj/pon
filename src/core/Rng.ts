/**
 * Deterministic seeded RNG helpers for repeatable tests and nightly generation.
 */
export type Rng = () => number;

export function createSeededRng(seed: string | number): Rng {
  let value = typeof seed === 'number' ? seed >>> 0 : hashString(seed);

  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickWeighted<T extends string>(weights: Readonly<Record<T, number>>, rng: Rng): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((sum, [, weight]) => sum + Math.max(0, weight), 0);
  let roll = rng() * total;

  for (const [key, weight] of entries) {
    roll -= Math.max(0, weight);
    if (roll <= 0) {
      return key;
    }
  }

  return entries[entries.length - 1][0];
}

function hashString(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}
