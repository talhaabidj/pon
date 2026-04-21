import * as THREE from 'three';
import { tagInteractable } from '../../core/InteractionTags.js';
import type { BuiltShopInteractable, ShopCollider } from './types.js';

export interface BuiltStorageCrate extends BuiltShopInteractable {
  spillCapsules: THREE.Object3D[];
  spillColliders: ShopCollider[];
}

export function buildStorageCrate(): BuiltStorageCrate {
  const crate = new THREE.Group();
  crate.name = 'storage-crate';
  tagInteractable(crate, {
    type: 'storage-crate',
    prompt: 'Take refill canister',
  });
  crate.position.set(5.25, 0.91, -9.0);

  const palletMat = new THREE.MeshStandardMaterial({
    color: 0x2a2119,
    roughness: 0.92,
  });
  const crateWoodMat = new THREE.MeshStandardMaterial({
    color: 0x5b4633,
    roughness: 0.82,
  });
  const crateInnerMat = new THREE.MeshStandardMaterial({
    color: 0x261d16,
    roughness: 0.95,
  });
  const crateMetalMat = new THREE.MeshStandardMaterial({
    color: 0x90939b,
    roughness: 0.34,
    metalness: 0.7,
  });

  // pallet removed from view
  const palletBase = new THREE.Mesh(new THREE.BoxGeometry(0, 0, 0), palletMat);
  palletBase.position.set(0, -0.05, 0);
  crate.add(palletBase);

  for (let i = -1; i <= 1; i += 1) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0, 0, 0), palletMat);
    slat.position.set(0, -0.05, i * 0.24);
    crate.add(slat);
  }

  const outerShell = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.46, 0.66), crateWoodMat);
  outerShell.position.set(0, 0.18, 0);
  crate.add(outerShell);

  const innerCavity = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.24, 0.52), crateInnerMat);
  innerCavity.position.set(0, 0.27, 0);
  crate.add(innerCavity);

  const lipFront = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.05, 0.06), crateWoodMat);
  lipFront.position.set(0, 0.39, 0.3);
  crate.add(lipFront);
  const lipBack = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.05, 0.06), crateWoodMat);
  lipBack.position.set(0, 0.39, -0.3);
  crate.add(lipBack);
  const lipLeft = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.54), crateWoodMat);
  lipLeft.position.set(-0.41, 0.39, 0);
  crate.add(lipLeft);
  const lipRight = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.54), crateWoodMat);
  lipRight.position.set(0.41, 0.39, 0);
  crate.add(lipRight);

  const cornerGeo = new THREE.BoxGeometry(0.045, 0.5, 0.045);
  const cornerOffsets: Array<[number, number]> = [
    [-0.395, -0.285],
    [0.395, -0.285],
    [-0.395, 0.285],
    [0.395, 0.285],
  ];
  cornerOffsets.forEach(([x, z]) => {
    const corner = new THREE.Mesh(cornerGeo, crateMetalMat);
    corner.position.set(x, 0.18, z);
    crate.add(corner);
  });



  const handleLeft = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.24), crateInnerMat);
  handleLeft.position.set(-0.45, 0.19, 0);
  crate.add(handleLeft);
  const handleRight = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.24), crateInnerMat);
  handleRight.position.set(0.45, 0.19, 0);
  crate.add(handleRight);

  const decalCanvas = document.createElement('canvas');
  decalCanvas.width = 512;
  decalCanvas.height = 128;
  const decalCtx = decalCanvas.getContext('2d');
  if (decalCtx) {
    decalCtx.fillStyle = '#1e1b17';
    decalCtx.fillRect(0, 0, 512, 128);

    decalCtx.fillStyle = '#e1ad38';
    decalCtx.fillRect(8, 8, 496, 112);

    decalCtx.fillStyle = '#251d12';
    decalCtx.font = 'bold 44px monospace';
    decalCtx.textAlign = 'center';
    decalCtx.fillText('CAPSULE REFILL', 256, 62);
    decalCtx.font = 'bold 24px monospace';
    decalCtx.fillText('FRAGILE - HANDLE WITH CARE', 256, 96);
  }
  const decalTexture = new THREE.CanvasTexture(decalCanvas);
  decalTexture.colorSpace = THREE.SRGBColorSpace;
  const decalMat = new THREE.MeshStandardMaterial({
    map: decalTexture,
    roughness: 0.58,
    metalness: 0.05,
  });
  const frontDecal = new THREE.Mesh(new THREE.PlaneGeometry(0.76, 0.2), decalMat);
  frontDecal.position.set(0, 0.21, 0.342);
  crate.add(frontDecal);

  const canisterBodyMat = new THREE.MeshStandardMaterial({
    color: 0xe8ebef,
    roughness: 0.42,
    metalness: 0.12,
  });
  const canisterCapMat = new THREE.MeshStandardMaterial({
    color: 0x4f5869,
    roughness: 0.5,
    metalness: 0.2,
  });
  for (let i = 0; i < 3; i += 1) {
    const canister = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.22, 18), canisterBodyMat);
    body.position.y = 0.11;
    canister.add(body);

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.04, 18), canisterCapMat);
    cap.position.y = 0.24;
    canister.add(cap);

    const stripe = new THREE.Mesh(
      new THREE.TorusGeometry(0.08, 0.008, 8, 20),
      new THREE.MeshStandardMaterial({ color: 0x6fc0ff, roughness: 0.45, metalness: 0.25 }),
    );
    stripe.rotation.x = Math.PI / 2;
    stripe.position.y = 0.1;
    canister.add(stripe);

    canister.position.set(-0.2 + i * 0.2, 0.15, -0.03 + (i % 2) * 0.08);
    crate.add(canister);
  }

  const spillCapsules: THREE.Object3D[] = [];
  const topGeo = new THREE.SphereGeometry(0.04, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2);
  const bottomGeo = new THREE.SphereGeometry(0.04, 12, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  const clearMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.35,
    roughness: 0.1,
    metalness: 0.1,
    side: THREE.DoubleSide
  });

  const spillColliders: { name: string; x: number; z: number; halfW: number; halfD: number }[] = [];

  for (let i = 0; i < 8; i += 1) {
    const spillGroup = new THREE.Group();
    const colorMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL((i * 0.14) % 1, 0.62, 0.54),
      roughness: 0.3,
      metalness: 0.1,
    });
    
    const topMesh = new THREE.Mesh(topGeo, clearMat);
    const bottomMesh = new THREE.Mesh(bottomGeo, colorMat);
    spillGroup.add(topMesh);
    spillGroup.add(bottomMesh);

    // Give them a random resting orientation
    spillGroup.rotation.x = Math.random() * Math.PI;
    spillGroup.rotation.z = Math.random() * Math.PI;

    const px = 4.78 + Math.random() * 0.58;
    const pz = -8.72 + Math.random() * 0.34;
    spillGroup.position.set(px, 0.04, pz);
    spillCapsules.push(spillGroup);

    spillColliders.push({
      name: `spill-cap-${i}`,
      x: px,
      z: pz,
      halfW: 0.04,
      halfD: 0.04,
    });
  }

  return {
    group: crate,
    interactable: crate,
    collider: { name: 'storage-crate', x: 5.25, z: -9.0, halfW: 0.46, halfD: 0.34 },
    spillCapsules,
    spillColliders,
  };
}
