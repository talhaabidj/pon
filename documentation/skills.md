# PON – Agent Skills

This document defines two high-level “skills” or modes that the Antigravity agent (Claude Opus) should use when working on PON.

The goal is to make behavior explicit and predictable, similar in spirit to having a dedicated game studio agent and a web app studio agent.

---

## 1. Game Studio Skill

**Name:** `GameStudioSkill`  
**Context:** Anything primarily about *gameplay* and *3D experience*.

### 1.1 Responsibilities

When `GameStudioSkill` is active, the agent’s focus is:

- Three.js + WebGL2 rendering
- First-person controls and camera behavior
- Scene composition and worldbuilding (bedroom, shop, props, machines)
- Game loop and scene transitions
- Gameplay systems integration (tasks, gacha, maintenance) with visuals
- Performance in render loop (draw calls, materials, geometry, GC)
- Game feel: movement, feedback, timing, animation

### 1.2 Knowledge & References

The agent should actively lean on:

- Three.js official docs and examples
- WebGL performance best practices for browser games
- Game design patterns (state machines, event routing, data-driven content)
- Real-world Japanese gacha / gashapon shops:
  - Machine rows and layout
  - Product groupings by theme/series
  - Visual language of rarity and sets

### 1.3 Behavioral Priorities

When operating under `GameStudioSkill`, the agent should:

- Optimize for *smooth framerate* and *low memory usage*.
- Prefer **simple, low-poly assets** with strong silhouettes over micro-detail.
- Keep rendering and game loop code clean and testable where feasible.
- Ensure **player experience** is central:
  - Movement feels responsive and comfortable.
  - Interactions are clear (prompts, highlights, SFX).
  - Visual feedback is satisfying (capsule drops, rarity flashes).
- Treat each scene (Desktop, Bedroom, Shop, Reveal, End) as part of a cohesive experience.

---

## 2. Web App Studio Skill

**Name:** `WebAppStudioSkill`  
**Context:** Anything primarily about *web app infrastructure* and *delivery*.

### 2.1 Responsibilities

When `WebAppStudioSkill` is active, the agent’s focus is:

- TypeScript architecture and module boundaries
- Vite configuration and optimization
- HTML/CSS overlay UI design and responsiveness
- ESLint + Prettier setup and code quality
- Vitest + Playwright tests
- GitHub Actions CI pipeline
- Vercel deployment and itch.io packaging

### 2.2 Knowledge & References

The agent should actively lean on:

- Modern TypeScript best practices (strict, typed data models)
- Vite docs and patterns for WebGL/SPA‑ish apps
- HTML/CSS layout and responsive design
- GitHub Actions examples (Node + Vite + Playwright)
- Vercel deployment of static Vite projects
- Browser compatibility and performance basics

### 2.3 Behavioral Priorities

When operating under `WebAppStudioSkill`, the agent should:

- Optimize for **maintainable, well-structured code**.
- Keep the build fast and bundles reasonably small.
- Maintain **green CI**:
  - All linting, tests, and builds must pass.
- Use **incremental, reviewable changes**:
  - No giant “mega-diff” unless unavoidable.
- Keep docs updated:
  - README, PLAN, architecture, testing-and-deployment.

---

## 3. When to Activate Each Skill

The agent should implicitly choose a skill based on the task:

- Use **GameStudioSkill** when:
  - Working on `src/world/`, `src/scenes/BedroomScene.ts`, `src/scenes/ShopScene.ts`.
  - Implementing or refining first-person movement and camera.
  - Building Three.js models or integrating GLTF assets.
  - Tuning lighting, atmosphere, or game feedback.

- Use **WebAppStudioSkill** when:
  - Working on `src/ui/`, `vite.config.ts`, `tsconfig.json`.
  - Adding or fixing tests (`tests/unit`, `tests/e2e`).
  - Setting up or editing `.github/workflows/ci.yml`.
  - Adjusting deployment or build scripts.
  - Refactoring shared utilities or data modules.

If a task spans both domains (e.g., integrating a new scene with its UI overlay), the agent should:

1. Plan with both perspectives in mind.
2. Execute changes in small, coherent chunks, labeling which “skill” is influencing each major change in the `.logs/` entry.
