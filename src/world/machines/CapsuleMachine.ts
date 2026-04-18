/**
 * CapsuleMachine — 3D gacha machine with state-based visuals.
 *
 * A code-built vending-machine-style capsule machine.
 * Visual state reflects maintenance: dirty glass, jam indicator, power LED.
 * Each machine has a unique accent color based on its pool.
 */

import * as THREE from 'three';
import type { MachineDefinition, MachineState } from '../../data/types.js';

/** Accent colors by machine ID prefix */
const ACCENT_COLORS: Record<string, number> = {
  'machine-neko': 0xf06e7c,
  'machine-train': 0x6baaff,
  'machine-moon': 0x6ef0c0,
  'machine-pixel': 0xf0c06e,
  'machine-mix-a': 0xcc88ff,
  'machine-mix-b': 0xff88cc,
  'machine-wondertrade': 0xffffff,
  'machine-hidden': 0x7c6ef0,
};

export function createCapsuleMachine(
  def: MachineDefinition,
  state?: MachineState,
): THREE.Group {
  const machine = new THREE.Group();
  machine.name = `machine-${def.id}`;
  machine.userData['interactable'] = true;
  machine.userData['interactType'] = 'machine';
  machine.userData['machineId'] = def.id;
  machine.userData['prompt'] = def.name;

  const accentColor = ACCENT_COLORS[def.id] ?? 0x7c6ef0;
  const isDirty = state?.cleanliness === 'dirty';
  const isJammed = state?.isJammed ?? false;
  const isPowered = state?.isPowered ?? true;
  const isLowStock = state?.stockLevel === 'low' || state?.stockLevel === 'empty';

  // —— Body ——
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a35,
    roughness: 0.6,
    metalness: 0.4,
  });

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 1.8, 0.75),
    bodyMat,
  );
  body.position.set(0, 0.9, 0);
  machine.add(body);

  // —— Accent top band ——
  const accentMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: isPowered ? 0.3 : 0.0,
    roughness: 0.4,
    metalness: 0.3,
  });

  const topBand = new THREE.Mesh(
    new THREE.BoxGeometry(0.87, 0.1, 0.77),
    accentMat,
  );
  topBand.position.set(0, 1.85, 0);
  machine.add(topBand);

  // —— Glass window (shows capsules inside) ——
  const glassMat = new THREE.MeshStandardMaterial({
    color: isDirty ? 0x3a3520 : 0x1a1a2e,
    transparent: true,
    opacity: isDirty ? 0.7 : 0.4,
    roughness: isDirty ? 0.8 : 0.1,
    metalness: 0.1,
  });

  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(0.6, 0.7),
    glassMat,
  );
  glass.position.set(0, 1.2, 0.376);
  machine.add(glass);

  // —— Capsules inside (visible through glass) ——
  if (!isLowStock) {
    const capsuleGeo = new THREE.SphereGeometry(0.04, 6, 4);
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        const hue = (row * 4 + col) * 30;
        const capsuleMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color().setHSL(hue / 360, 0.6, 0.5),
          roughness: 0.5,
        });
        const capsule = new THREE.Mesh(capsuleGeo, capsuleMat);
        capsule.position.set(
          -0.18 + col * 0.12,
          0.95 + row * 0.12,
          0.3,
        );
        machine.add(capsule);
      }
    }
  }

  // —— Coin slot ——
  const slotMat = new THREE.MeshStandardMaterial({
    color: 0x555560,
    roughness: 0.3,
    metalness: 0.7,
  });
  const slot = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.015, 0.04),
    slotMat,
  );
  slot.position.set(0.25, 1.0, 0.38);
  machine.add(slot);

  // —— Dispenser chute ——
  const chuteMat = new THREE.MeshStandardMaterial({
    color: 0x222228,
    roughness: 0.7,
  });
  const chute = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.15, 0.15),
    chuteMat,
  );
  chute.position.set(0, 0.2, 0.35);
  machine.add(chute);

  // —— Turn handle (dial) ——
  const handleMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    roughness: 0.3,
    metalness: 0.5,
  });
  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.04, 12),
    handleMat,
  );
  handle.position.set(-0.25, 1.0, 0.39);
  handle.rotation.x = Math.PI / 2;
  machine.add(handle);

  // —— Power LED ——
  const ledColor = isPowered ? 0x44ff44 : 0xff2222;
  const ledMat = new THREE.MeshStandardMaterial({
    color: ledColor,
    emissive: ledColor,
    emissiveIntensity: 0.8,
  });
  const led = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, 0.02, 0.005),
    ledMat,
  );
  led.position.set(0.35, 1.75, 0.376);
  machine.add(led);

  // —— Jam indicator (orange warning) ——
  if (isJammed) {
    const jamMat = new THREE.MeshStandardMaterial({
      color: 0xff8800,
      emissive: 0xff6600,
      emissiveIntensity: 0.6,
    });
    const jamLight = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.04, 0.005),
      jamMat,
    );
    jamLight.position.set(-0.35, 1.75, 0.376);
    machine.add(jamLight);
  }

  // —— Name label (colored bar on bottom) ——
  const labelMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: 0.15,
  });
  const label = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.05, 0.01),
    labelMat,
  );
  label.position.set(0, 0.55, 0.376);
  machine.add(label);

  // Position from definition
  machine.position.set(...def.position);
  machine.rotation.y = def.rotation;

  return machine;
}

/**
 * Update visuals of an existing machine group based on new state.
 * For simplicity, we replace the entire group.
 */
export function updateMachineVisuals(
  parent: THREE.Group,
  machineGroup: THREE.Group,
  def: MachineDefinition,
  state: MachineState,
): THREE.Group {
  // Remove old
  parent.remove(machineGroup);
  disposeMachineGroup(machineGroup);

  // Build new
  const newGroup = createCapsuleMachine(def, state);
  parent.add(newGroup);
  return newGroup;
}

function disposeMachineGroup(group: THREE.Group) {
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose();
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m) => m.dispose());
      } else {
        obj.material.dispose();
      }
    }
  });
}
