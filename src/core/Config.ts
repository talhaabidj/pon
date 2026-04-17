/**
 * Central tunables for the PON runtime shell.
 */
export const GAME_CONFIG = {
  title: 'PON',
  bootSceneDurationSeconds: 0.85,
  desktopLaunchDelayMs: 640,
  maxDeltaSeconds: 1 / 30,
  maxPixelRatio: 2,
  clearColor: 0x10110f,
  camera: {
    fov: 55,
    near: 0.1,
    far: 100,
  },
} as const;
