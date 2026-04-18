/**
 * ACUnit — Small wall-mounted air conditioning unit.
 */

import * as THREE from 'three';

export function createACUnit(): THREE.Group {
  const ac = new THREE.Group();
  ac.name = 'ac-unit';

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xe8e4dc,
    roughness: 0.6,
  });

  // —— Main body ——
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.22, 0.2),
    bodyMat,
  );
  body.position.set(0, 0, 0);
  ac.add(body);

  // —— Vent slats ——
  const ventMat = new THREE.MeshStandardMaterial({
    color: 0xd0ccc0,
    roughness: 0.7,
  });

  for (let i = 0; i < 4; i++) {
    const slat = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.008, 0.01),
      ventMat,
    );
    slat.position.set(0, -0.05 + i * 0.03, 0.1);
    slat.rotation.x = 0.3;
    ac.add(slat);
  }

  // —— Power LED ——
  const ledMat = new THREE.MeshStandardMaterial({
    color: 0x44ff44,
    emissive: 0x22cc22,
    emissiveIntensity: 0.8,
  });
  const led = new THREE.Mesh(
    new THREE.BoxGeometry(0.015, 0.015, 0.005),
    ledMat,
  );
  led.position.set(0.35, 0.08, 0.101);
  ac.add(led);

  return ac;
}
