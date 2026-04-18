/**
 * CollectionWall — A wall-mounted display shelf/pegboard for gacha items.
 *
 * INTERACTABLE — opens the Collection overlay.
 * Capsule spheres on shelves update to reflect owned items.
 */

import * as THREE from 'three';

// Rarity → color map
const RARITY_COLORS: Record<string, number> = {
  common: 0x9ca3af,
  uncommon: 0x34d399,
  rare: 0x60a5fa,
  epic: 0xa78bfa,
  legendary: 0xfbbf24,
};

export function createCollectionWall(): THREE.Group {
  const wall = new THREE.Group();
  wall.name = 'collection-wall';
  wall.userData['interactable'] = true;
  wall.userData['interactType'] = 'collection';
  wall.userData['prompt'] = 'View Collection';

  // —— Wall Frame ——
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x111115,
    roughness: 0.8,
  });
  const frameGeo = new THREE.BoxGeometry(1.48, 1.08, 0.04);
  const frame = new THREE.Mesh(frameGeo, frameMat);
  wall.add(frame);

  // —— Pegboard backing ——
  const boardMat = new THREE.MeshStandardMaterial({
    color: 0x222228,
    roughness: 0.9,
  });
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 1.0, 0.05),
    boardMat,
  );
  wall.add(board);

  // —— Neon Strip (Top & Sides) ——
  const neonMat = new THREE.MeshStandardMaterial({
    color: 0x7c6ef0,
    emissive: 0x7c6ef0,
    emissiveIntensity: 1.5,
  });
  // Top strip
  const neonTop = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.01, 0.01), neonMat);
  neonTop.position.set(0, 0.48, 0.026);
  wall.add(neonTop);
  // Bottom strip
  const neonBottom = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.01, 0.01), neonMat);
  neonBottom.position.set(0, -0.48, 0.026);
  wall.add(neonBottom);

  // —— Acrylic Shelves (3 rows) ——
  const shelfMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.05,
    transmission: 0.9,
    transparent: true,
    opacity: 0.6,
  });

  for (let i = 0; i < 3; i++) {
    const shelfPlank = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.015, 0.12),
      shelfMat,
    );
    // Add glowing bracket
    const bracket = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.005, 0.01),
      neonMat
    );
    shelfPlank.position.set(0, -0.3 + i * 0.35, 0.06);
    bracket.position.set(0, -0.307 + i * 0.35, 0.11);
    wall.add(shelfPlank);
    wall.add(bracket);
  }

  // —— 9 item slots (3 per row) — improved capsule shape ——
  const slotGroup = new THREE.Group();
  slotGroup.name = 'collection-slots';

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      // Empty slot placeholder (small ring)
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0x333344,
        roughness: 0.7,
      });
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.04, 0.005, 8, 24),
        ringMat
      );
      ring.rotation.x = Math.PI / 2;

      const spacing = 0.35; // tighter spacing
      const xPos = -0.35 + col * spacing;
      const yPos = -0.3 + row * 0.35 + 0.01;
      const zPos = 0.06;

      ring.position.set(xPos, yPos, zPos);
      wall.add(ring);

      // The actual item (hidden initially)
      const slotMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a24,
        roughness: 0.2,
        metalness: 0.4,
        transparent: true,
        opacity: 0, // initially invisible
      });
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 16, 12),
        slotMat,
      );
      sphere.position.set(xPos, yPos + 0.04, zPos);
      sphere.name = `slot-${row}-${col}`;
      slotGroup.add(sphere);
    }
  }
  wall.add(slotGroup);

  // —— Title Plaque ——
  const plaqueMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.8,
    roughness: 0.2,
  });
  const plaque = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.06, 0.02),
    plaqueMat,
  );
  plaque.position.set(0, 0.6, 0.01);
  wall.add(plaque);

  // Accent light targeting the wall
  const spotLight = new THREE.PointLight(0x7c6ef0, 1.0, 0, 2);
  spotLight.power = 150;
  spotLight.position.set(0, 0.8, 0.4);
  wall.add(spotLight);

  return wall;
}

/**
 * Update the collection wall to visually reflect owned items.
 * Maps owned items to shelf slots by color (rarity-based).
 */
export function updateCollectionWallVisuals(
  wallGroup: THREE.Group,
  ownedItems: Array<{ rarity: string }>,
): void {
  const slots = wallGroup.getObjectByName('collection-slots');
  if (!slots) return;

  // Fill slots with owned item colors
  let slotIdx = 0;
  slots.traverse((child) => {
    if (child instanceof THREE.Mesh && child.name.startsWith('slot-')) {
      if (slotIdx < ownedItems.length) {
        const item = ownedItems[slotIdx]!;
        const color = RARITY_COLORS[item.rarity] ?? 0x9ca3af;
        const mat = child.material as THREE.MeshStandardMaterial;
        mat.color.setHex(color);
        mat.opacity = 1.0;
        mat.emissive.setHex(color);
        mat.emissiveIntensity = 0.5;
        // Make it glow and fully opaque
        mat.transparent = false;
      }
      slotIdx++;
    }
  });
}
