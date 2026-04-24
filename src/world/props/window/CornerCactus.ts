import * as THREE from 'three';

export interface CornerCactusParams {
  baseX: number;
  baseY: number;
  baseZ: number;
}

export function addCornerCactus(
  root: THREE.Group,
  params: CornerCactusParams,
) {
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.041, 0.047, 0.058, 14),
    new THREE.MeshStandardMaterial({ color: 0x8a6347, roughness: 0.88 }),
  );
  pot.position.set(params.baseX, params.baseY, params.baseZ);
  root.add(pot);

  const potRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.041, 0.004, 8, 14),
    new THREE.MeshStandardMaterial({ color: 0x9b7354, roughness: 0.84 }),
  );
  potRim.position.set(params.baseX, params.baseY + 0.027, params.baseZ);
  potRim.rotation.x = Math.PI / 2;
  root.add(potRim);

  const soil = new THREE.Mesh(
    new THREE.CylinderGeometry(0.033, 0.035, 0.012, 10),
    new THREE.MeshStandardMaterial({ color: 0x5a4739, roughness: 0.94 }),
  );
  soil.position.set(params.baseX, params.baseY + 0.027, params.baseZ);
  root.add(soil);

  const cactusBodyMat = new THREE.MeshStandardMaterial({ color: 0x4c9a64, roughness: 0.76 });
  const cactusShadeMat = new THREE.MeshStandardMaterial({ color: 0x3f8655, roughness: 0.8 });

  const cactusCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.018, 0.092, 6),
    cactusBodyMat,
  );
  cactusCore.position.set(params.baseX, params.baseY + 0.073, params.baseZ);
  root.add(cactusCore);

  const leftArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.009, 0.011, 0.06, 6),
    cactusShadeMat,
  );
  leftArm.position.set(params.baseX - 0.017, params.baseY + 0.063, params.baseZ + 0.003);
  leftArm.rotation.z = 0.56;
  root.add(leftArm);

  const rightArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.01, 0.052, 6),
    cactusShadeMat,
  );
  rightArm.position.set(params.baseX + 0.016, params.baseY + 0.06, params.baseZ - 0.003);
  rightArm.rotation.z = -0.5;
  root.add(rightArm);

  for (const offset of [-0.008, 0, 0.008] as const) {
    const rib = new THREE.Mesh(
      new THREE.BoxGeometry(0.003, 0.082, 0.003),
      cactusShadeMat,
    );
    rib.position.set(params.baseX + offset, params.baseY + 0.073, params.baseZ + 0.013);
    root.add(rib);
  }

  const spikeMat = new THREE.MeshStandardMaterial({ color: 0xd9d3c6, roughness: 0.8 });
  for (const [sx, sy, sz] of [
    [params.baseX, params.baseY + 0.108, params.baseZ + 0.011],
    [params.baseX - 0.013, params.baseY + 0.08, params.baseZ + 0.016],
    [params.baseX + 0.013, params.baseY + 0.076, params.baseZ + 0.014],
    [params.baseX, params.baseY + 0.063, params.baseZ + 0.02],
  ] as const) {
    const spike = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.008, 0.002), spikeMat);
    spike.position.set(sx, sy, sz);
    root.add(spike);
  }
}
