# 003 — Data Layer & Core Systems (M3)

**Date:** 2026-04-18  
**Milestone:** M3 (Data Layer & Core Systems)  
**Skill:** WebAppStudioSkill

## What was done

### Data Layer (src/data/)

- `items.ts` — 25 items across 4 themed sets:
  - **Neko Patisserie** (6): cat-shaped pastries (macaron, croissant, donut, éclair, cake, soufflé)
  - **Express Line** (6): train mascots (local, rapid, express, limited, shinkansen, phantom)
  - **Moonlight Garden** (6): bioluminescent plants (fern, moss, lily, vine, orchid, sapling)
  - **Pixel Legends** (6+1): retro RPG characters + 1 secret golden capsule
- `sets.ts` — 4 set definitions with completion rewards (bedroom unlocks)
- `machines.ts` — 8 machines: 4 set-specific, 2 mixed, 1 Wondertrade (night 3), 1 hidden (night 5)
- `tasks.ts` — 5 task templates: clean floor, wipe glass, restock, fix jam, rewire
- `progression.ts` — 6 night steps with task counts, machine unlocks, difficulty scaling

### Systems (src/systems/)

- `EconomySystem` — money/token management, token purchasing, pull spending
- `CollectionSystem` — item ownership, set progress, duplicate detection
- `CapsuleSystem` — weighted rarity selection, maintenance/time modifiers, injectable RNG
- `TaskSystem` — task generation (30% floor / 70% machine), completion tracking, quota
- `MaintenanceSystem` — per-machine state (clean/dirty, stock, jam, power), action methods
- `TimeSystem` — in-game clock 22:00→06:00, formatted display, night progress, ending-soon
- `ProgressionSystem` — night counting, feature unlocking, secret tracking

### Save (src/core/Save.ts)

- Versioned localStorage persistence (load, save, delete, hasSave)
- Default game state factory

### Tests (109 total, all passing)

- `DataIntegrity.test.ts` (20 tests) — validates all data structures
- `EconomySystem.test.ts` (9 tests)
- `CollectionSystem.test.ts` (9 tests)
- `CapsuleSystem.test.ts` (7 tests)
- `TaskSystem.test.ts` (11 tests)
- `TimeSystem.test.ts` (11 tests)
- `MaintenanceSystem.test.ts` (11 tests)
- `ProgressionSystem.test.ts` (9 tests)
- Plus existing: Config (7), Input (9), SceneManager (6)

## Verified

- `npm run typecheck` — clean
- `npm run test` — 109/109 pass across 11 files
- `npm run build` — success (33 modules)
