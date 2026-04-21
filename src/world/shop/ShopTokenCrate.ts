import * as THREE from 'three';
import { tagInteractable } from '../../core/InteractionTags.js';
import type { BuiltShopInteractable } from './types.js';

export function buildTokenCrate(): BuiltShopInteractable {
  const crate = new THREE.Group();
  crate.name = 'token-crate';
  tagInteractable(crate, {
    type: 'token-crate',
    prompt: 'Take token refill pack',
  });

  const shellMat = new THREE.MeshStandardMaterial({
    color: 0x2b3550,
    roughness: 0.7,
    metalness: 0.2,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x84d8ff,
    emissive: 0x5ec8ff,
    emissiveIntensity: 0.32,
    roughness: 0.42,
    metalness: 0.28,
  });
  const innerMat = new THREE.MeshStandardMaterial({
    color: 0x131c2d,
    roughness: 0.9,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.5, 0.55), shellMat);
  body.position.set(0, 0.25, 0);
  crate.add(body);

  const lip = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.05, 0.55), innerMat);
  lip.position.set(0, 0.5, 0);
  crate.add(lip);

  const stripeFront = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.08, 0.02), trimMat);
  stripeFront.position.set(0, 0.29, 0.285);
  crate.add(stripeFront);

  const stripeTop = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.02, 0.5), trimMat);
  stripeTop.position.set(0, 0.52, 0);
  crate.add(stripeTop);

  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 512;
  labelCanvas.height = 128;
  const labelCtx = labelCanvas.getContext('2d');
  if (labelCtx) {
    labelCtx.fillStyle = '#182640';
    labelCtx.fillRect(0, 0, 512, 128);
    labelCtx.fillStyle = '#88dcff';
    labelCtx.fillRect(8, 8, 496, 112);
    labelCtx.fillStyle = '#10233b';
    labelCtx.font = 'bold 42px monospace';
    labelCtx.textAlign = 'center';
    labelCtx.fillText('TOKEN REFILL', 256, 58);
    labelCtx.font = 'bold 22px monospace';
    labelCtx.fillText('TERMINAL SERVICE SUPPLY', 256, 94);
  }

  const labelTexture = new THREE.CanvasTexture(labelCanvas);
  labelTexture.colorSpace = THREE.SRGBColorSpace;
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(0.62, 0.16),
    new THREE.MeshStandardMaterial({ map: labelTexture, roughness: 0.55, metalness: 0.08 }),
  );
  label.position.set(0, 0.3, 0.286);
  crate.add(label);

  const canisterMat = new THREE.MeshStandardMaterial({
    color: 0xdfe6f5,
    roughness: 0.4,
    metalness: 0.08,
  });
  const capMat = new THREE.MeshStandardMaterial({
    color: 0x4b5d82,
    roughness: 0.52,
    metalness: 0.2,
  });

  for (let i = 0; i < 4; i += 1) {
    const canister = new THREE.Group();
    const bodyPart = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.16, 16), canisterMat);
    bodyPart.position.y = 0.08;
    canister.add(bodyPart);

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.026, 16), capMat);
    cap.position.y = 0.173;
    canister.add(cap);

    const glowBand = new THREE.Mesh(
      new THREE.TorusGeometry(0.056, 0.005, 8, 18),
      new THREE.MeshStandardMaterial({
        color: 0x7fe0ff,
        emissive: 0x65d4ff,
        emissiveIntensity: 0.45,
        roughness: 0.45,
        metalness: 0.2,
      }),
    );
    glowBand.rotation.x = Math.PI / 2;
    glowBand.position.y = 0.078;
    canister.add(glowBand);

    canister.position.set(-0.21 + i * 0.14, 0.28, -0.03 + (i % 2) * 0.08);
    crate.add(canister);
  }

  crate.position.set(3.95, 0.91, -9.0);

  return {
    group: crate,
    interactable: crate,
    collider: { name: 'token-crate', x: 3.95, z: -9.0, halfW: 0.34, halfD: 0.24 },
  };
}
