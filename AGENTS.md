# Agent Workflow

This project is built incrementally by Codex as a senior game developer, technical artist, and software architect.

## Working Rules

- Keep the repository buildable at every milestone.
- Prefer small, logical commits with clear messages.
- Log significant work in `.logs/`.
- Keep gameplay simulation state separate from Three.js rendering objects.
- Use DOM overlays for text-heavy UI and Three.js for the playable 3D world.
- Keep generated assets and public files organized under `public/`.

## Verification

- Run `npm run lint`, `npm run test:unit`, and `npm run build` after core code changes.
- Use Playwright for browser-facing flow checks.
- Capture screenshots during visual milestones and review HUD readability against the playfield.

## Documentation

- Update `PLAN.md` when project direction changes.
- Update `README.md` when controls, setup, packaging, or deployment steps change.
- Add one `.logs/NNN-topic.md` entry for each meaningful milestone.
