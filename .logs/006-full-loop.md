# 006 — End of Night & Full Loop (M6)

**Date:** 2026-04-18  
**Milestone:** M6 (End of Night & Full Loop)  
**Skill:** Mixed (WebAppStudioSkill + GameStudioSkill)

## What was done

### Task Auto-Completion

- `tryCompleteNearbyTask(machineId)` now matches tasks to machines:
  - `floor` tasks complete near any machine
  - `machine` tasks only complete at their target machine
- On completion:
  - Earns reward money
  - Advances in-game time
  - Updates machine maintenance state (clean, restock, unjam, rewire)
- Integrated into `handleInteraction()` — tasks checked first, then pull

### Wondertrade Machine

- `machine-wondertrade` gets `interactType: 'wondertrade'` in ShopFloor
- Trade flow: picks random owned item → picks random unowned item → adds to collection
- Uses the pull result overlay to show the trade result
- Unlocks after 3 nights worked (from machine data)

### Night End Summary Polish

- `showNightEndOverlay()` now receives `{ name, rarity }` objects instead of raw IDs
- Each item displayed with a rarity-colored dot + name
- Added `.summary-items`, `.summary-item`, `.summary-item-dot` CSS

### Full Loop Verification

Complete flow now works end-to-end:
1. **Desktop** → Click "Start Shift"
2. **Bedroom** → Walk to door, press E
3. **Shop** → Complete tasks at machines, buy tokens, pull capsules, Wondertrade
4. **Night End** → Summary with tasks, money, individual items
5. **Return Home** → Game state saved to localStorage
6. **Bedroom** → PC Terminal shows live stats, collection wall updated, collection overlay shows set progress
7. **Next night** → State persists across sessions

## Verified

- `npm run test` — 109/109 pass
- `npm run typecheck` — clean
- `npm run build` — 50 modules, all chunks successful
- Pushed to GitHub → Vercel auto-deploy
