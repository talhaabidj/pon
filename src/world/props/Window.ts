/**
 * Window — A bedroom window with frame and curtains.
 * Shows a dark night sky gradient behind it.
 */

import * as THREE from 'three';

export function createWindow(): THREE.Group {
  const win = new THREE.Group();
  win.name = 'window';

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0xd4cfc0,
    roughness: 0.7,
  });

  // —— Frame ——
  const frameWidth = 1.0;
  const frameHeight = 0.9;
  const frameDepth = 0.06;
  const thickness = 0.05;

  // Top
  const topFrame = new THREE.Mesh(
    new THREE.BoxGeometry(frameWidth, thickness, frameDepth),
    frameMat,
  );
  topFrame.position.set(0, frameHeight / 2, 0);
  win.add(topFrame);

  // Bottom
  const botFrame = new THREE.Mesh(
    new THREE.BoxGeometry(frameWidth, thickness, frameDepth),
    frameMat,
  );
  botFrame.position.set(0, -frameHeight / 2, 0);
  win.add(botFrame);

  // Left
  const leftFrame = new THREE.Mesh(
    new THREE.BoxGeometry(thickness, frameHeight, frameDepth),
    frameMat,
  );
  leftFrame.position.set(-frameWidth / 2 + thickness / 2, 0, 0);
  win.add(leftFrame);

  // Right
  const rightFrame = new THREE.Mesh(
    new THREE.BoxGeometry(thickness, frameHeight, frameDepth),
    frameMat,
  );
  rightFrame.position.set(frameWidth / 2 - thickness / 2, 0, 0);
  win.add(rightFrame);

  // Center cross
  const crossV = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, frameHeight - thickness * 2, frameDepth),
    frameMat,
  );
  crossV.position.set(0, 0, 0);
  win.add(crossV);

  const crossH = new THREE.Mesh(
    new THREE.BoxGeometry(frameWidth - thickness * 2, 0.03, frameDepth),
    frameMat,
  );
  crossH.position.set(0, 0, 0);
  win.add(crossH);

  // —— Night sky glass (emissive dark blue) ——
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a1f,
    emissive: 0x0d0d2a,
    emissiveIntensity: 0.15,
    transparent: true,
    opacity: 0.9,
    roughness: 0.1,
    metalness: 0.1,
  });

  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(
      frameWidth - thickness * 2,
      frameHeight - thickness * 2,
    ),
    glassMat,
  );
  glass.position.set(0, 0, -0.01);
  win.add(glass);

  // —— Small stars (tiny emissive dots visible through window) ——
  const starMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xccccff,
    emissiveIntensity: 1.0,
  });

  const starPositions = [
    [-0.25, 0.2],
    [0.15, 0.3],
    [-0.1, -0.1],
    [0.3, 0.05],
    [-0.35, 0.1],
    [0.05, 0.25],
  ];

  for (const [x, y] of starPositions) {
    const star = new THREE.Mesh(
      new THREE.PlaneGeometry(0.008, 0.008),
      starMat,
    );
    star.position.set(x!, y!, -0.005);
    win.add(star);
  }

  // —— Curtains (simple panels on each side) ——
  const curtainMat = new THREE.MeshStandardMaterial({
    color: 0x2d2a3e,
    roughness: 0.95,
    side: THREE.DoubleSide,
  });

  const leftCurtain = new THREE.Mesh(
    new THREE.PlaneGeometry(0.25, frameHeight + 0.15),
    curtainMat,
  );
  leftCurtain.position.set(-frameWidth / 2 - 0.08, 0.02, 0.04);
  win.add(leftCurtain);

  const rightCurtain = new THREE.Mesh(
    new THREE.PlaneGeometry(0.25, frameHeight + 0.15),
    curtainMat,
  );
  rightCurtain.position.set(frameWidth / 2 + 0.08, 0.02, 0.04);
  win.add(rightCurtain);

  return win;
}
