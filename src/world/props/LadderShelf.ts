/**
 * LadderShelf — Leaning ladder shelf with books and small objects.
 */

import * as THREE from 'three';

export function createLadderShelf(): THREE.Group {
  const shelf = new THREE.Group();
  shelf.name = 'ladder-shelf';

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x5c4a3a,
    roughness: 0.85,
  });

  // —— Side rails (leaning) ——
  const railGeo = new THREE.BoxGeometry(0.04, 1.8, 0.04);
  const leftRail = new THREE.Mesh(railGeo, woodMat);
  leftRail.position.set(-0.3, 0.9, 0);
  leftRail.rotation.x = -0.12; // slight lean
  shelf.add(leftRail);

  const rightRail = new THREE.Mesh(railGeo, woodMat);
  rightRail.position.set(0.3, 0.9, 0);
  rightRail.rotation.x = -0.12;
  shelf.add(rightRail);

  // —— Shelves (4 levels, narrowing) ——
  const shelfHeights = [0.3, 0.7, 1.1, 1.5];
  const shelfWidths = [0.62, 0.56, 0.50, 0.44];

  shelfHeights.forEach((h, i) => {
    const w = shelfWidths[i]!;
    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.025, 0.2),
      woodMat,
    );
    plank.position.set(0, h, -0.02 * i);
    shelf.add(plank);
  });

  // —— Books on shelves ——
  const bookColors = [0x8b2252, 0x2255aa, 0x228844, 0xcc8822, 0x554488];
  let bookIndex = 0;

  // Bottom shelf: cluster of books
  for (let i = 0; i < 4; i++) {
    const color = bookColors[bookIndex++ % bookColors.length]!;
    const bookMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.9,
    });
    const height = 0.14 + Math.random() * 0.06;
    const book = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, height, 0.14),
      bookMat,
    );
    book.position.set(-0.18 + i * 0.1, 0.3 + height / 2, 0);
    shelf.add(book);
  }

  // Second shelf: a couple books + small object
  for (let i = 0; i < 2; i++) {
    const color = bookColors[bookIndex++ % bookColors.length]!;
    const bookMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.9,
    });
    const book = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.16, 0.12),
      bookMat,
    );
    book.position.set(-0.12 + i * 0.12, 0.79, -0.02);
    shelf.add(book);
  }

  // Small decorative cube (figurine placeholder)
  const figurineMat = new THREE.MeshStandardMaterial({
    color: 0xe8d8c8,
    roughness: 0.7,
  });
  const figurine = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.08, 0.06),
    figurineMat,
  );
  figurine.position.set(0.14, 0.74, -0.02);
  shelf.add(figurine);

  return shelf;
}
