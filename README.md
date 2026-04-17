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

Open the URL printed by Vite. The first playable shell starts at a fake desktop and transitions into a stub bedroom hub.

## Scripts

```bash
npm run lint
npm run test:unit
npm run test:e2e
npm run build
```

## Controls

Milestone 1 uses mouse/touch UI only. Future milestones add WASD movement, mouse look, and interaction prompts.

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
