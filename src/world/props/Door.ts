/**
 * Door — The exit door leading to the gacha shop.
 *
 * INTERACTABLE — triggers "Start Night Shift?" prompt.
 */

import * as THREE from 'three';

export function createDoor(): THREE.Group {
  const door = new THREE.Group();
  door.name = 'door';
  door.userData['interactable'] = true;
  door.userData['interactType'] = 'door';
  door.userData['prompt'] = 'Start Night Shift';

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x2a2218,
    roughness: 0.8,
  });

  const doorMat = new THREE.MeshStandardMaterial({
    color: 0x3d3225,
    roughness: 0.75,
  });

  // —— Door frame ——
  // Left frame
  const left = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 2.2, 0.12),
    frameMat,
  );
  left.position.set(-0.48, 1.1, 0);
  door.add(left);

  // Right frame
  const right = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 2.2, 0.12),
    frameMat,
  );
  right.position.set(0.48, 1.1, 0);
  door.add(right);

  // Top frame
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(1.04, 0.08, 0.12),
    frameMat,
  );
  top.position.set(0, 2.2, 0);
  door.add(top);

  // —— Door panel ——
  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(0.84, 2.1, 0.05),
    doorMat,
  );
  panel.position.set(0, 1.05, 0.02);
  door.add(panel);

  // —— Door handle ——
  const handleMat = new THREE.MeshStandardMaterial({
    color: 0x888080,
    roughness: 0.3,
    metalness: 0.8,
  });
  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.03, 0.06),
    handleMat,
  );
  handle.position.set(0.3, 1.0, 0.06);
  door.add(handle);

  // —— Small "EXIT" sign above door ——
  const signMat = new THREE.MeshStandardMaterial({
    color: 0xff4444,
    emissive: 0xff2222,
    emissiveIntensity: 0.5,
  });
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.06, 0.01),
    signMat,
  );
  sign.position.set(0, 2.35, 0.04);
  door.add(sign);

  return door;
}
