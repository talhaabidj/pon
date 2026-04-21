/**
 * CapsuleMachine — 3D gacha machine with state-based visuals.
 *
 * A code-built vending-machine-style capsule machine.
 * Visual state reflects maintenance: dirty glass, jam indicator, power LED.
 * Each machine has a unique accent color based on its pool.
 */

import * as THREE from 'three';
import type { MachineDefinition, MachineState } from '../../data/types.js';
import { tagInteractable } from '../../core/InteractionTags.js';
import {
  FULL_STOCK_CAPSULE_COUNT,
  LOW_STOCK_CAPSULE_COUNT,
  animateMachineCapsules,
  setMachineCapsules,
  restockMachineCapsules,
} from './CapsuleMachineCapsules.js';
import {
  syncMachineMaintenanceVisuals,
  triggerMachineCleanPulse,
  triggerMachinePowerPulse,
  type MachineVisualRefs,
} from './CapsuleMachineVisuals.js';

export { restockMachineCapsules, triggerMachineCleanPulse, triggerMachinePowerPulse };

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

const CLEAN_GACHA_GLASS_COLOR = 0xf4fbff;
const DIRTY_GACHA_GLASS_COLOR = 0x9a8b74;

export function createCapsuleMachine(
  def: MachineDefinition,
  state?: MachineState,
): THREE.Group {
  const machine = new THREE.Group();
  machine.name = `machine-${def.id}`;
  tagInteractable(machine, {
    type: 'machine',
    prompt: def.name,
    machineId: def.id,
  });

  const accentColor = ACCENT_COLORS[def.id] ?? 0x7c6ef0;
  const isDirty = state?.cleanliness === 'dirty';
  const isJammed = state?.isJammed ?? false;
  const isPowered = state?.isPowered ?? true;
  const stockLevel = state?.stockLevel ?? 'ok';
  const isOutOfStock = stockLevel === 'empty';
  const isLowStock = stockLevel === 'low';

  const buildTier = (yOffset: number) => {
    // Shared Materials
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.3,
      metalness: 0.8,
    });
    const plasticMat = new THREE.MeshStandardMaterial({
      color: 0xeaeaea,
      roughness: 0.5,
      metalness: 0.1,
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.9,
    });

    const glassMat = new THREE.MeshStandardMaterial({
      // Keep all machine glass visually identical unless this machine is dirty.
      color: isDirty ? DIRTY_GACHA_GLASS_COLOR : CLEAN_GACHA_GLASS_COLOR,
      emissive: isDirty ? 0x241d12 : 0x89b8d6,
      emissiveIntensity: isDirty ? 0.03 : 0.14,
      transparent: true,
      opacity: isDirty ? 0.36 : 0.11,
      roughness: isDirty ? 0.58 : 0.04,
      metalness: 0.0,
      depthWrite: false,
      side: THREE.FrontSide,
    });

    // —— Lower Cabinet (Base mechanics) ——
    const kickplate = new THREE.Mesh(new THREE.BoxGeometry(0.81, 0.15, 0.71), darkMat);
    kickplate.position.set(0, 0.075 + yOffset, 0);
    machine.add(kickplate);

    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.9, 0.75), plasticMat);
    lowerBody.position.set(0, 0.6 + yOffset, 0);
    machine.add(lowerBody);

    // Chute recess
    const chuteRecess = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.1), darkMat);
    chuteRecess.position.set(0, 0.35 + yOffset, 0.33);
    machine.add(chuteRecess);

    const chuteFlap = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.23), glassMat);
    chuteFlap.position.set(0, 0.35 + yOffset, 0.381);
    chuteFlap.rotation.x = -Math.PI * 0.05; // Slightly angled inward
    machine.add(chuteFlap);

    // Giant Gacha Dial (Right-center aligned)
    const dialHub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 32), metalMat);
    dialHub.rotation.x = Math.PI / 2;
    dialHub.position.set(0.18, 0.75 + yOffset, 0.38);
    machine.add(dialHub);

    // Crank Bowtie Action
    const crankAccent = new THREE.MeshStandardMaterial({
      color: accentColor, roughness: 0.3, metalness: 0.5
    });
    const crank = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.2, 0.06), crankAccent);
    crank.position.set(0.18, 0.75 + yOffset, 0.41);
    crank.rotation.z = Math.PI / 4; // Add slight diagonal torque for dynamic feel
    machine.add(crank);

    // Coin slot (Left side)
    const coinPlate = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.02), metalMat);
    coinPlate.position.set(-0.2, 0.75 + yOffset, 0.38);
    machine.add(coinPlate);
    
    const coinSlit = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.08, 0.03), darkMat);
    coinSlit.position.set(-0.2, 0.75 + yOffset, 0.39);
    machine.add(coinSlit);

    // —— Display Box (The transparent acrylic upper housing) ——
    const displayFloor = new THREE.Mesh(new THREE.BoxGeometry(0.81, 0.02, 0.71), metalMat);
    displayFloor.position.set(0, 1.06 + yOffset, 0);
    machine.add(displayFloor);

    // 4 Colored Edge Pillars framing the glass
    const pillarMat = new THREE.MeshStandardMaterial({
      color: accentColor, roughness: 0.4, metalness: 0.3
    });
    const pillarGeo = new THREE.BoxGeometry(0.08, 0.6, 0.08);
    
    const pBL = new THREE.Mesh(pillarGeo, pillarMat); pBL.position.set(-0.385, 1.35 + yOffset, -0.335); machine.add(pBL);
    const pBR = new THREE.Mesh(pillarGeo, pillarMat); pBR.position.set(0.385, 1.35 + yOffset, -0.335); machine.add(pBR);
    const pFL = new THREE.Mesh(pillarGeo, pillarMat); pFL.position.set(-0.385, 1.35 + yOffset, 0.335); machine.add(pFL);
    const pFR = new THREE.Mesh(pillarGeo, pillarMat); pFR.position.set(0.385, 1.35 + yOffset, 0.335); machine.add(pFR);

    // The Glass Panes
    const glassF = new THREE.Mesh(new THREE.PlaneGeometry(0.69, 0.6), glassMat);
    glassF.position.set(0, 1.35 + yOffset, 0.375); machine.add(glassF);
    
    const glassB = new THREE.Mesh(new THREE.PlaneGeometry(0.69, 0.6), glassMat);
    glassB.rotation.y = Math.PI; glassB.position.set(0, 1.35 + yOffset, -0.375); machine.add(glassB);
    
    const glassL = new THREE.Mesh(new THREE.PlaneGeometry(0.59, 0.6), glassMat);
    glassL.rotation.y = -Math.PI / 2; glassL.position.set(-0.425, 1.35 + yOffset, 0); machine.add(glassL);
    
    const glassR = new THREE.Mesh(new THREE.PlaneGeometry(0.59, 0.6), glassMat);
    glassR.rotation.y = Math.PI / 2; glassR.position.set(0.425, 1.35 + yOffset, 0); machine.add(glassR);

    // Internal Dispensing Pipe Setup
    const internalDispenser = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16), metalMat);
    internalDispenser.position.set(0, 1.05 + yOffset, 0);
    machine.add(internalDispenser);

    // Keep capsules visible unless machine is fully out of stock.
    if (!isOutOfStock) {
      const initialCapsules = isLowStock ? LOW_STOCK_CAPSULE_COUNT : FULL_STOCK_CAPSULE_COUNT;
      setMachineCapsules(machine, false, initialCapsules);
    }

    // —— Header / Marquee Sign (The Cap) ——
    const topLid = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.15, 0.75), plasticMat);
    topLid.position.set(0, 1.725 + yOffset, 0);
    machine.add(topLid);

    // Glowing Marquee Billboard Face
    const marqueeBase = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.25, 0.06), metalMat);
    marqueeBase.position.set(0, 1.85 + yOffset, 0.25);
    marqueeBase.rotation.x = -0.15; // Angled back gracefully
    machine.add(marqueeBase);

    const labelMat = new THREE.MeshStandardMaterial({
      color: accentColor,
      emissive: accentColor,
      emissiveIntensity: 0.4,
    });
    const marqueeLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.23), labelMat);
    marqueeLabel.position.set(0, 1.85 + yOffset, 0.282);
    marqueeLabel.rotation.x = -0.15;
    machine.add(marqueeLabel);

    // —— Maintenance LED Clusters ——
    const ledColor = isPowered ? 0x44ff44 : 0xff2222;
    const ledMat = new THREE.MeshStandardMaterial({
      color: ledColor, emissive: ledColor, emissiveIntensity: 0.8,
    });
    const led = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.02, 8), ledMat);
    led.rotation.x = Math.PI / 2;
    led.position.set(0.35, 1.725 + yOffset, 0.38);
    machine.add(led);

    const jamMat = new THREE.MeshStandardMaterial({
      color: 0xff8800, emissive: 0xff6600, emissiveIntensity: 0.8,
    });
    const jamLight = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.02, 8), jamMat);
    jamLight.rotation.x = Math.PI / 2;
    jamLight.position.set(-0.35, 1.725 + yOffset, 0.38);
    jamLight.visible = isJammed;
    machine.add(jamLight);

    // Add mats to animate references
    if (!machine.userData['animMats']) machine.userData['animMats'] = [];
    machine.userData['animMats'].push({ accentMat: pillarMat, labelMat: labelMat });

    if (!machine.userData['visualRefs']) machine.userData['visualRefs'] = [];
    (machine.userData['visualRefs'] as MachineVisualRefs[]).push({
      glassMat,
      ledMat,
      jamLight,
    });
  };

  // Build single tier machine
  buildTier(0);

  // Expose an animation callback for M15 Visual Polish
  machine.userData['animate'] = (time: number, s?: MachineState) => {
    const dt = animateMachineCapsules(machine, time);
    syncMachineMaintenanceVisuals(machine, time, dt, s);
  };

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
