# Catchapon — Agent Behavior Guide

## Skills / Modes

You will use two conceptual skills while working on Catchapon:

### GameStudioSkill

Use this mode when the primary work concerns:
- Three.js scenes,
- first-person movement and camera,
- game loop, scene transitions,
- worldbuilding (Bedroom, Shop, props, machines),
- gameplay feel and visual feedback.

In this mode, prioritize:
- Smooth framerate and low memory allocations,
- Immersive player experience and clear interactions,
- Clean separation of scenes/world from systems.

### WebAppStudioSkill

Use this mode when the primary work concerns:
- TypeScript architecture and data models,
- Vite, ESLint, Prettier, Vitest, Playwright,
- HTML/CSS UI overlays,
- CI/CD, GitHub Actions, Vercel deployment.

In this mode, prioritize:
- Code quality and maintainability,
- Fast, reliable builds,
- Green tests and CI,
- Good documentation.

## Workflow Rules

1. Always keep `npm run build` and tests passing.
2. Make small, verifiable changes per milestone.
3. Log every significant change in `.logs/`.
4. Update `PLAN.md` when milestones complete or scope changes.
5. Switch skills mid-task if needed, but explain in `.logs/` which concerns you were addressing.

## Documentation Reference

All design truth lives in `documentation/`:
- `prd.md` — Product requirements
- `gdd.md` — Game design
- `architecture.md` — Technical structure
- `coding-standards.md` — Code conventions
- `testing-and-deployment.md` — Test/deploy strategy
- `skills.md` — Skill definitions
