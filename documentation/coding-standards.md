# PON – Coding Standards

This file defines how we write and structure code in PON.

---

## 1. General Principles

- **Clarity over cleverness:** prioritize readability and maintainability.
- **Small modules:** small, focused files and functions.
- **Types first:** use TypeScript’s type system to model game state and data cleanly.
- **No magic numbers:** put tunable values in `Config.ts` or data modules.

---

## 2. TypeScript

- Use `strict` mode in `tsconfig.json`.
- Prefer `interface` / `type` aliases for structured data:
  - Item, Machine, Task, Set, GameState, etc.
- Avoid `any`; use `unknown` or proper types where necessary.
- Use enums or string literal unions for small sets of fixed values:
  - e.g. `type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";`.

---

## 3. File & Naming Conventions

- File names: `PascalCase.ts` for classes/major modules, `camelCase.ts` for utilities, but keep consistent with `src` layout.
- Classes/interfaces: `PascalCase`.
- Functions and variables: `camelCase`.
- Booleans: `isX`, `hasX`, `shouldX`.

Examples:

- `createBed()`, `createShopFloor()`.
- `TaskSystem`, `ProgressionSystem`.

---

## 4. Three.js Usage

- One main renderer managed by `Game.ts`.
- Scenes create their own `THREE.Scene` and cameras if needed; these are passed or used by Game.
- Avoid creating new geometries/materials in the update loop; create once and reuse.
- For repeated machine meshes:
  - Use `InstancedMesh` when possible.
- Keep units in meters (1 unit = 1 m).

---

## 5. UI Code

- All UI logic in `src/ui/`.
- Use vanilla DOM APIs:
  - `document.querySelector`, `addEventListener`, etc.
- Keep UI state minimal and driven by core game state objects.
- Clean up listeners when overlays are removed.

---

## 6. Comments & Documentation

- File header comment:
  - One or two sentences describing the purpose of the module.
- Inline comments:
  - Use sparingly, focusing on *why* something is done.

---

## 7. Testing

- Write Vitest unit tests for:
  - CapsuleSystem.
  - CollectionSystem.
  - EconomySystem.
  - TaskSystem.
- Only test behaviors, not implementation details.

---

## 8. Git & Commits

- Small, focused commits.
- Commit messages:
  - Imperative style: “Add ShopScene vertical slice”, “Refactor CapsuleSystem”, etc.
