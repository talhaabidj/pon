# 002 - Playable Night Loop

Milestones 2 through 5 now run as one browser-playable slice.

## Completed

- Added deterministic item, set, machine, task, and progression data.
- Implemented seeded capsule pulls, collection progress, economy conversion, task generation, maintenance state, time windows, progression unlocks, and save-backed session state.
- Expanded the bedroom into a hub with PC profile, collection summary, settings controls, album access, and a shop door.
- Built the shop loop with generated tasks, wages, token conversion, unlocked machines, capsule pulls, reveal cards, and end-of-night reports.
- Added AlbumScene, RevealScene, EndScene, and the hidden-machine progression flag for later polish.

## Verification Results

```bash
npm run lint       # passed
npm run test:unit  # passed, 2 files / 9 tests
npm run build      # passed
npm run test:e2e   # passed, first-night Chromium flow after sandbox escalation
```

The e2e flow covers desktop boot, bedroom PC, shop entry, task completion, token conversion, capsule pull, reveal, end report, and return to bedroom.
