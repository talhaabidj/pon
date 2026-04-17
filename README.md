# PON

PON is a cozy, slightly surreal browser game about working the night shift in a Japanese-style gacha department store. You maintain humming capsule machines, earn wages, trade for tokens, pull strange prizes, and bring your collection back to a quiet bedroom hub.

## Stack

- TypeScript
- Vite
- Three.js
- Howler.js
- HTML/CSS overlays
- localStorage saves
- Vitest
- Playwright
- ESLint and Prettier

## Local Development

```bash
npm install
npm run dev
```

Open the URL printed by Vite. The current playable slice starts at a fake desktop, moves into the bedroom hub, enters the shop, completes a task, converts wages to tokens, pulls a capsule, views the reveal, and closes the shift report.

## Scripts

```bash
npm run lint
npm run test:unit
npm run test:e2e
npm run build
```

## Controls

The current slice uses mouse/touch UI for the playable loop. Future polish adds WASD movement, mouse look, and direct 3D proximity prompts.

## Current Playable Loop

1. Start at the fake OS desktop.
2. Click `Start Shift`.
3. Use the bedroom PC, album, or shop door.
4. In the shop, complete checklist tasks for wages.
5. Convert wages to tokens at the counter.
6. Pull from an unlocked machine.
7. Continue from the reveal screen.
8. End the shift and return to the bedroom.

## Vercel

PON is configured as a static Vite app:

- Build command: `npm run build`
- Output directory: `dist`

Vercel can host the production web app directly from the generated static bundle.

## itch.io / Static ZIP

Run:

```bash
npm run build
```

Then ZIP the contents of `dist/`. Vite is configured with `base: './'`, so built assets are referenced with relative URLs.

## License

MIT
