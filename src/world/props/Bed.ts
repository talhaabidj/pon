/**
 * Bed — Low-poly bed with mattress, frame, and pillow.
 *
 * Positioned against a wall. Code-built geometry.
 */

import * as THREE from 'three';

export function createBed(): THREE.Group {
  const bed = new THREE.Group();
  bed.name = 'bed';

  // —— Frame (dark wood) ——
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x3d2b1f,
    roughness: 0.85,
    metalness: 0.05,
  });

  // Base frame
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.3, 2.0),
    frameMat,
  );
  base.position.set(0, 0.15, 0);
  bed.add(base);

  // Headboard
  const headboard = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.7, 0.08),
    frameMat,
  );
  headboard.position.set(0, 0.5, -0.96);
  bed.add(headboard);

  // —— Mattress ——
  const mattressMat = new THREE.MeshStandardMaterial({
    color: 0xd4cfc7,
    roughness: 0.9,
  });
  const mattress = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 0.15, 1.85),
    mattressMat,
  );
  mattress.position.set(0, 0.375, 0.05);
  bed.add(mattress);

  // —— Blanket (draped, simplified as a box) ——
  const blanketMat = new THREE.MeshStandardMaterial({
    color: 0x2d3a5c,
    roughness: 0.92,
  });
  const blanket = new THREE.Mesh(
    new THREE.BoxGeometry(1.25, 0.06, 1.2),
    blanketMat,
  );
  blanket.position.set(0, 0.48, 0.35);
  bed.add(blanket);

  // —— Pillow ——
  const pillowMat = new THREE.MeshStandardMaterial({
    color: 0xe8e4dc,
    roughness: 0.95,
  });
  const pillow = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.1, 0.35),
    pillowMat,
  );
  pillow.position.set(0, 0.49, -0.65);
  bed.add(pillow);

  return bed;
}
