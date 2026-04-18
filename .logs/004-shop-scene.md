# 004 — Shop Scene & Full Gameplay Loop (M4)

**Date:** 2026-04-18  
**Milestone:** M4 (Shop Scene — Night Floor)  
**Skill:** GameStudioSkill (primary), WebAppStudioSkill (HUD, system wiring)

## What was done

### Capsule Machine 3D Component (src/world/machines/CapsuleMachine.ts)

- Code-built vending machine with:
  - Dark body with accent-colored top band (per-machine unique colors)
  - Glass window (darkens when dirty)
  - Colored capsule spheres visible inside (hidden when low stock)
  - Coin slot, turn handle, dispenser chute
  - Power LED (green=on, red=off)
  - Jam warning indicator (orange, only when jammed)
  - Name label bar with accent color
- Supports visual state updates (rebuild approach for simplicity)

### Shop Floor World Builder (src/world/ShopFloor.ts)

- 14m × 4m × 12m room with:
  - Dark tile floor with subtle grid pattern
  - Walls and ceiling
  - Machine placement from data definitions
  - Checkout counter with register
  - Storage crate with spilling capsules
  - Token purchase station (interactable)
  - Exit door with red EXIT sign (interactable)
- Lighting:
  - 4 ceiling strip lights (fluorescent feel)
  - 6 point lights (cool + warm split)
  - Emergency accent light near exit

### ShopScene (src/scenes/ShopScene.ts)

All 7 game systems wired into the gameplay loop:

- **TimeSystem** — clock advances with real time + action costs, HUD updates
- **TaskSystem** — generates nightly tasks from progression, renders in task panel
- **MaintenanceSystem** — initializes machine states per-night, affects pull quality
- **EconomySystem** — tracks money/tokens, handles purchases and earnings
- **CapsuleSystem** — performs gacha pulls with rarity weighting + modifiers
- **CollectionSystem** — tracks owned items, detects duplicates
- **ProgressionSystem** — completes nights, tracks secrets

Gameplay flow:
1. Player enters shop → systems initialize → HUD mounts
2. Walk to machine → "Press E" prompt → spend token → pull → reveal overlay
3. Walk to token station → buy tokens with money
4. Time advances → "ending soon" warning → night ends
5. Night end summary → "Return Home" → fade → back to Bedroom

### Shop HUD (src/ui/shopHUD.ts + src/styles/shop.css)

- **Top bar**: clock + time progress bar + money + tokens
- **Task panel**: scrollable checklist with completion states
- **Interact prompt**: contextual "E" prompt with machine name
- **Pull result overlay**: capsule reveal animation, item name/rarity/flavor
- **Token overlay**: buy tokens (1/3/5) with balance display
- **Night end summary**: tasks/money/items stats + "Return Home" button
- **Ending soon banner**: pulsing red warning

## Verified

- `npm run typecheck` — clean
- `npm run test` — 109/109 pass across 11 files
- `npm run build` — success (49 modules, 484 KB main + 34 KB shop chunk)
- Browser: Desktop → Bedroom (confirmed with all props + interactions)
- Browser: PC Terminal overlay shows correct initial stats
- Code review: Shop transition, system wiring, and HUD all match the GDD spec
