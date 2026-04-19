/**
 * CollectionWall — A wall-mounted wooden display shelf for gacha items.
 *
 * INTERACTABLE — opens the Collection viewer overlay.
 * Capsule spheres on wooden shelves update to reflect owned items.
 * Styled as a warm, cozy wooden cabinet with subtle accent lighting.
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

  // —— Wooden Materials ——
  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: 0x3d2b1f,
    roughness: 0.85,
    metalness: 0.05,
  });
  const lightWoodMat = new THREE.MeshStandardMaterial({
    color: 0x8b6914,
    roughness: 0.75,
    metalness: 0.05,
  });
  const shelfWoodMat = new THREE.MeshStandardMaterial({
    color: 0x654321,
    roughness: 0.7,
    metalness: 0.05,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0xdaa520,
    emissive: 0xdaa520,
    emissiveIntensity: 0.15,
    roughness: 0.4,
    metalness: 0.6,
  });

  // —— Outer Frame (thick wooden border — pushed back to avoid z-fight) ——
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(1.52, 1.12, 0.05),
    darkWoodMat,
  );
  frame.position.z = -0.025;
  wall.add(frame);

  // —— Back Panel (lighter wood — sits behind the frame) ——
  const backPanel = new THREE.Mesh(
    new THREE.BoxGeometry(1.42, 1.02, 0.02),
    lightWoodMat,
  );
  backPanel.position.z = -0.04;
  wall.add(backPanel);

  // —— Top/Bottom golden inlay trim ——
  const topTrim = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.012, 0.012), accentMat);
  topTrim.position.set(0, 0.5, 0.005);
  wall.add(topTrim);

  const bottomTrim = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.012, 0.012), accentMat);
  bottomTrim.position.set(0, -0.5, 0.005);
  wall.add(bottomTrim);

  // —— Wooden Shelves (3 rows) with bracket supports ——
  for (let i = 0; i < 3; i++) {
    const shelfY = -0.3 + i * 0.35;

    // Shelf plank (well in front of backpanel)
    const shelfPlank = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.02, 0.13),
      shelfWoodMat,
    );
    shelfPlank.position.set(0, shelfY, 0.04);
    wall.add(shelfPlank);

    // Front lip
    const lip = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.025, 0.008),
      darkWoodMat,
    );
    lip.position.set(0, shelfY + 0.014, 0.1);
    wall.add(lip);

    // L-shaped bracket supports (2 per shelf)
    for (let b = 0; b < 2; b++) {
      const bx = -0.5 + b * 1.0;

      const bracketV = new THREE.Mesh(
        new THREE.BoxGeometry(0.012, 0.07, 0.008),
        accentMat,
      );
      bracketV.position.set(bx, shelfY - 0.045, 0.05);
      wall.add(bracketV);

      const bracketH = new THREE.Mesh(
        new THREE.BoxGeometry(0.012, 0.008, 0.09),
        accentMat,
      );
      bracketH.position.set(bx, shelfY - 0.008, 0.04);
      wall.add(bracketH);
    }
  }

  // —— 9 item slots (3 per row) ——
  const slotGroup = new THREE.Group();
  slotGroup.name = 'collection-slots';

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const pedestalMat = new THREE.MeshStandardMaterial({
        color: 0x4a3728,
        roughness: 0.8,
      });
      const pedestal = new THREE.Mesh(
        new THREE.CylinderGeometry(0.028, 0.032, 0.01, 12),
        pedestalMat,
      );

      const spacing = 0.35;
      const xPos = -0.35 + col * spacing;
      const yPos = -0.3 + row * 0.35 + 0.02;
      const zPos = 0.045;

      pedestal.position.set(xPos, yPos - 0.005, zPos);
      wall.add(pedestal);

      const slotMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a24,
        roughness: 0.2,
        metalness: 0.4,
        transparent: true,
        opacity: 0,
      });
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 16, 12),
        slotMat,
      );
      sphere.position.set(xPos, yPos + 0.035, zPos);
      sphere.name = `slot-${row}-${col}`;
      slotGroup.add(sphere);
    }
  }
  wall.add(slotGroup);

  // —— Title Plaque ——
  const plaque = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.065, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x2a1f14, metalness: 0.3, roughness: 0.6 }),
  );
  plaque.position.set(0, 0.6, -0.01);
  wall.add(plaque);

  const plaqueAccentTop = new THREE.Mesh(new THREE.BoxGeometry(0.43, 0.004, 0.004), accentMat);
  plaqueAccentTop.position.set(0, 0.635, 0.002);
  wall.add(plaqueAccentTop);

  const plaqueAccentBot = new THREE.Mesh(new THREE.BoxGeometry(0.43, 0.004, 0.004), accentMat);
  plaqueAccentBot.position.set(0, 0.565, 0.002);
  wall.add(plaqueAccentBot);

  // Warm spotlight
  const spotLight = new THREE.PointLight(0xffe0a0, 1.0, 0, 2);
  spotLight.power = 200;
  spotLight.position.set(0, 0.9, 0.5);
  wall.add(spotLight);

  return wall;
}

/**
 * Update the collection wall to visually reflect owned items.
 */
export function updateCollectionWallVisuals(
  wallGroup: THREE.Group,
  ownedItems: Array<{ rarity: string }>,
): void {
  const slots = wallGroup.getObjectByName('collection-slots');
  if (!slots) return;

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
        mat.transparent = false;
      }
      slotIdx++;
    }
  });
}
