# Catchapon — Night Shift Gacha

Current Version: v1.0

A cozy first-person browser game where you work the night shift at a Japanese gacha department store. Maintain temperamental capsule machines, secretly pull prizes on the clock, and build a wall of collectibles back home in your bedroom.

## 🎮 Play

**[Play on Vercel →](https://catchapon.vercel.app/)** | **[Play on itch.io →](#)**

## ✨ Features

- **First-person exploration** of a bedroom hub and a night gacha shop
- **Maintenance tasks** — clean floors, wipe glass, restock machines, fix jams, rewire
- **Gacha pulls** — themed capsule machines with rarity-weighted item pools
- **Collection system** — build sets, track completion, discover secrets
- **Hidden content** — secret machines, time-locked rares, machine personalities
- **Cozy atmosphere** — late-night mood, warm lighting, ambient audio

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Rendering | Three.js (WebGL2) |
| Language | TypeScript (strict) |
| Build | Vite |
| UI | HTML/CSS overlays |
| Audio | Howler.js |
| Testing | Vitest (unit) + Playwright (E2E) |
| CI | GitHub Actions |
| Deploy | Vercel (static) + itch.io (ZIP) |

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start dev server (opens at http://localhost:3000)
npm run dev

# Type-check
npm run typecheck

# Lint
npm run lint

# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Production build
npm run build

# Preview production build
npm run preview
```

## 📦 Deployment

### Vercel

- Build command: `npm run build`
- Output directory: `dist/`
- Framework preset: Vite

### itch.io

1. Run `npm run build`
2. ZIP the contents of `dist/`
3. Upload as an HTML5 game


## 📜 License

This project is **source-available and non-commercial** for the game code, with Creative Commons licenses for assets.

- **Code:** Custom non-commercial, attribution-required license. See [LICENSE](./LICENSE).
- **Default assets (models, textures, audio, narrative text, UI, etc.):** Licensed under **Creative Commons BY-NC-SA 4.0**. See [ASSETS_LICENSE.md](./ASSETS_LICENSE.md).
- **Specific 3D low-poly models:** Some models are licensed under **Creative Commons BY 4.0** and are listed explicitly in [ASSETS_LICENSE.md](./ASSETS_LICENSE.md).

You are allowed to create and monetize gameplay videos (e.g., on YouTube or streaming platforms) as long as you credit: "Catchapon — Night Shift Gacha by Talha Abid".

