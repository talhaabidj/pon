# 024 - Bug Triaging: Shift Money + Gacha Camera

Date: 2026-04-19

## Issues Addressed
1. "Didn't receive money from shift"
2. "Total money earned doesn't match the total in computer"
3. "Glitch when player opens Gatcha"

## Root Cause Analysis
- Profile UI labeled "Total Money Earned" but bound to current wallet balance (`state.money`).
- Save model had no lifetime earnings field, so spent earnings could not be represented separately from cumulative earnings.
- Screen shake logic added `PLAYER_HEIGHT` each shake frame, causing temporary camera jump upward.

## Fixes Implemented
- Added `totalMoneyEarned` to `GameState`.
- Added backward-compatible migration in `loadGameState()`:
  - old saves infer `totalMoneyEarned` from existing `money`.
- Passed cumulative earnings from Bedroom to Shop and persisted updated totals on return.
- Preserved saved user settings when ShopScene writes save state.
- Updated Bedroom terminal stats:
  - `Total Money Earned` now uses cumulative value.
  - Added `Current Balance` row for live wallet amount.
- Reworked camera shake to use temporary per-frame offsets and restore base camera pose after render.
- Added task completion toast (`+$X earned`) for clearer reward feedback.

## Validation
- `npm run lint` passed.
- `npm run test` passed (all unit tests).
- `npm run build` passed.
