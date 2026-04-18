# 001 — Initial Scaffold & Core Engine

**Date:** 2026-04-18  
**Milestones:** M0 (scaffold) + M1 (core engine)  
**Skills:** WebAppStudioSkill (primary) + GameStudioSkill (renderer, camera)

## What was done

### M0 — Project Scaffold (WebAppStudioSkill)

- Initialized Vite + TypeScript project
- Installed all dependencies: three, howler, eslint, prettier, vitest, playwright
- Created strict `tsconfig.json` with path aliases (`@/*` → `src/*`)
- Created `vite.config.ts` with relative base URL for itch.io compatibility
- Created `vitest.config.ts`, `playwright.config.ts`
- Set up ESLint 9 flat config + Prettier
- Created full folder structure per PRD repo layout:
  - `src/core/`, `src/scenes/`, `src/world/machines/`, `src/world/props/`
  - `src/systems/`, `src/ui/`, `src/data/`, `src/styles/`
  - `tests/unit/`, `tests/e2e/`, `public/audio|models|textures`
  - `.github/workflows/`, `.logs/`, `.prompts/`
- Created `index.html` with `#canvas-container`, `#ui-root`, and loading screen
- Created `src/styles/global.css` — full design system (tokens, loading, crosshair, toasts)
- Created `src/data/types.ts` — all typed data contracts (Item, Set, Machine, Task, GameState, Scene interface)
- Created `README.md`, `LICENSE` (MIT), `PLAN.md`, `AGENTS.md`
- Created `.github/workflows/ci.yml` — lint, typecheck, test, build

### M1 — Core Engine (Mixed)

- `core/Game.ts` — WebGL renderer, RAF loop with dt capping, ACES tone mapping
- `core/SceneManager.ts` — Scene interface lifecycle (init → update → dispose)
- `core/Input.ts` — Centralized key/mouse state with movement vectors
- `core/Config.ts` — All tuning constants (movement, economy, time, rendering)
- `core/FirstPersonController.ts` — Shared FP abstraction (pointer lock, WASD, mouse look)
- `scenes/BootScene.ts` — Loading screen with progress bar → auto-transition
- `scenes/DesktopScene.ts` — Fake OS with particle background, mounts desktop UI
- `scenes/BedroomScene.ts` — Stub room (walls/floor/ceiling, warm lighting, FP controller)
- `ui/desktopUI.ts` — HTML/CSS desktop overlay with icons and dive animation
- `src/styles/desktop.css` — Glassmorphism desktop styling, dive transition
- `src/main.ts` — Entry point: Game → BootScene → DesktopScene

### Tests

- `tests/unit/SceneManager.test.ts` — lifecycle, switching, update delegation
- `tests/unit/Input.test.ts` — key state, movement vectors, frame reset
- `tests/unit/Config.test.ts` — config sanity checks

## Flow

Boot → Loading screen → DesktopScene (fake OS) → "Start Shift" → BedroomScene (stub FP room)
