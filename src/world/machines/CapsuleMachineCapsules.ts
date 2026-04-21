import * as THREE from 'three';

export interface CapsuleData {
  pos: THREE.Vector3;
  rot: THREE.Euler;
  vel: THREE.Vector3;
  settled: boolean;
}

export interface CapsuleVisualState {
  meshTop: THREE.InstancedMesh;
  meshBottom: THREE.InstancedMesh;
  data: CapsuleData[];
  matrixDummy: THREE.Object3D;
}

export const FULL_STOCK_CAPSULE_COUNT = 45;
export const LOW_STOCK_CAPSULE_COUNT = 14;

/** Velocity threshold below which a capsule on the floor is considered settled. */
const SETTLE_THRESHOLD_SQ = 0.0005;

function createCapsuleVisualState(
  spawnFromTop: boolean,
  count = FULL_STOCK_CAPSULE_COUNT,
  rng: () => number = Math.random,
): CapsuleVisualState {
  const topGeo = new THREE.SphereGeometry(0.045, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2);
  const bottomGeo = new THREE.SphereGeometry(0.045, 12, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);

  const topMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x8fbad6,
    emissiveIntensity: 0.1,
    transparent: true,
    opacity: 0.34,
    roughness: 0.03,
    metalness: 0.0,
    depthWrite: false,
    vertexColors: true,
    side: THREE.FrontSide,
  });
  const bottomMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, // Will be overridden per-instance
    roughness: 0.2,
    metalness: 0.0,
  });

  const meshTop = new THREE.InstancedMesh(topGeo, topMat, count);
  const meshBottom = new THREE.InstancedMesh(bottomGeo, bottomMat, count);

  const data: CapsuleData[] = [];
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const topTint = new THREE.Color();

  let i = 0;
  if (spawnFromTop) {
    for (; i < count; i += 1) {
      const pos = new THREE.Vector3(
        (rng() - 0.5) * 0.56,
        1.58 + rng() * 0.24,
        (rng() - 0.5) * 0.48,
      );
      const rot = new THREE.Euler(
        rng() * Math.PI,
        rng() * Math.PI,
        rng() * Math.PI,
      );
      const vel = new THREE.Vector3(
        (rng() - 0.5) * 0.22,
        -(0.2 + rng() * 0.35),
        (rng() - 0.5) * 0.22,
      );

      data.push({ pos, rot, vel, settled: false });

      dummy.position.copy(pos);
      dummy.rotation.copy(rot);
      dummy.updateMatrix();
      meshTop.setMatrixAt(i, dummy.matrix);
      meshBottom.setMatrixAt(i, dummy.matrix);

      const hue = rng();
      color.setHSL(hue, 0.75, 0.52);
      topTint.setHSL(hue, 0.32, 0.86);
      meshBottom.setColorAt(i, color);
      meshTop.setColorAt(i, topTint);
    }
  } else {
    // Initial stocked machines start with a dense pile in the chamber.
    for (let yLevel = 0; yLevel < 3; yLevel += 1) {
      for (let xLevel = 0; xLevel < 5; xLevel += 1) {
        for (let zLevel = 0; zLevel < 3; zLevel += 1) {
          if (i >= count) break;

          const pos = new THREE.Vector3(
            -0.3 + (xLevel * 0.15) + (rng() * 0.05 - 0.025),
            1.4 + (yLevel * 0.11) + (rng() * 0.04),
            -0.2 + (zLevel * 0.2) + (rng() * 0.05 - 0.025),
          );
          const rot = new THREE.Euler(
            rng() * Math.PI,
            rng() * Math.PI,
            rng() * Math.PI,
          );
          const vel = new THREE.Vector3(
            (rng() - 0.5) * 0.2,
            0,
            (rng() - 0.5) * 0.2,
          );

          data.push({ pos, rot, vel, settled: false });

          dummy.position.copy(pos);
          dummy.rotation.copy(rot);
          dummy.updateMatrix();
          meshTop.setMatrixAt(i, dummy.matrix);
          meshBottom.setMatrixAt(i, dummy.matrix);

          const hue = rng();
          color.setHSL(hue, 0.8, 0.5);
          topTint.setHSL(hue, 0.3, 0.84);
          meshBottom.setColorAt(i, color);
          meshTop.setColorAt(i, topTint);
          i += 1;
        }
      }
    }
  }

  meshTop.instanceMatrix.needsUpdate = true;
  meshBottom.instanceMatrix.needsUpdate = true;
  if (meshTop.instanceColor) meshTop.instanceColor.needsUpdate = true;
  if (meshBottom.instanceColor) meshBottom.instanceColor.needsUpdate = true;

  return { meshTop, meshBottom, data, matrixDummy: new THREE.Object3D() };
}

function disposeInstancedMesh(mesh: THREE.InstancedMesh) {
  mesh.geometry.dispose();
  if (Array.isArray(mesh.material)) {
    mesh.material.forEach((material) => material.dispose());
  } else {
    mesh.material.dispose();
  }
}

export function setMachineCapsules(
  machine: THREE.Group,
  spawnFromTop: boolean,
  count = FULL_STOCK_CAPSULE_COUNT,
  rng: () => number = Math.random,
) {
  const current = machine.userData['capsules'] as CapsuleVisualState | undefined;
  if (current) {
    machine.remove(current.meshTop);
    machine.remove(current.meshBottom);
    disposeInstancedMesh(current.meshTop);
    disposeInstancedMesh(current.meshBottom);
  }

  const next = createCapsuleVisualState(spawnFromTop, count, rng);
  machine.userData['capsules'] = next;
  machine.add(next.meshTop);
  machine.add(next.meshBottom);
}

export function restockMachineCapsules(machine: THREE.Group) {
  // Spawn near chamber top so refill is visible as a falling animation.
  setMachineCapsules(machine, true, FULL_STOCK_CAPSULE_COUNT);
}

export function animateMachineCapsules(
  machine: THREE.Group,
  time: number,
): number {
  let dt = time - (machine.userData['lastTime'] || time);
  machine.userData['lastTime'] = time;
  if (dt > 0.1) dt = 0.1; // Clamp to prevent clipping on huge spikes.

  const capsules = machine.userData['capsules'] as CapsuleVisualState | undefined;
  if (dt <= 0 || !capsules) {
    return dt;
  }

  const { meshTop, meshBottom, data, matrixDummy: dummy } = capsules;
  let needsMatrixUpdate = false;

  for (let i = 0; i < data.length; i += 1) {
    const capsule = data[i]!;

    // Capsule-to-Capsule Fake Physics (O(N^2) but N=45 so it's ~900 checks = 0ms overhead)
    for (let j = i + 1; j < data.length; j += 1) {
      const other = data[j]!;
      const dx = other.pos.x - capsule.pos.x;
      const dy = other.pos.y - capsule.pos.y;
      const dz = other.pos.z - capsule.pos.z;
      const distSq = dx * dx + dy * dy + dz * dz;

      const RADIUS = 0.045;
      const MIN_DIST = RADIUS * 2;
      const MIN_DIST_SQ = MIN_DIST * MIN_DIST;

      // Only evaluate if they are intersecting
      if (distSq > 0.00001 && distSq < MIN_DIST_SQ) {
        const dist = Math.sqrt(distSq);
        const overlap = MIN_DIST - dist;

        const nx = dx / dist;
        const ny = dy / dist;
        const nz = dz / dist;

        // Force wake resting capsules if hit hard enough
        if (capsule.settled && other.vel.lengthSq() > 0.02) capsule.settled = false;
        if (other.settled && capsule.vel.lengthSq() > 0.02) other.settled = false;

        if (!capsule.settled && !other.settled) {
          // Push both apart evenly
          const push = overlap * 0.5;
          capsule.pos.x -= nx * push;
          capsule.pos.y -= ny * push;
          capsule.pos.z -= nz * push;
          other.pos.x += nx * push;
          other.pos.y += ny * push;
          other.pos.z += nz * push;

          // Fake velocity dampening and bounce transfer (slows them down organically)
          capsule.vel.x -= nx * 0.15;
          capsule.vel.z -= nz * 0.15;
          other.vel.x += nx * 0.15;
          other.vel.z += nz * 0.15;
        } else if (!capsule.settled) {
          // One is settled acting as a wall, so push the active one fully out
          capsule.pos.x -= nx * overlap;
          capsule.pos.y -= ny * overlap;
          capsule.pos.z -= nz * overlap;
        } else if (!other.settled) {
          other.pos.x += nx * overlap;
          other.pos.y += ny * overlap;
          other.pos.z += nz * overlap;
        }
      }
    }

    // Skip settled capsules from gravity/wall physics
    if (capsule.settled) continue;

    // Gravity.
    capsule.vel.y -= 1.8 * dt;

    capsule.pos.addScaledVector(capsule.vel, dt);

    // Floor collision (floor is ~1.06 + radius = 1.105).
    if (capsule.pos.y < 1.105) {
      capsule.pos.y = 1.105;
      capsule.vel.y *= -0.4;
      capsule.vel.x *= 0.9;
      capsule.vel.z *= 0.9;
    }

    // Wall collisions.
    if (capsule.pos.x < -0.37) { capsule.pos.x = -0.37; capsule.vel.x *= -0.6; }
    if (capsule.pos.x > 0.37) { capsule.pos.x = 0.37; capsule.vel.x *= -0.6; }
    if (capsule.pos.z < -0.32) { capsule.pos.z = -0.32; capsule.vel.z *= -0.6; }
    if (capsule.pos.z > 0.32) { capsule.pos.z = 0.32; capsule.vel.z *= -0.6; }

    // Check if capsule has settled (on the floor and barely moving).
    if (capsule.pos.y <= 1.106 && capsule.vel.lengthSq() < SETTLE_THRESHOLD_SQ) {
      capsule.settled = true;
      capsule.vel.set(0, 0, 0);
      // Do one final matrix update to lock its resting position.
      dummy.position.copy(capsule.pos);
      dummy.rotation.copy(capsule.rot);
      dummy.updateMatrix();
      meshTop.setMatrixAt(i, dummy.matrix);
      meshBottom.setMatrixAt(i, dummy.matrix);
      needsMatrixUpdate = true;
      continue;
    }

    // Update matrix only when movement is meaningful.
    if (capsule.vel.lengthSq() > 0.001) {
      capsule.rot.x += capsule.vel.z * dt * 5;
      capsule.rot.z -= capsule.vel.x * dt * 5;
      capsule.rot.y += capsule.vel.x * dt * 2;

      dummy.position.copy(capsule.pos);
      dummy.rotation.copy(capsule.rot);
      dummy.updateMatrix();
      meshTop.setMatrixAt(i, dummy.matrix);
      meshBottom.setMatrixAt(i, dummy.matrix);
      needsMatrixUpdate = true;
    }
  }

  if (needsMatrixUpdate) {
    meshTop.instanceMatrix.needsUpdate = true;
    meshBottom.instanceMatrix.needsUpdate = true;
  }

  return dt;
}
