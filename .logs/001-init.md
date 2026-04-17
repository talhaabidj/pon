# 001 - Project Initialization

Milestone 1 initializes PON as a Vite, TypeScript, and Three.js browser game.

## Completed

- Added npm scripts and TypeScript/Vite config.
- Added ESLint, Prettier, Vitest, and Playwright configuration.
- Added CI workflow for lint, tests, and build.
- Added docs: README, PLAN, AGENTS, and MIT license.
- Added the first engine shell, boot scene, fake desktop scene, and stub bedroom flow.

## Verification Results

```bash
npm run lint       # passed
npm run test:unit  # passed, 1 file / 2 tests
npm run build      # passed
npm run test:e2e   # passed, 1 Chromium flow after sandbox escalation
```

Build output is emitted to `dist/` with relative asset paths from Vite `base: './'`.
