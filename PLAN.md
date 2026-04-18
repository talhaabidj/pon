# PON — Development Plan

> Living document. Updated as milestones are completed.

## Current Status: M2 (Bedroom Scene)

## Milestone Roadmap

| # | Milestone | Skill | Status |
|---|---|---|---|
| M0 | Project Scaffold & Tooling | WebAppStudioSkill | ✅ Done |
| M1 | Core Engine & Desktop Scene | Mixed | ✅ Done |
| M2 | Bedroom Scene (FP Hub) | GameStudioSkill | ✅ Done |
| M3 | Data Layer & Core Systems | WebAppStudioSkill | ✅ Done |
| M4 | Shop Scene (Night Floor) | GameStudioSkill | ✅ Done |
| M5 | Reveal & Collection | Mixed | ⬜ Pending |
| M6 | End of Night & Full Loop | Mixed | ⬜ Pending |
| M7 | Secrets & Content | GameStudioSkill | ⬜ Pending |
| M8 | Audio, Polish & Feel | GameStudioSkill | ⬜ Pending |
| M9 | Testing & Deployment | WebAppStudioSkill | ⬜ Pending |
| M10 | Final Polish & Release | Mixed | ⬜ Pending |

## Architecture Decisions

- **Shared FirstPersonController** (`core/FirstPersonController.ts`) for Bedroom and Shop
- **Data-driven content** via typed contracts in `src/data/types.ts`
- **Scene interface** pattern: `init() → update(dt) → dispose()`
- **HTML/CSS overlays** for all UI; no SPA framework
- **InstancedMesh** for machine rendering in Shop

## Key References

- See `documentation/` for full PRD, GDD, Architecture, and Skills definitions
- See `.logs/` for development history
