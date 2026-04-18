# PON – Testing & Deployment

---

## 1. Testing Strategy

### 1.1 Vitest (Unit)

- Location: `tests/unit/`.
- Focus:
  - `CapsuleSystem`:
    - Correct rarity distribution behavior (within expectations).
    - Deterministic output with seeded RNG helper.
  - `CollectionSystem`:
    - Adding items, checking ownership, computing set completion.
  - `EconomySystem`:
    - Money/token conversions.
  - `TaskSystem`:
    - Task generation given templates and progression inputs.

### 1.2 Playwright (E2E)

- Location: `tests/e2e/`.
- Scenarios:
  1. **Boot & Desktop:**
     - App loads without console errors.
     - “Start Shift” button appears and is clickable.
  2. **Desktop → Bedroom:**
     - Clicking Start Shift transitions to BedroomScene (detectable via DOM or canvas overlay).
  3. **Bedroom → Shop:**
     - Interact with door, confirm shift, see ShopScene HUD or elements.
  4. **First Pull Flow:**
     - In ShopScene, simulate a token and perform at least one pull.
     - Ensure RevealScene UI appears.

---

## 2. CI/CD

### 2.1 GitHub Actions

- `.github/workflows/ci.yml` should:
  - On push/PR to `main`:
    - `npm ci`
    - `npm run lint`
    - `npm run test`
    - `npm run build`

- Fail the pipeline on any error.

---

## 3. Deployment

### 3.1 Vercel

- Treat PON as a static Vite site.
- Build command: `npm run build`.
- Output directory: `dist/`.
- Ensure all asset paths are relative or Vercel-compatible.

### 3.2 itch.io

- Use `npm run build`.
- Zip the contents of `dist/`:
  - `index.html` at root.
  - All assets referenced with relative paths.
- Upload as an HTML5 game on itch.io.

---

## 4. Manual QA Checklist

Before tagging a release:

- [ ] Game loads without errors on:
  - [ ] Latest Chrome
  - [ ] Latest Firefox
- [ ] First‑person controls feel smooth; no major camera jitter.
- [ ] Desktop → Bedroom → Shop → Reveal → End → Bedroom loop works.
- [ ] At least one hidden interaction (e.g. hidden machine) is reachable.
- [ ] No obvious UI overlap issues at common resolutions (~1366×768 up to 2560×1440).
