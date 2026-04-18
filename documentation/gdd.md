# PON – Game Design Document (GDD)

This GDD refines the PRD into concrete player experience, scenes, mechanics, and content for PON.

---

## 1. Core Fantasy & Pillars

**Core fantasy:**  
Work the night shift in a Japanese gacha department store, maintain temperamental capsule machines, secretly pull prizes, and build a wall of collectibles back home in your bedroom.

**Design pillars:**

1. **Machines as characters:**  
   Machines have moods, quirks, and states (clean, jammed, empty, unplugged). The theme “Machines” is expressed through their behavior, not just visuals.

2. **Cozy first‑person immersion:**  
   Player experiences the bedroom and shop entirely in first‑person, with smooth movement and grounded scale.

3. **Collection satisfaction:**  
   Every pull feels tangible: distinct item cards, rarity feedback, and a growing visual collection wall in the bedroom.

4. **Light mystery, no horror:**  
   Strange rules and secrets emerge over nights (hidden machine, time‑based rares), but tone stays warm and curious.

---

## 2. Player Experience Overview

### 2.1 Core Loop (Per Night)

1. **Desktop → Bedroom:**
   - Player starts on a fake desktop UI.
   - Clicks “Start Shift” → wakes up in first‑person in their bedroom.

2. **Bedroom Hub:**
   - Walk to PC → view profile, stats, and collection summary.
   - Inspect collection wall → see 3D/2D representations of key items.
   - Walk to door → choose “Start Night Shift” → transition.

3. **Night Gacha Shop:**
   - Receive nightly tasks.
   - Perform maintenance tasks on machines and environment.
   - Earn wages (money).
   - Convert money → tokens.
   - Spend tokens on machines:
     - Pull capsules → item reveal → add to collection.
   - Optionally trigger secrets (hidden machine, time‑based rares).

4. **End of Night:**
   - When quota/time done, show end‑of‑night summary.
   - Return to bedroom with updated wall and stats.

5. **Between Nights:**
   - Bedroom slowly fills with trophies, posters, decor as progression.

### 2.2 Controls (Desktop / Keyboard + Mouse)

- Movement: `WASD` (forward/left/back/right).
- Look: Mouse (with adjustable sensitivity + invert Y option).
- Interact: `E` (contextual).
- Jump: none (for now).
- Crouch: optional, likely not needed.
- Run: optional (Shift to move faster).
- UI navigation: Mouse and basic keys (Esc to close, Enter/Space to confirm).

---

## 3. Scenes & Flow

### 3.1 DesktopScene (Fake OS)

- Fullscreen HTML/CSS overlay.
- “Apps” or buttons:
  - **PON Night Shift:** Start the game proper.
  - Profile (opens read‑only stats).
  - Collection (shortcuts into Album).
  - Settings (master volume, mouse sensitivity, invert Y, etc.).
- On “Start Shift”:
  - Quick visual “login/dive” effect.
  - SceneManager transitions to BedroomScene.

### 3.2 BedroomScene

**Visuals:**

- Small city bedroom:
  - Bed with storage drawers.
  - Desk with PC and monitors.
  - Chair.
  - Ladder shelf with books/helmet/props.
  - Collection wall (shelves or pegboard for items).
  - Cupboard/dresser.
  - Window + curtains.
  - AC unit.
  - Posters/art.
  - Door (exit to shop).

**Interactions:**

- **PC:**
  - Opens an overlay with tabs:
    - Profile (nights, total money earned, gachas pulled, sets completed, secrets found).
    - Collection overview (summary of sets).
    - Settings (audio, controls).
  - Later, may show logs or hints.

- **Collection wall:**
  - Some items/sets displayed as 3D props or large icons.
  - Interact → open AlbumScene UI.

- **Door:**
  - Prompt “Start Night Shift?”.
  - Confirm → transition to ShopScene.

### 3.3 ShopScene

**Layout:**

- A single compact floor for MVP:
  - 2–3 aisles of machines in rows.
  - Staff counter/terminal at one edge.
  - Small back room or blocked‑off area for hidden machine.
  - Ambient signage and decor hinting at machine themes and rarities.

**Gameplay systems active:**

- Tasks / Maintenance.
- Economy.
- Gacha pulls.
- Time progression.
- Progression (unlocking features/machines).

**Nightly flow:**

1. Receive a task list (HUD + dedicated UI).
2. Walk the floor:
   - Interact with floor spots, machines, crates.
3. Complete tasks to earn money.
4. Convert money → tokens at counter.
5. Buy pulls at machines:
   - Choose machine → pull → RevealScene.
6. End when:
   - Minimum task quota met **or**
   - In‑game time passes a limit (e.g., 06:00).

### 3.4 RevealScene

- Fullscreen overlay:
  - Capsule animation.
  - Item card with:
    - 2D icon or 3D small render.
    - Item name.
    - Rarity color band.
    - Set name.
    - Short flavor text (ties to machine, series, or shop lore).
- “Continue” returns to ShopScene.

### 3.5 AlbumScene

- Grid or list of sets:
  - Each set shows:
    - Name, theme.
    - Completion status.
    - Items with owned/missing states.
- Access from:
  - Bedroom (collection wall, PC).
  - Shop (UI menu).
  - EndScene summary.

### 3.6 EndScene

- Report page:
  - Tasks completed / total.
  - Money earned, tokens bought, tokens spent.
  - Items obtained (and sets progressed).
  - Secrets triggered (e.g., unlocked hidden machine, got time‑locked rare).
- “Return to Bedroom” → BedroomScene, with updated collection wall.

---

## 4. Systems

### 4.1 Task System

**Task types:**

- Clean floor spot.
- Wipe machine glass.
- Restock machine from crate.
- Fix jammed capsule.
- Rewire/plug machine.

**Per night:**

- Generate a small set (3–7 tasks).
- Track completion and show progress HUD.

### 4.2 Maintenance System

- For each machine:
  - State flags:
    - `cleanliness` (clean/dirty).
    - `stockLevel` (ok/low/empty).
    - `jammed` (bool).
    - `powered` (bool).
- Maintenance actions change these flags.
- Certain states:
  - Lower rare chances (dirty, neglected).
  - Block pulls (jammed, unplugged).

### 4.3 Economy System

- `money` (earned from tasks).
- `tokens` (bought at counter).
- Fixed conversion rate (config).
- Spends tokens on machine pulls.

### 4.4 Capsule / Gacha System

- Each machine:
  - Has a pool of items with rarity weights.
  - Optionally has quirks (e.g., one machine is more generous after perfect maintenance).
- Pull:
  - Consume one token.
  - Use RNG + rarity distribution to choose item.
  - Emit to RevealScene.

### 4.5 Collection System

- Track owned item IDs.
- Compute set completion from `items.ts` and `sets.ts`.
- Provide stats for Profile and EndScene.

### 4.6 Time & Progression Systems

- TimeSystem:
  - Keep in‑game clock (start ~22:00, end ~06:00).
  - Each action (task, travel, pull) advances time.
- ProgressionSystem:
  - Track nights worked.
  - Unlock:
    - New machines.
    - Hidden machine.
    - New sets/series.
  - Gate time‑based rare events.

---

## 5. Content Targets (First Release)

### 5.1 Machines

MVP:

- 6–8 machines on floor:
  - 3–4 “everyday” series.
  - 1–2 themed sets (e.g., cat desserts, train mascots).
  - 1 Wondertrade machine (trade duplicates).
  - 1 hidden machine unlocked via progression.

### 5.2 Items & Sets

MVP:

- 4 sets of 6 items each (24 items total) minimum.
- Clear rarity bands (e.g., Common, Uncommon, Rare, Epic, Legendary).
- Each set has:
  - Small narrative / theme.
  - A “completion reward” blurb and maybe visual.

---

## 6. UX & Feel

- Movement:
  - Smooth, slightly weighty; no jitter.
  - Sensible default mouse sensitivity.
- Audio:
  - Ambient bedroom and shop loops.
  - Machine hums, capsule drop “pon” SFX, UI beeps.
- Feedback:
  - Clear highlights for interactable objects.
  - Short, readable tooltips / prompts.
  - Minimal intrusive text; rely on visuals and short hints.

---

## 7. Out of Scope for First Release

- NPCs/customers with full AI behavior.
- Large branching narrative or dialogue trees.
- Online multiplayer or shared economies.
- Deep shop simulation beyond night shift maintenance + pulls.
