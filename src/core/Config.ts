/**
 * Config — Tuning constants for Catchapon.
 *
 * All gameplay and rendering knobs live here so nothing is a magic number.
 */

// ————————————————————————————————
// Movement & Camera
// ————————————————————————————————
export const WALK_SPEED = 3.5; // m/s
export const RUN_SPEED = 5.5; // m/s
export const MOUSE_SENSITIVITY = 0.002; // radians per pixel
export const PITCH_MIN = -Math.PI / 2.2; // look-up clamp (~81°)
export const PITCH_MAX = Math.PI / 2.2; // look-down clamp
export const PLAYER_HEIGHT = 1.65; // camera Y in meters
export const PLAYER_RADIUS = 0.3; // collision capsule radius

// ————————————————————————————————
// Economy
// ————————————————————————————————
export const TOKEN_PRICE = 12; // Catcha Credits per token
export const PULL_COST = 1; // tokens per gacha pull
export const SECRET_DISCOVERY_BONUS = 24; // Catcha Credits
export const TOKEN_PACK_OPTIONS = [1, 3, 5] as const;
// Rare reward: when the player services a jammed machine, this probability
// triggers a free bonus capsule pulled from that machine's pool.
export const JAM_SERVICE_BONUS_CAPSULE_CHANCE = 0.15;
// Rare reward: after a normal paid pull, this probability triggers a second
// free capsule from the same machine — the "jackpot" feel.
export const JACKPOT_CAPSULE_CHANCE = 0.05;
// Rare reward: every successful token purchase has this chance to grant a
// bonus token on top of the paid amount.
export const JACKPOT_TOKEN_CHANCE = 0.08;
export const JACKPOT_TOKEN_BONUS = 1;
// Shiny: every drawn capsule has this chance to spawn as a shiny variant —
// purely cosmetic flair (name prefix + accent override). No collection-schema
// change; the shiny status is not persisted across reloads.
export const SHINY_PULL_CHANCE = 0.012;
export const SHINY_ACCENT_COLOR = '#7ef0d4';

// ————————————————————————————————
// Time
// ————————————————————————————————
export const NIGHT_START_HOUR = 22; // 10 PM
export const NIGHT_END_HOUR = 6; // 6 AM (next day)
export const NIGHT_START_MINUTES = NIGHT_START_HOUR * 60; // 1320
export const NIGHT_END_MINUTES = (24 + NIGHT_END_HOUR) * 60; // 1800
export const IDLE_TIME_PER_REAL_SECOND = 1 / 30; // ~1 game-minute per 30s real
export const PULL_TIME_COST = 5; // game-minutes per pull

// ————————————————————————————————
// Tasks
// ————————————————————————————————
export const MIN_TASKS_PER_NIGHT = 3;
export const MAX_TASKS_PER_NIGHT = 7;

// ————————————————————————————————
// Rendering
// ————————————————————————————————
export const RENDERER_PIXEL_RATIO_MAX = 2;
export const TARGET_FPS = 60;

// ————————————————————————————————
// Save
// ————————————————————————————————
export const SAVE_KEY = 'pon_save_v1';

// ————————————————————————————————
// Default Player Settings
// ————————————————————————————————
export const DEFAULT_SETTINGS = {
  masterVolume: 0.8,
  sfxVolume: 1.0,
  musicVolume: 0.6,
  mouseSensitivity: MOUSE_SENSITIVITY,
  invertY: false,
  dynamicResolution: true,
  minRenderScale: 0.68,
  maxRenderScale: 0.9,
} as const;
