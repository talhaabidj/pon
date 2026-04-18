/**
 * CollectionWall — A wall-mounted display shelf/pegboard for gacha items.
 *
 * INTERACTABLE — opens the Album view.
 * In M5+ this will visually update with collected items.
 */

import * as THREE from 'three';

export function createCollectionWall(): THREE.Group {
  const wall = new THREE.Group();
  wall.name = 'collection-wall';
  wall.userData['interactable'] = true;
  wall.userData['interactType'] = 'collection';
  wall.userData['prompt'] = 'View Collection';

  // —— Pegboard backing ——
  const boardMat = new THREE.MeshStandardMaterial({
    color: 0x2a2520,
    roughness: 0.9,
  });
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 1.0, 0.03),
    boardMat,
  );
  board.position.set(0, 0, 0);
  wall.add(board);

  // —— Shelves (3 rows) ——
  const shelfMat = new THREE.MeshStandardMaterial({
    color: 0x3d2b1f,
    roughness: 0.8,
  });

  for (let i = 0; i < 3; i++) {
    const shelfPlank = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.025, 0.1),
      shelfMat,
    );
    shelfPlank.position.set(0, -0.3 + i * 0.35, 0.05);
    wall.add(shelfPlank);
  }

  // —— Placeholder capsule items (small colored spheres on shelves) ——
  const capsuleColors = [
    0xff6b6b, 0x6baaff, 0x6bffaa, 0xffdd6b, 0xcc6bff,
    0xff6bcc, 0x6bffdd, 0xaaaaaa, 0xffaa6b,
  ];

  for (let row = 0; row < 3; row++) {
    const count = row === 0 ? 4 : row === 1 ? 3 : 2; // fewer on top
    for (let i = 0; i < count; i++) {
      const colorIdx = row * 4 + i;
      const color = capsuleColors[colorIdx % capsuleColors.length]!;
      const capsuleMat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.5,
        metalness: 0.2,
      });
      const capsule = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 8, 6),
        capsuleMat,
      );
      const spacing = 1.0 / (count + 1);
      capsule.position.set(
        -0.5 + (i + 1) * spacing,
        -0.3 + row * 0.35 + 0.06,
        0.06,
      );
      wall.add(capsule);
    }
  }

  // —— Label frame on top ——
  const labelMat = new THREE.MeshStandardMaterial({
    color: 0x7c6ef0,
    emissive: 0x7c6ef0,
    emissiveIntensity: 0.15,
  });
  const label = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.04, 0.01),
    labelMat,
  );
  label.position.set(0, 0.52, 0.02);
  wall.add(label);

  return wall;
}
