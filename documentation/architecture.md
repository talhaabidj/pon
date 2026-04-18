# PON – Technical Architecture

This document describes the high-level technical structure for PON and how modules interact.

---

## 1. Tech Stack

- **Language:** TypeScript (strict).
- **Bundler / Dev server:** Vite.
- **Rendering:** Three.js (WebGL2).
- **UI:** HTML/CSS overlays with small TS helpers.
- **Audio:** Howler.js.
- **Testing:** Vitest (unit), Playwright (E2E).
- **Lint/Format:** ESLint + Prettier.
- **Persistence:** localStorage.
- **Hosting:** Vercel (primary), itch.io ZIP from `dist/`.

---

## 2. Application Layout

### 2.1 src/core

- `Game.ts`
  - Creates Three.js renderer, main camera(s), and main scene(s).
  - Manages the render loop:
    - calculates `dt` each frame,
    - calls `SceneManager.update(dt)`,
    - renders active scene.

- `SceneManager.ts`
  - Holds current scene object implementing a `Scene` interface:
    ```ts
    interface Scene {
      init(): Promise<void> | void;
      update(dt: number): void;
      dispose(): void;
    }
    ```
  - Handles scene transitions (Desktop → Bedroom → Shop → etc.).

- `Input.ts`
  - Centralized keyboard/mouse handling.
  - Exposes high-level queries like:
    - `getMovementVector()`
    - `isInteractPressed()`
    - `isMenuPressed()`

- `Audio.ts`
  - Wraps Howler:
    - functions for `playSfx(key)`, `playMusic(key)`, `stopMusic()`, `fadeMusic()`.
  - Loads and organizes SFX, music, and audio sprites.

- `Save.ts`
  - Encodes/decodes a `GameState` object.
  - Uses localStorage with versioned key (e.g., `pon_save_v1`).
  - Exposes:
    - `loadGameState()`
    - `saveGameState(state)`

- `Config.ts`
  - Contains tuning constants:
    - movement speeds
    - mouse sensitivity defaults
    - economic constants (wage, token prices)
    - time increments per action.

- `ModelLoader.ts`
  - Uses `GLTFLoader` to load `.glb`/`.gltf` models from `public/models`.
  - Provides caching and helper factories (e.g., `loadMachineModel()`, `loadBedroomProp()`).

---

## 3. Scenes & Their Responsibilities

- `BootScene.ts`
  - Pre-loads critical assets (basic models, audio).
  - Shows a minimal loading screen.
  - Transitions to DesktopScene when ready.

- `DesktopScene.ts`
  - Renders a simple Three.js background (or static color).
  - Drives HTML/CSS desktop UI for Start/Profile/Settings.
  - On “Start Shift” → `SceneManager` switch to BedroomScene.

- `BedroomScene.ts`
  - Owns a Three.js scene representing bedroom.
  - Uses `Bedroom.ts` to build layout and place props.
  - Reads `Input` to:
    - control first-person camera.
    - handle interact prompts.
  - Opens/closes bedroom UI overlays via `ui/bedroomUI.ts`.

- `ShopScene.ts`
  - Owns a Three.js scene representing the shop floor.
  - Uses `ShopFloor.ts` and machine/prop modules.
  - Connects world interactions to systems:
    - TaskSystem, MaintenanceSystem, EconomySystem, CapsuleSystem, TimeSystem, ProgressionSystem.
  - Manages HUD and prompts via `ui/shopUI.ts` and `ui/hud.ts`.

- `RevealScene.ts`, `AlbumScene.ts`, `EndScene.ts`
  - Mostly UI-driven scenes with optional 3D accent elements.
  - Hook into CollectionSystem and CapsuleSystem for content.

---

## 4. World Modules

- `Bedroom.ts`
  - Builds room geometry and places major props:
    - walls, floor, window, AC, bed, desk, PC, ladder shelf, door, collection wall.
  - Returns a `THREE.Group` used by BedroomScene.

- `ShopFloor.ts`
  - Builds shop shell and shared props.
  - Places machine positions defined in `data/machines.ts`.

- `machines/BaseGachaMachine.ts`
  - Encapsulates machine visuals and basic logic:
    - idle animation, “interactable” indicators.
    - generic handle/button for pull action.
  - Works with CapsuleSystem to perform draws.

- `machines/WondertradeMachine.ts`
  - Special machine type using CollectionSystem to trade duplicates.

- `props/*`
  - Each file exports a `createXxx(): THREE.Group`.
  - Code-built low-poly or GLTF-based, but hidden behind a clean factory.

---

## 5. Systems and Data Flow

- **Data modules (`src/data`)** define static content.
- **Systems (`src/systems`)** implement pure or mostly pure logic using data + input state + game state.
- **Scenes** own:
  - A reference to systems.
  - Hooks between input/world interactions and systems.
  - Visual representations (3D/HTML) of system state.

Example flow for a gacha pull:

1. Player interacts with machine mesh in ShopScene.
2. ShopScene calls `CapsuleSystem.pullFromMachine(machineId, playerState)`.
3. CapsuleSystem:
   - Looks up items and rarity in `data/machines` + `data/items`.
   - Consumes one token from EconomySystem/PlayerState.
   - Returns selected item.
4. Scene:
   - Sends item to CollectionSystem.
   - Triggers transition to RevealScene + UI.

---

## 6. UI Layer

- UI is all HTML/CSS under a `#ui-root` element.
- TS modules under `src/ui/`:
  - Grab references to templates/containers.
  - Show/hide overlays based on scene and game state.
- No React or other SPA framework in v1; keep it simple and robust.

---

## 7. Testing & CI Hooks

- Vitest:
  - Tests under `tests/unit` for systems and data logic.
- Playwright:
  - E2E flows under `tests/e2e`:
    - load, start shift, reach bedroom, go to shop, perform a pull.

- GitHub Actions:
  - `ci.yml` to run lint, tests, and build.

---

## 8. Performance Notes

- Use `InstancedMesh` for repeating machines.
- Keep geometry simple and texture counts low.
- Avoid new allocations in the main update loops where possible.
- Provide a `quality` config (future) to adjust minor visual features.
