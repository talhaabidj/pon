/**
 * Desk — L-shaped desk with legs.
 *
 * Code-built geometry, positioned against a wall.
 */

import * as THREE from 'three';

export function createDesk(): THREE.Group {
  const desk = new THREE.Group();
  desk.name = 'desk';

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x4a3728,
    roughness: 0.82,
    metalness: 0.05,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2e,
    roughness: 0.4,
    metalness: 0.7,
  });

  // —— Desktop surface ——
  const surface = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.05, 0.7),
    woodMat,
  );
  surface.position.set(0, 0.75, 0);
  desk.add(surface);

  // —— Legs (4 metal legs) ——
  const legGeo = new THREE.BoxGeometry(0.04, 0.75, 0.04);
  const positions = [
    [-0.76, 0.375, -0.31],
    [0.76, 0.375, -0.31],
    [-0.76, 0.375, 0.31],
    [0.76, 0.375, 0.31],
  ] as const;

  for (const [x, y, z] of positions) {
    const leg = new THREE.Mesh(legGeo, metalMat);
    leg.position.set(x, y, z);
    desk.add(leg);
  }

  // —— Drawer unit (right side) ——
  const drawerMat = new THREE.MeshStandardMaterial({
    color: 0x3d2b1f,
    roughness: 0.85,
  });
  const drawer = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.45, 0.6),
    drawerMat,
  );
  drawer.position.set(0.58, 0.525, 0);
  desk.add(drawer);

  // Drawer handle
  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.02, 0.02),
    metalMat,
  );
  handle.position.set(0.58, 0.58, 0.31);
  desk.add(handle);

  return desk;
}
