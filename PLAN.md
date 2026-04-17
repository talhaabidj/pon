# PON Production Implementation Plan

## Summary

Build PON as a production-grade browser game in this repository root. Use Vite, TypeScript, vanilla Three.js, Howler.js, DOM/CSS overlays, localStorage saves, Vitest, Playwright, ESLint, Prettier, GitHub Actions, and static Vercel hosting.

The game fantasy is a cozy, quietly mysterious night-shift gacha shop loop: start on a fake desktop, wake in a bedroom hub, travel to a dense machine-filled shop, maintain machines, earn wages, convert wages to tokens, pull capsule prizes, grow collections, and return to a changing bedroom.

## Milestones

1. Initialize the project, tooling, CI, docs, and a bootable DesktopScene to stub BedroomScene flow.
2. Build the bedroom hub with PC UI, collection wall stub, and door transition.
3. Build the shop floor with gacha machines, staff counter, HUD, basic tasks, wages, and tokens.
4. Implement CapsuleSystem, RevealScene, AlbumScene, CollectionSystem, and end-of-night reporting.
5. Add progression, hidden machine triggers, time-window rare items, richer task generation, and shift logs.
6. Polish visuals, audio, performance, screenshots, packaging, GitHub release readiness, and Vercel deployment.

## Architecture

- Simulation state lives in systems and serializable data, not inside Three.js objects.
- Three.js scenes render and adapt state through a scene contract.
- DOM overlays handle menus, HUD, settings, prompts, reveal cards, album browsing, and end reports.
- Save data is JSON only and versioned from v1 onward.
- Assets ship as GLB/glTF for important props and procedural low-poly meshes for early filler objects.

## Public Interfaces

- Scene contract: `enter`, `exit`, `update`, `resize`, `render`, `dispose`.
- Core systems: capsule pulls, collection tracking, economy, maintenance, task generation, progression, and time.
- Data tables: items, sets, machines, tasks, and progression.
- UI modules expose small mount/update/destroy helpers rather than owning global game state.

## Testing

- Vitest covers pure logic and scene orchestration.
- Playwright covers boot, fake desktop, Start Shift transition, and later end-to-end shop/reveal loops.
- CI runs install, lint, unit tests, browser install, e2e tests, and build on push or PR to `main`.

## Deployment

- `npm run build` emits static output in `dist/`.
- Vite uses `base: './'` so `dist/` is valid for ZIP upload and static hosting.
- `vercel.json` sets the Vercel build command and output directory.

## Assumptions

- Use npm and `package-lock.json`.
- Use MIT license.
- No backend or account system in v1.
- Keep persistent HUD low-chrome and protect the 3D playfield.
- Use the existing GitHub repository `talhaabidj/pon` as the canonical remote when publishing.
