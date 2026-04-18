# 002 — Bedroom Scene (M2)

**Date:** 2026-04-18  
**Milestone:** M2 (Bedroom Scene)  
**Skill:** GameStudioSkill (primary), WebAppStudioSkill (interaction system, UI module)

## What was done

### Props (src/world/props/)

Created 9 code-built low-poly prop modules:

- `Bed.ts` — Dark wood frame, headboard, mattress, blanket, pillow
- `Desk.ts` — Wood surface, metal legs, drawer unit with handle
- `Chair.ts` — Rolling chair with seat, backrest, 5-leg star base, caster wheels
- `PCSetup.ts` — Monitor with emissive screen and LED accent, keyboard, mouse (INTERACTABLE: `pc`)
- `Door.ts` — Frame, panel, metal handle, emissive EXIT sign (INTERACTABLE: `door`)
- `LadderShelf.ts` — 4-tier leaning shelf with colorful books and figurine
- `Window.ts` — Cross-pane frame, dark night sky glass, tiny star dots, curtains
- `ACUnit.ts` — Wall-mounted unit with vent slats and green power LED
- `Poster.ts` — Framed art in 4 color variants
- `CollectionWall.ts` — Pegboard with 3 shelves, placeholder capsule items (INTERACTABLE: `collection`)
- `Cupboard.ts` — Tall wardrobe with door line and twin handles

### World Builder (src/world/Bedroom.ts)

- 5m × 3m × 4m room with walls, floor, ceiling, baseboard trim
- All props placed in a realistic bedroom layout
- 6-light setup for cozy night atmosphere:
  - Dim ambient
  - Warm desk lamp (main)
  - Cool monitor glow (accent)
  - Soft moonlight through window
  - Dim ceiling light
  - Purple spot on collection wall
- Returns `interactables` list for the interaction system

### Interaction System (src/core/InteractionSystem.ts)

- Raycaster from camera center each frame
- Checks objects with `userData.interactable === true`
- Returns nearest interactable within 2.5m range (type, prompt, distance)
- Clean traversal of group hierarchies to find child meshes

### BedroomScene (src/scenes/BedroomScene.ts)

- Uses `buildBedroom()` world builder
- `FirstPersonController` with AABB room-bounds collision
- `InteractionSystem` for raycaster-based prompts
- Overlay management:
  - PC → profile overlay (stub with stats)
  - Collection wall → collection overlay (stub)
  - Door → fade-to-black → transition to ShopScene
  - Escape to close overlays
- Controller disabled while overlays are open

### Bedroom UI (src/ui/bedroomUI.ts + src/styles/bedroom.css)

- Crosshair with interact-expand animation
- "Press E to ..." contextual prompt
- PC profile overlay (glassmorphism panel with stat rows)
- Collection overlay (empty state)
- Close buttons + Escape key handling

### ShopScene Stub (src/scenes/ShopScene.ts)

- Placeholder shop with 8 machine boxes in 2 rows
- Colored accent tops on machines
- Overhead lighting
- Crosshair + "Gacha Shop — Night Shift (stub)" HUD badge
- FirstPersonController attached for walkability

### Bug Fixes

- Fixed BootScene re-entrant `switchTo` deadlock: transition now deferred to `update()` instead of `init()`.

## Verified

- `npm run typecheck` — clean
- `npm run test` — 22/22 pass
- `npm run build` — success (33 modules, ~484 KB gzipped main bundle)
- Browser: Desktop → Night Shift → Bedroom renders with all props and lighting
- Browser: Bedroom → Door → Shop transition works with fade
