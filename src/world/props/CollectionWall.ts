/**
 * CollectionWall — A wall-mounted display shelf for gacha items.
 *
 * INTERACTABLE — opens the Collection viewer overlay.
 *
 * Layout: 6 columns × 6 rows, where:
 *   - Each row maps to one ItemSet (top → bottom matches SETS order).
 *   - Each column maps to one rarity tier (left → right: common,
 *     uncommon, rare, epic, legendary, mythical).
 *
 * Display stands are silver. Legendary and mythical slots get a fancier
 * stand variant with accent rings; common → epic share a simple silver
 * pedestal.
 */

import * as THREE from 'three';
import { tagInteractable } from '../../core/InteractionTags.js';
import type { Item, Rarity } from '../../data/types.js';
import { SETS } from '../../data/sets.js';

// Rarity → color map
const RARITY_COLORS: Record<Rarity, number> = {
  common: 0x9ca3af,
  uncommon: 0x34d399,
  rare: 0x60a5fa,
  epic: 0xa78bfa,
  legendary: 0xfbbf24,
  mythical: 0xf472b6,
};

// Left → right column order. Player reads "common first → trophy last"
// across each row, where each row is a single set.
const RARITY_COL_ORDER: readonly Rarity[] = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'mythical',
];

const ROWS = SETS.length;             // 6 sets, one row each
const COLS = RARITY_COL_ORDER.length; // 6 rarity tiers

// Every stand variant must put its top platform exactly here (local Y).
// The sphere position formula (`baseY + STAND_TOP_Y + radius`) relies on
// this — variants put their decorative rings/spires *below* this plane so
// the sphere always sits cleanly without clipping or floating.
const STAND_TOP_Y = 0.010;

type StandVariant = 'simple' | 'legendary' | 'mythical';

function rarityToVariant(rarity: Rarity): StandVariant {
  if (rarity === 'mythical') return 'mythical';
  if (rarity === 'legendary') return 'legendary';
  return 'simple';
}

export function createCollectionWall(): THREE.Group {
  const wall = new THREE.Group();
  wall.name = 'collection-wall';
  tagInteractable(wall, {
    type: 'collection',
    prompt: 'View Collection',
  });

  // —— Material palette (warm wooden frame, silver display stands) ——
  const frameWoodMat = new THREE.MeshStandardMaterial({
    color: 0x4a3728,
    roughness: 0.82,
    metalness: 0.05,
  });
  const innerWoodMat = new THREE.MeshStandardMaterial({
    color: 0x3d3025,
    roughness: 0.84,
    metalness: 0.02,
  });
  const cubbyBackWoodMat = new THREE.MeshStandardMaterial({
    color: 0x4a3526,
    roughness: 0.84,
    metalness: 0.02,
  });
  const dividerMat = new THREE.MeshStandardMaterial({
    color: 0x5f4a38,
    roughness: 0.8,
    metalness: 0.02,
  });

  // Silver display materials. Brushed look = high metalness, mid roughness.
  const silverBaseMat = new THREE.MeshStandardMaterial({
    color: 0xcfd2d8,
    roughness: 0.32,
    metalness: 0.92,
  });
  const silverTopMat = new THREE.MeshStandardMaterial({
    color: 0xe6e8ee,
    roughness: 0.22,
    metalness: 0.95,
  });
  const goldRingMat = new THREE.MeshStandardMaterial({
    color: 0xf2c242,
    roughness: 0.28,
    metalness: 0.92,
    emissive: 0x4a3608,
    emissiveIntensity: 0.55,
  });
  const mythicRingMat = new THREE.MeshStandardMaterial({
    color: 0xf472b6,
    roughness: 0.24,
    metalness: 0.85,
    emissive: 0x6a1f4a,
    emissiveIntensity: 0.7,
  });
  const mythicCrownMat = new THREE.MeshStandardMaterial({
    color: 0xeae0ff,
    roughness: 0.18,
    metalness: 0.9,
    emissive: 0x4a2c80,
    emissiveIntensity: 0.45,
  });

  const outerW = 1.02;
  const outerH = 1.18;
  const outerD = 0.12;
  const innerW = 0.84;
  const innerH = 1.0;
  const dividerThickness = 0.01;
  const backThickness = 0.012;
  const cellDepth = 0.112;

  const frameCenterZ = -0.04;
  const frameRail = (outerW - innerW) / 2;

  // Frame built from joined rails so border seams close cleanly.
  const topFrame = new THREE.Mesh(
    new THREE.BoxGeometry(outerW, frameRail, outerD),
    frameWoodMat,
  );
  topFrame.position.set(0, (outerH - frameRail) / 2, frameCenterZ);
  wall.add(topFrame);

  const bottomFrame = new THREE.Mesh(
    new THREE.BoxGeometry(outerW, frameRail, outerD),
    frameWoodMat,
  );
  bottomFrame.position.set(0, -(outerH - frameRail) / 2, frameCenterZ);
  wall.add(bottomFrame);

  const leftFrame = new THREE.Mesh(
    new THREE.BoxGeometry(frameRail, innerH, outerD),
    frameWoodMat,
  );
  leftFrame.position.set(-(outerW - frameRail) / 2, 0, frameCenterZ);
  wall.add(leftFrame);

  const rightFrame = new THREE.Mesh(
    new THREE.BoxGeometry(frameRail, innerH, outerD),
    frameWoodMat,
  );
  rightFrame.position.set((outerW - frameRail) / 2, 0, frameCenterZ);
  wall.add(rightFrame);

  // Back board behind cubbies.
  const backPanel = new THREE.Mesh(
    new THREE.BoxGeometry(innerW, innerH, backThickness),
    innerWoodMat,
  );
  backPanel.position.set(0, 0, frameCenterZ - outerD / 2 + backThickness / 2 + 0.004);
  wall.add(backPanel);

  const cellW = (innerW - (COLS + 1) * dividerThickness) / COLS;
  const cellH = (innerH - (ROWS + 1) * dividerThickness) / ROWS;
  const dividerZ = backPanel.position.z + backThickness / 2 + cellDepth / 2;

  // Horizontal and vertical divider lattice forms true 3D cubicals.
  for (let r = 0; r <= ROWS; r += 1) {
    const y = innerH / 2 - dividerThickness / 2 - r * (cellH + dividerThickness);
    const divider = new THREE.Mesh(
      new THREE.BoxGeometry(innerW, dividerThickness, cellDepth),
      dividerMat,
    );
    divider.position.set(0, y, dividerZ);
    wall.add(divider);
  }

  for (let c = 0; c <= COLS; c += 1) {
    const x = -innerW / 2 + dividerThickness / 2 + c * (cellW + dividerThickness);
    const divider = new THREE.Mesh(
      new THREE.BoxGeometry(dividerThickness, innerH, cellDepth),
      dividerMat,
    );
    divider.position.set(x, 0, dividerZ);
    wall.add(divider);
  }

  // —— Item slots, one per (rarity row, set column) cell ——
  const slotGroup = new THREE.Group();
  slotGroup.name = 'collection-slots';

  const startX = -innerW / 2 + dividerThickness + cellW / 2;
  const startY = innerH / 2 - dividerThickness - cellH / 2;
  // Cell-floor offset places the stand origin exactly on the cubby floor.
  // All stand variants build upward from local Y=0 to a shared top-plate
  // height (STAND_TOP_Y) so the same sphere position works for every tier.
  const cellFloorOffset = cellH / 2;
  // Center the pedestal in the cubby's Z extent (was sitting near the back
  // wall, which made spheres look pushed back). dividerZ is already the
  // cubby's Z midpoint.
  const pedestalZ = dividerZ;
  const cubbyBackThickness = 0.01;
  const cubbyBackPanelZ = frameCenterZ + 0.002;

  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const xPos = startX + col * (cellW + dividerThickness);
      const yCenter = startY - row * (cellH + dividerThickness);
      const baseY = yCenter - cellFloorOffset;

      const cubbyBackPanel = new THREE.Mesh(
        new THREE.BoxGeometry(cellW - 0.0015, cellH - 0.0015, cubbyBackThickness),
        cubbyBackWoodMat,
      );
      cubbyBackPanel.position.set(xPos, yCenter, cubbyBackPanelZ);
      wall.add(cubbyBackPanel);

      // Build all three stand variants per slot, all hidden at start.
      // updateCollectionWallVisuals will reveal the variant matching the
      // owned item's rarity.
      const stands: Record<StandVariant, THREE.Group> = {
        simple: buildSimpleStand(silverBaseMat, silverTopMat),
        legendary: buildLegendaryStand(silverBaseMat, silverTopMat, goldRingMat),
        mythical: buildMythicalStand(
          silverBaseMat,
          silverTopMat,
          mythicRingMat,
          mythicCrownMat,
        ),
      };

      for (const variant of ['simple', 'legendary', 'mythical'] as const) {
        const stand = stands[variant];
        stand.position.set(xPos, baseY, pedestalZ);
        stand.visible = false;
        slotGroup.add(stand);
      }

      // Slightly tighter than before so the sphere clears the divider
      // walls and the player reads it as "centered in the cubby."
      const radius = Math.min(cellW, cellH) * 0.22;
      const slotMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a24,
        roughness: 0.2,
        metalness: 0.4,
        transparent: true,
        opacity: 0,
      });
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 16, 12),
        slotMat,
      );
      // Sphere bottom rests on the shared stand platform (local Y = STAND_TOP_Y).
      sphere.position.set(xPos, baseY + STAND_TOP_Y + radius, pedestalZ);
      sphere.name = `slot-${row}-${col}`;
      sphere.userData['stands'] = stands;
      sphere.visible = false;
      slotGroup.add(sphere);
    }
  }
  wall.add(slotGroup);

  return wall;
}

// All stand builders below produce a group with bottom at local Y=0 and
// the load-bearing platform at local Y=STAND_TOP_Y (0.010). Decorative
// rings/spires live BELOW the platform so the sphere always sits cleanly.

function buildSimpleStand(
  baseMat: THREE.Material,
  topMat: THREE.Material,
): THREE.Group {
  const stand = new THREE.Group();
  // Lower silver column: bottom at 0, top at 0.006.
  const lower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.019, 0.022, 0.006, 16),
    baseMat,
  );
  lower.position.set(0, 0.003, 0);
  stand.add(lower);

  // Polished platter: top exactly at STAND_TOP_Y = 0.010.
  const platter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0185, 0.0185, 0.004, 16),
    topMat,
  );
  platter.position.set(0, 0.008, 0);
  stand.add(platter);
  return stand;
}

function buildLegendaryStand(
  baseMat: THREE.Material,
  topMat: THREE.Material,
  goldMat: THREE.Material,
): THREE.Group {
  const stand = new THREE.Group();

  // Wider tiered silver base.
  const lower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.028, 0.006, 18),
    baseMat,
  );
  lower.position.set(0, 0.003, 0);
  stand.add(lower);

  // Gold accent ring around the column, mid-height (decorative, below
  // the platter so it never clashes with the sphere).
  const goldRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.0245, 0.0024, 8, 28),
    goldMat,
  );
  goldRing.rotation.x = Math.PI / 2;
  goldRing.position.set(0, 0.0055, 0);
  stand.add(goldRing);

  // Gold-rimmed silver platter, top at STAND_TOP_Y = 0.010.
  const platter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0215, 0.0215, 0.004, 20),
    topMat,
  );
  platter.position.set(0, 0.008, 0);
  stand.add(platter);

  const platterRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.022, 0.0014, 8, 28),
    goldMat,
  );
  platterRim.rotation.x = Math.PI / 2;
  platterRim.position.set(0, 0.010, 0);
  stand.add(platterRim);

  return stand;
}

function buildMythicalStand(
  baseMat: THREE.Material,
  topMat: THREE.Material,
  mythicRingMat: THREE.Material,
  crownMat: THREE.Material,
): THREE.Group {
  const stand = new THREE.Group();

  // Wider three-tier silver base.
  const tier0 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.027, 0.030, 0.004, 20),
    baseMat,
  );
  tier0.position.set(0, 0.002, 0);
  stand.add(tier0);

  const tier1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.026, 0.004, 20),
    topMat,
  );
  tier1.position.set(0, 0.006, 0);
  stand.add(tier1);

  // Iridescent magenta halo ring sitting on the second tier (decorative,
  // wraps around the column below the platter).
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.024, 0.002, 10, 32),
    mythicRingMat,
  );
  halo.rotation.x = Math.PI / 2;
  halo.position.set(0, 0.0072, 0);
  stand.add(halo);

  // Four short crown points around the column rim, all kept BELOW the
  // platter so the sphere doesn't clip them.
  for (let i = 0; i < 4; i += 1) {
    const spire = new THREE.Mesh(
      new THREE.ConeGeometry(0.0024, 0.005, 6),
      crownMat,
    );
    const angle = (i / 4) * Math.PI * 2;
    spire.position.set(
      Math.cos(angle) * 0.0245,
      0.0065,
      Math.sin(angle) * 0.0245,
    );
    stand.add(spire);
  }

  // Top platter, top at STAND_TOP_Y = 0.010.
  const platter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0215, 0.0215, 0.004, 22),
    crownMat,
  );
  platter.position.set(0, 0.008, 0);
  stand.add(platter);

  return stand;
}

/**
 * Update the collection wall to visually reflect owned items.
 *
 * Items are placed deterministically by (set row, rarity column): each
 * row corresponds to one ItemSet in SETS order, each column to a rarity
 * tier (common at left → mythical at right). Display stand variant is
 * picked from the item's rarity (simple / legendary / mythical).
 */
export function updateCollectionWallVisuals(
  wallGroup: THREE.Group,
  ownedItems: Array<Pick<Item, 'rarity' | 'setId'>>,
): void {
  const slots = wallGroup.getObjectByName('collection-slots');
  if (!slots) return;

  // Build a (row, col) → item lookup so unowned slots can be hidden.
  const slotItem = new Map<string, Pick<Item, 'rarity' | 'setId'>>();
  for (const item of ownedItems) {
    const row = SETS.findIndex((s) => s.id === item.setId);
    const col = RARITY_COL_ORDER.indexOf(item.rarity);
    if (col < 0 || row < 0) continue;
    slotItem.set(`${row}-${col}`, item);
  }

  slots.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || !child.name.startsWith('slot-')) return;
    const key = child.name.slice('slot-'.length);
    const item = slotItem.get(key);
    const stands = child.userData['stands'] as
      | Record<StandVariant, THREE.Group>
      | undefined;
    const mat = child.material as THREE.MeshStandardMaterial;

    if (!item) {
      child.visible = false;
      mat.opacity = 0;
      mat.transparent = true;
      mat.emissive.setHex(0x000000);
      mat.emissiveIntensity = 0;
      if (stands) {
        for (const variant of ['simple', 'legendary', 'mythical'] as const) {
          stands[variant].visible = false;
        }
      }
      return;
    }

    const color = RARITY_COLORS[item.rarity] ?? RARITY_COLORS.common;
    child.visible = true;
    mat.color.setHex(color);
    mat.opacity = 1.0;
    mat.emissive.setHex(color);
    mat.emissiveIntensity = item.rarity === 'mythical' || item.rarity === 'legendary'
      ? 0.75
      : 0.5;
    mat.transparent = false;

    if (stands) {
      const variant = rarityToVariant(item.rarity);
      for (const v of ['simple', 'legendary', 'mythical'] as const) {
        stands[v].visible = v === variant;
      }
    }
  });
}
