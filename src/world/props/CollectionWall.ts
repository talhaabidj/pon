/**
 * CollectionWall — A wall-mounted wooden display shelf for gacha items.
 *
 * INTERACTABLE — opens the Collection viewer overlay.
 * Capsule spheres on wooden shelves update to reflect owned items.
 * Styled as a warm, cozy wooden cabinet with subtle accent lighting.
 */

import * as THREE from 'three';
import { tagInteractable } from '../../core/InteractionTags.js';

// Rarity → color map
const RARITY_COLORS: Record<string, number> = {
  common: 0x9ca3af,
  uncommon: 0x34d399,
  rare: 0x60a5fa,
  epic: 0xa78bfa,
  legendary: 0xfbbf24,
  mythical: 0xf472b6,
};

export function createCollectionWall(): THREE.Group {
  const wall = new THREE.Group();
  wall.name = 'collection-wall';
  tagInteractable(wall, {
    type: 'collection',
    prompt: 'View Collection',
  });

  // —— Material palette inspired by a wooden collector cabinet ——
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
  const pedestalMat = new THREE.MeshStandardMaterial({
    color: 0x6e5440,
    roughness: 0.82,
    metalness: 0.04,
  });
  const pedestalTopMat = new THREE.MeshStandardMaterial({
    color: 0x80634c,
    roughness: 0.78,
    metalness: 0.03,
  });

  const outerW = 1.02;
  const outerH = 1.18;
  const outerD = 0.12;
  const innerW = 0.84;
  const innerH = 1.0;
  const dividerThickness = 0.01;
  const backThickness = 0.012;
  const cellDepth = 0.112;
  const cols = 6;
  const rows = 7;

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

  const cellW = (innerW - (cols + 1) * dividerThickness) / cols;
  const cellH = (innerH - (rows + 1) * dividerThickness) / rows;
  const dividerZ = backPanel.position.z + backThickness / 2 + cellDepth / 2;

  // Horizontal and vertical divider lattice forms true 3D cubicals.
  for (let r = 0; r <= rows; r += 1) {
    const y = innerH / 2 - dividerThickness / 2 - r * (cellH + dividerThickness);
    const divider = new THREE.Mesh(
      new THREE.BoxGeometry(innerW, dividerThickness, cellDepth),
      dividerMat,
    );
    divider.position.set(0, y, dividerZ);
    wall.add(divider);
  }

  for (let c = 0; c <= cols; c += 1) {
    const x = -innerW / 2 + dividerThickness / 2 + c * (cellW + dividerThickness);
    const divider = new THREE.Mesh(
      new THREE.BoxGeometry(dividerThickness, innerH, cellDepth),
      dividerMat,
    );
    divider.position.set(x, 0, dividerZ);
    wall.add(divider);
  }

  // —— Item slots distributed across the cubby matrix ——
  const slotGroup = new THREE.Group();
  slotGroup.name = 'collection-slots';

  const startX = -innerW / 2 + dividerThickness + cellW / 2;
  const startY = innerH / 2 - dividerThickness - cellH / 2;
  const cellFloorOffset = cellH / 2 - 0.01;
  const pedestalZ = backPanel.position.z + backThickness / 2 + 0.04;
  const cubbyBackThickness = 0.01;
  // Keep each cubby background clearly in front of the room wall plane.
  const cubbyBackPanelZ = frameCenterZ + 0.002;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const xPos = startX + col * (cellW + dividerThickness);
      const yCenter = startY - row * (cellH + dividerThickness);
      const baseY = yCenter - cellFloorOffset;

      const cubbyBackPanel = new THREE.Mesh(
        new THREE.BoxGeometry(cellW - 0.0015, cellH - 0.0015, cubbyBackThickness),
        cubbyBackWoodMat,
      );
      cubbyBackPanel.position.set(xPos, yCenter, cubbyBackPanelZ);
      wall.add(cubbyBackPanel);

      const stand = new THREE.Group();
      stand.position.set(xPos, baseY, pedestalZ);
      stand.visible = false;

      const standBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.019, 0.022, 0.008, 14),
        pedestalMat,
      );
      standBase.position.set(0, 0, 0);
      stand.add(standBase);

      const standTop = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0165, 0.0165, 0.004, 14),
        pedestalTopMat,
      );
      standTop.position.set(0, 0.006, 0);
      stand.add(standTop);

      slotGroup.add(stand);

      const radius = Math.min(cellW, cellH) * 0.26;
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
      sphere.position.set(xPos, baseY + 0.006 + radius + 0.003, pedestalZ);
      sphere.name = `slot-${row}-${col}`;
      sphere.userData['stand'] = stand;
      sphere.visible = false;
      slotGroup.add(sphere);
    }
  }
  wall.add(slotGroup);

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
        child.visible = true;
        mat.color.setHex(color);
        mat.opacity = 1.0;
        mat.emissive.setHex(color);
        mat.emissiveIntensity = 0.5;
        mat.transparent = false;

        const stand = child.userData['stand'];
        if (stand instanceof THREE.Group) {
          stand.visible = true;
        }
      } else {
        const mat = child.material as THREE.MeshStandardMaterial;
        child.visible = false;
        mat.opacity = 0;
        mat.transparent = true;
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0;

        const stand = child.userData['stand'];
        if (stand instanceof THREE.Group) {
          stand.visible = false;
        }
      }
      slotIdx++;
    }
  });
}
