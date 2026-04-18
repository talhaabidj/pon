/**
 * PCSetup — Monitor, keyboard, and desktop elements sitting on a desk.
 *
 * This is an INTERACTABLE prop — the player can interact with it
 * to view their profile / settings overlay.
 */

import * as THREE from 'three';

export function createPCSetup(): THREE.Group {
  const pc = new THREE.Group();
  pc.name = 'pc-setup';
  pc.userData['interactable'] = true;
  pc.userData['interactType'] = 'pc';
  pc.userData['prompt'] = 'Use PC';

  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x111115,
    roughness: 0.3,
    metalness: 0.5,
  });

  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a2e,
    roughness: 0.1,
    metalness: 0.2,
    emissive: 0x2a2a5a,
    emissiveIntensity: 0.3,
  });

  // —— Monitor ——
  // Bezel
  const bezel = new THREE.Mesh(
    new THREE.BoxGeometry(0.65, 0.4, 0.03),
    darkMat,
  );
  bezel.position.set(0, 0.28, 0);
  pc.add(bezel);

  // Screen (slightly inset, emissive)
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.58, 0.33),
    screenMat,
  );
  screen.position.set(0, 0.28, 0.016);
  pc.add(screen);

  // Monitor stand
  const stand = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.12, 0.06),
    darkMat,
  );
  stand.position.set(0, 0.06, 0);
  pc.add(stand);

  // Stand base
  const standBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.015, 0.12),
    darkMat,
  );
  standBase.position.set(0, 0, 0);
  pc.add(standBase);

  // —— Keyboard ——
  const kbMat = new THREE.MeshStandardMaterial({
    color: 0x1e1e24,
    roughness: 0.6,
    metalness: 0.3,
  });
  const keyboard = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.015, 0.14),
    kbMat,
  );
  keyboard.position.set(0, 0.008, 0.3);
  pc.add(keyboard);

  // —— Mouse ——
  const mouse = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.02, 0.08),
    darkMat,
  );
  mouse.position.set(0.32, 0.01, 0.3);
  pc.add(mouse);

  // —— Small accent LED strip on monitor bottom ——
  const ledMat = new THREE.MeshStandardMaterial({
    color: 0x7c6ef0,
    emissive: 0x7c6ef0,
    emissiveIntensity: 0.8,
  });
  const led = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.005, 0.005),
    ledMat,
  );
  led.position.set(0, 0.075, 0.016);
  pc.add(led);

  return pc;
}
