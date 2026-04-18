/**
 * Chair — Simple rolling desk chair.
 */

import * as THREE from 'three';

export function createChair(): THREE.Group {
  const chair = new THREE.Group();
  chair.name = 'chair';

  const seatMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a22,
    roughness: 0.8,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x3a3a3e,
    roughness: 0.4,
    metalness: 0.6,
  });

  // —— Seat ——
  const seat = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.06, 0.45),
    seatMat,
  );
  seat.position.set(0, 0.48, 0);
  chair.add(seat);

  // —— Backrest ——
  const backrest = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.45, 0.05),
    seatMat,
  );
  backrest.position.set(0, 0.75, -0.2);
  chair.add(backrest);

  // —— Central pole ——
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.33, 8),
    metalMat,
  );
  pole.position.set(0, 0.3, 0);
  chair.add(pole);

  // —— Base star (5 legs) ——
  const legGeo = new THREE.BoxGeometry(0.03, 0.03, 0.28);
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const leg = new THREE.Mesh(legGeo, metalMat);
    leg.position.set(
      Math.sin(angle) * 0.14,
      0.06,
      Math.cos(angle) * 0.14,
    );
    leg.rotation.y = angle;
    chair.add(leg);
  }

  // —— Caster wheels ——
  const wheelGeo = new THREE.SphereGeometry(0.025, 6, 4);
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const wheel = new THREE.Mesh(wheelGeo, metalMat);
    wheel.position.set(
      Math.sin(angle) * 0.27,
      0.025,
      Math.cos(angle) * 0.27,
    );
    chair.add(wheel);
  }

  return chair;
}
