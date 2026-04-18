# PON — Night Shift Gacha

A cozy first-person browser game where you work the night shift at a Japanese gacha department store. Maintain temperamental capsule machines, secretly pull prizes on the clock, and build a wall of collectibles back home in your bedroom.

## 🎮 Play

**[Play on Vercel →](#)** | **[Play on itch.io →](#)**

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

## 📁 Project Structure

```
pon/
├── public/           # Static assets (audio, models, textures)
├── src/
│   ├── core/         # Game engine (Game, SceneManager, Input, etc.)
│   ├── scenes/       # Scene implementations (Desktop, Bedroom, Shop, etc.)
│   ├── world/        # 3D world builders (Bedroom, ShopFloor, machines, props)
│   ├── systems/      # Game logic (Capsule, Collection, Economy, Tasks, etc.)
│   ├── ui/           # HTML/CSS overlay modules
│   ├── data/         # Static content (items, sets, machines, tasks)
│   ├── styles/       # CSS files
│   └── main.ts       # Entry point
├── tests/
│   ├── unit/         # Vitest unit tests
│   └── e2e/          # Playwright E2E tests
├── documentation/    # Design docs (PRD, GDD, Architecture, etc.)
└── .logs/            # Development logs
```

## 📜 License

MIT — see [LICENSE](./LICENSE).
