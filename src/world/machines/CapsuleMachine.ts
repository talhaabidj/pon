/**
 * CapsuleMachine — 3D gacha machine with state-based visuals.
 *
 * A code-built vending-machine-style capsule machine.
 * Visual state reflects maintenance: dirty glass, jam indicator, power LED.
 * Each machine has a unique accent color based on its pool.
 */

import * as THREE from 'three';
import type { MachineDefinition, MachineState } from '../../data/types.js';

interface AnimMats {
  accentMat: THREE.MeshStandardMaterial;
  labelMat: THREE.MeshStandardMaterial;
}

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
      color: isDirty ? 0x3a3520 : 0xf0f8ff,
      transparent: true,
      opacity: isDirty ? 0.7 : 0.25,
      roughness: isDirty ? 0.8 : 0.05,
      metalness: 0.1,
      depthWrite: false, 
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

    // —— Chaos Capsules! (Chaotic Instanced Pile inside the tank) ——
    const capsulesData: any[] = [];
    if (!isLowStock) {
      const capsuleCount = 45; // Huge pile!
      const capsuleGeo = new THREE.SphereGeometry(0.045, 8, 8);
      const capsuleMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.2,
        metalness: 0.1,
      });
      const instancedCapsules = new THREE.InstancedMesh(capsuleGeo, capsuleMat, capsuleCount);
      
      const dummy = new THREE.Object3D();
      const color = new THREE.Color();
      
      // We will lazily scatter them in a 3D grid layout slightly randomized
      let i = 0;
      for (let yLevel = 0; yLevel < 3; yLevel++) {
        for (let xLevel = 0; xLevel < 5; xLevel++) {
          for (let zLevel = 0; zLevel < 3; zLevel++) {
            if (i >= capsuleCount) break;

            const rx = -0.3 + (xLevel * 0.15) + (Math.random() * 0.05 - 0.025);
            const rz = -0.2 + (zLevel * 0.2) + (Math.random() * 0.05 - 0.025);
            // Drop them from the top to let gravity settle them
            const ry = 1.4 + (yLevel * 0.11) + (Math.random() * 0.04) + yOffset;
            
            const pos = new THREE.Vector3(rx, ry, rz);
            const rot = new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            const vel = new THREE.Vector3((Math.random() - 0.5) * 0.2, 0, (Math.random() - 0.5) * 0.2);
            capsulesData.push({ pos, rot, vel });
            
            dummy.position.copy(pos);
            dummy.rotation.copy(rot);
            dummy.updateMatrix();
            instancedCapsules.setMatrixAt(i, dummy.matrix);
            
            color.setHSL(Math.random(), 0.8, 0.5);
            instancedCapsules.setColorAt(i, color);
            i++;
          }
        }
      }
      instancedCapsules.instanceMatrix.needsUpdate = true;
      if (instancedCapsules.instanceColor) instancedCapsules.instanceColor.needsUpdate = true;
      machine.userData['capsules'] = { mesh: instancedCapsules, data: capsulesData };
      machine.add(instancedCapsules);
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

    if (isJammed) {
      const jamMat = new THREE.MeshStandardMaterial({
        color: 0xff8800, emissive: 0xff6600, emissiveIntensity: 0.8,
      });
      const jamLight = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.02, 8), jamMat);
      jamLight.rotation.x = Math.PI / 2;
      jamLight.position.set(-0.35, 1.725 + yOffset, 0.38);
      machine.add(jamLight);
    }

    // Add mats to animate references
    if (!machine.userData['animMats']) machine.userData['animMats'] = [];
    machine.userData['animMats'].push({ accentMat: pillarMat, labelMat: labelMat });
  };

  // Build single tier machine
  buildTier(0);

  // Expose an animation callback for M15 Visual Polish
  machine.userData['animate'] = (time: number, s?: MachineState) => {
    const isClean = s?.cleanliness === 'clean';
    const broken = s?.isJammed || !(s?.isPowered);

    // —— Capsule Physics (Popcorn style) ——
    let dt = time - (machine.userData['lastTime'] || time);
    machine.userData['lastTime'] = time;
    if (dt > 0.1) dt = 0.1; // clamp to prevent clipping on huge spikes
    
    // In ShopScene, time could be 0 init, so guard dt
    if (dt > 0 && machine.userData['capsules']) {
      const { mesh, data } = machine.userData['capsules'];
      const dummy = new THREE.Object3D();
      let needsMatrixUpdate = false;
      
      for (let i = 0; i < data.length; i++) {
        const d = data[i];
        
        // Gravity
        d.vel.y -= 1.8 * dt; // gravity

        // Random subtle visual popcorn bounce so they look alive!
        if (Math.random() < 0.005) {
            d.vel.y += 0.3 + Math.random() * 0.3;
            d.vel.x += (Math.random() - 0.5) * 0.4;
            d.vel.z += (Math.random() - 0.5) * 0.4;
        }

        d.pos.addScaledVector(d.vel, dt);

        // Floor collision (floor is ~1.06 + radius = 1.105)
        if (d.pos.y < 1.105) {
            d.pos.y = 1.105;
            d.vel.y *= -0.4; // bounce
            d.vel.x *= 0.9;  // friction
            d.vel.z *= 0.9;
        }

        // Wall collisions
        if (d.pos.x < -0.37) { d.pos.x = -0.37; d.vel.x *= -0.6; }
        if (d.pos.x > 0.37) { d.pos.x = 0.37; d.vel.x *= -0.6; }
        if (d.pos.z < -0.32) { d.pos.z = -0.32; d.vel.z *= -0.6; }
        if (d.pos.z > 0.32) { d.pos.z = 0.32; d.vel.z *= -0.6; }

        // Only update matrices if they are still moving meaningfully to save render time,
        // but since we add random pops we just update them if velocity is non-negligible
        if (d.vel.lengthSq() > 0.001) {
          // Add some spin
          d.rot.x += d.vel.z * dt * 5;
          d.rot.z -= d.vel.x * dt * 5;
          d.rot.y += d.vel.x * dt * 2;
          
          dummy.position.copy(d.pos);
          dummy.rotation.copy(d.rot);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
          needsMatrixUpdate = true;
        }
      }
      
      if (needsMatrixUpdate) {
        mesh.instanceMatrix.needsUpdate = true;
      }
    }

    const mats = machine.userData['animMats'] as AnimMats[];
    mats.forEach(({ accentMat, labelMat }) => {
      if (broken) {
        // Flicker chaotically
        const intensity = Math.random() > 0.8 ? 0.8 : 0.1;
        accentMat.emissiveIntensity = intensity;
        labelMat.emissiveIntensity = intensity * 0.5;
      } else if (isClean) {
        // Pulse warmly
        const intensity = 0.5 + Math.sin(time * 3) * 0.2;
        accentMat.emissiveIntensity = intensity;
        labelMat.emissiveIntensity = intensity * 0.4;
      } else {
        // Static baseline
        accentMat.emissiveIntensity = 0.3;
        labelMat.emissiveIntensity = 0.15;
      }
    });
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
