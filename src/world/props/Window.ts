/**
 * Window — Detailed corner window for the bedroom.
 *
 * Features:
 * - extended left pane toward ladder shelf,
 * - side pane wrapping the room corner,
 * - layered starry void with depth,
 * - aligned curtain panels,
 * - matching cactus on the corner sill.
 */

import * as THREE from 'three';
import {
  STAR_LAYOUT_FAR,
  STAR_LAYOUT_NEAR,
  addBackStarLayer,
  addBackStarScatter,
  addNebulaDisk,
  addSideStarLayer,
  addSideStarScatter,
} from './window/VoidSkyPrimitives.js';
import { addCornerCactus } from './window/CornerCactus.js';
import { addWindowCurtains } from './window/WindowCurtains.js';

export function createWindow(): THREE.Group {
  const win = new THREE.Group();
  win.name = 'window';

  // Local origin: interior corner where back wall and right wall panes meet.
  const backPaneW = 2.02;
  const sidePaneW = 0.86;
  const paneH = 0.58;
  const frameT = 0.04;
  const frameD = 0.06;

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0xdccfb8,
    roughness: 0.72,
    metalness: 0.04,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0xeee5d5,
    roughness: 0.68,
    metalness: 0.02,
  });
  const sillMat = new THREE.MeshStandardMaterial({
    color: 0xd9c8ab,
    roughness: 0.76,
    metalness: 0.03,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x9eb6d8,
    transparent: true,
    opacity: 0.26,
    transmission: 0.72,
    thickness: 0.016,
    ior: 1.45,
    roughness: 0.05,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  // Corner post.
  const cornerPost = new THREE.Mesh(
    new THREE.BoxGeometry(frameT, paneH + frameT * 2, frameD),
    frameMat,
  );
  win.add(cornerPost);

  // Back-facing pane frame (longer span toward ladder shelf).
  const backTop = new THREE.Mesh(
    new THREE.BoxGeometry(backPaneW + frameT, frameT, frameD),
    frameMat,
  );
  backTop.position.set(-backPaneW / 2, paneH / 2 + frameT / 2, 0);
  win.add(backTop);

  const backBottom = new THREE.Mesh(
    new THREE.BoxGeometry(backPaneW + frameT, frameT, frameD),
    frameMat,
  );
  backBottom.position.set(-backPaneW / 2, -paneH / 2 - frameT / 2, 0);
  win.add(backBottom);

  const backLeft = new THREE.Mesh(
    new THREE.BoxGeometry(frameT, paneH + frameT * 2, frameD),
    frameMat,
  );
  backLeft.position.set(-backPaneW - frameT / 2, 0, 0);
  win.add(backLeft);

  // Side-facing pane frame (wraps the corner on right wall).
  const sideTop = new THREE.Mesh(
    new THREE.BoxGeometry(frameD, frameT, sidePaneW + frameT),
    frameMat,
  );
  sideTop.position.set(0, paneH / 2 + frameT / 2, sidePaneW / 2);
  win.add(sideTop);

  const sideBottom = new THREE.Mesh(
    new THREE.BoxGeometry(frameD, frameT, sidePaneW + frameT),
    frameMat,
  );
  sideBottom.position.set(0, -paneH / 2 - frameT / 2, sidePaneW / 2);
  win.add(sideBottom);

  const sideFar = new THREE.Mesh(
    new THREE.BoxGeometry(frameD, paneH + frameT * 2, frameT),
    frameMat,
  );
  sideFar.position.set(0, 0, sidePaneW + frameT / 2);
  win.add(sideFar);

  // Inner trims.
  const backTrimTop = new THREE.Mesh(
    new THREE.BoxGeometry(backPaneW, 0.014, 0.016),
    trimMat,
  );
  backTrimTop.position.set(-backPaneW / 2, paneH / 2 - 0.012, 0.022);
  win.add(backTrimTop);

  const backTrimBottom = new THREE.Mesh(
    new THREE.BoxGeometry(backPaneW, 0.014, 0.016),
    trimMat,
  );
  backTrimBottom.position.set(-backPaneW / 2, -paneH / 2 + 0.012, 0.022);
  win.add(backTrimBottom);

  const backTrimLeft = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, paneH, 0.016),
    trimMat,
  );
  backTrimLeft.position.set(-backPaneW + 0.012, 0, 0.022);
  win.add(backTrimLeft);

  const backTrimRight = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, paneH, 0.016),
    trimMat,
  );
  backTrimRight.position.set(-0.012, 0, 0.022);
  win.add(backTrimRight);

  const sideTrimTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.016, 0.014, sidePaneW),
    trimMat,
  );
  sideTrimTop.position.set(-0.022, paneH / 2 - 0.012, sidePaneW / 2);
  win.add(sideTrimTop);

  const sideTrimBottom = new THREE.Mesh(
    new THREE.BoxGeometry(0.016, 0.014, sidePaneW),
    trimMat,
  );
  sideTrimBottom.position.set(-0.022, -paneH / 2 + 0.012, sidePaneW / 2);
  win.add(sideTrimBottom);

  const sideTrimNear = new THREE.Mesh(
    new THREE.BoxGeometry(0.016, paneH, 0.014),
    trimMat,
  );
  sideTrimNear.position.set(-0.022, 0, 0.012);
  win.add(sideTrimNear);

  const sideTrimFar = new THREE.Mesh(
    new THREE.BoxGeometry(0.016, paneH, 0.014),
    trimMat,
  );
  sideTrimFar.position.set(-0.022, 0, sidePaneW - 0.012);
  win.add(sideTrimFar);

  // Exterior dark planes for depth.
  const backOutside = new THREE.Mesh(
    new THREE.PlaneGeometry(backPaneW, paneH),
    new THREE.MeshBasicMaterial({ color: 0x050a12, side: THREE.DoubleSide }),
  );
  backOutside.position.set(-backPaneW / 2, 0, -0.014);
  backOutside.renderOrder = 1;
  win.add(backOutside);

  const backOutsideGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(backPaneW, paneH),
    new THREE.MeshBasicMaterial({
      color: 0x1a2748,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  backOutsideGlow.position.set(-backPaneW / 2 + 0.01, 0.008, -0.0132);
  backOutsideGlow.renderOrder = 2;
  win.add(backOutsideGlow);

  const backDepthHaze = new THREE.Mesh(
    new THREE.PlaneGeometry(backPaneW, paneH),
    new THREE.MeshBasicMaterial({
      color: 0x2a395e,
      transparent: true,
      opacity: 0.11,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  backDepthHaze.position.set(-backPaneW / 2 - 0.02, -0.02, -0.0127);
  backDepthHaze.renderOrder = 2;
  win.add(backDepthHaze);

  const sideOutside = new THREE.Mesh(
    new THREE.PlaneGeometry(sidePaneW, paneH),
    new THREE.MeshBasicMaterial({ color: 0x050a12, side: THREE.DoubleSide }),
  );
  sideOutside.rotation.y = -Math.PI / 2;
  sideOutside.position.set(0.014, 0, sidePaneW / 2);
  sideOutside.renderOrder = 1;
  win.add(sideOutside);

  const sideOutsideGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(sidePaneW, paneH),
    new THREE.MeshBasicMaterial({
      color: 0x1a2748,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  sideOutsideGlow.rotation.y = -Math.PI / 2;
  sideOutsideGlow.position.set(0.0132, 0.01, sidePaneW / 2 - 0.01);
  sideOutsideGlow.renderOrder = 2;
  win.add(sideOutsideGlow);

  const sideDepthHaze = new THREE.Mesh(
    new THREE.PlaneGeometry(sidePaneW, paneH),
    new THREE.MeshBasicMaterial({
      color: 0x27365a,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  sideDepthHaze.rotation.y = -Math.PI / 2;
  sideDepthHaze.position.set(0.0124, -0.015, sidePaneW / 2 + 0.01);
  sideDepthHaze.renderOrder = 2;
  win.add(sideDepthHaze);

  // Nebula + atmospheric layers.
  addNebulaDisk(win, -backPaneW * 0.4, 0.14, -0.0128, 0.18, 0x304880, 0.065, 3);
  addNebulaDisk(win, -backPaneW * 0.14, -0.04, -0.0126, 0.16, 0x2e5d8a, 0.055, 3);
  addNebulaDisk(win, 0.0138, 0.09, sidePaneW * 0.34, 0.13, 0x2f4b78, 0.05, 3, -Math.PI / 2);
  addNebulaDisk(win, 0.013, -0.08, sidePaneW * 0.66, 0.11, 0x3d3f78, 0.045, 3, -Math.PI / 2);

  // Moon and halo on back pane.
  const moonGlow = new THREE.Mesh(
    new THREE.CircleGeometry(0.07, 20),
    new THREE.MeshBasicMaterial({
      color: 0xd6e1ff,
      transparent: true,
      opacity: 0.09,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  moonGlow.position.set(-0.3, 0.2, -0.0126);
  moonGlow.userData['voidMoonGlow'] = true;
  moonGlow.userData['baseOpacity'] = 0.09;
  moonGlow.renderOrder = 4;
  win.add(moonGlow);

  const moon = new THREE.Mesh(
    new THREE.CircleGeometry(0.048, 20),
    new THREE.MeshBasicMaterial({
      color: 0xf2f5ff,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  moon.position.set(-0.3, 0.2, -0.0122);
  moon.userData['voidMoon'] = true;
  moon.renderOrder = 5;
  win.add(moon);

  addBackStarLayer(
    win,
    -backPaneW / 2,
    backPaneW,
    paneH,
    -0.012,
    STAR_LAYOUT_FAR,
    0xb8c8ff,
    0.78,
    6,
  );
  addBackStarLayer(
    win,
    -backPaneW / 2,
    backPaneW,
    paneH,
    -0.0112,
    STAR_LAYOUT_NEAR,
    0xe5eeff,
    0.92,
    7,
  );

  addSideStarLayer(
    win,
    sidePaneW / 2,
    sidePaneW,
    paneH,
    0.0145,
    STAR_LAYOUT_FAR,
    0xafbfff,
    0.72,
    6,
  );
  addSideStarLayer(
    win,
    sidePaneW / 2,
    sidePaneW,
    paneH,
    0.0128,
    STAR_LAYOUT_NEAR,
    0xe0eaff,
    0.88,
    7,
  );

  // Additional tiny stars remove visible patterning and increase realism.
  addBackStarScatter(
    win,
    -backPaneW / 2,
    backPaneW,
    paneH,
    -0.0116,
    26,
    0xdce6ff,
    0.68,
    8,
    9013,
  );
  addSideStarScatter(
    win,
    sidePaneW / 2,
    sidePaneW,
    paneH,
    0.0138,
    16,
    0xdce6ff,
    0.64,
    8,
    1193,
  );

  // Accent violet stars echo the desktop/start-screen void palette.
  addBackStarScatter(
    win,
    -backPaneW / 2,
    backPaneW,
    paneH,
    -0.01145,
    14,
    0x8b87ff,
    0.5,
    8,
    5511,
  );
  addSideStarScatter(
    win,
    sidePaneW / 2,
    sidePaneW,
    paneH,
    0.0136,
    10,
    0x8b87ff,
    0.48,
    8,
    6647,
  );

  addNebulaDisk(win, -backPaneW * 0.58, -0.05, -0.01255, 0.2, 0x5f56b5, 0.06, 3);
  addNebulaDisk(win, 0.0132, -0.01, sidePaneW * 0.5, 0.15, 0x5a5fb8, 0.055, 3, -Math.PI / 2);

  const backVoidParticleCount = 90;
  const backPositions = new Float32Array(backVoidParticleCount * 3);
  for (let i = 0; i < backVoidParticleCount; i += 1) {
    backPositions[i * 3] = (Math.random() - 0.5) * backPaneW * 0.85;
    backPositions[i * 3 + 1] = (Math.random() - 0.5) * paneH * 0.86;
    backPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.002;
  }
  const backVoidGeo = new THREE.BufferGeometry();
  backVoidGeo.setAttribute('position', new THREE.BufferAttribute(backPositions, 3));
  const backVoidMat = new THREE.PointsMaterial({
    color: 0x7c6ef0,
    size: 0.0075,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const backVoidField = new THREE.Points(backVoidGeo, backVoidMat);
  backVoidField.position.set(-backPaneW / 2, 0, -0.0113);
  backVoidField.renderOrder = 9;
  backVoidField.userData['voidField'] = true;
  backVoidField.userData['baseOpacity'] = 0.4;
  backVoidField.userData['phase'] = 1.3;
  win.add(backVoidField);

  const sideVoidParticleCount = 58;
  const sidePositions = new Float32Array(sideVoidParticleCount * 3);
  for (let i = 0; i < sideVoidParticleCount; i += 1) {
    sidePositions[i * 3] = (Math.random() - 0.5) * sidePaneW * 0.8;
    sidePositions[i * 3 + 1] = (Math.random() - 0.5) * paneH * 0.84;
    sidePositions[i * 3 + 2] = (Math.random() - 0.5) * 0.0015;
  }
  const sideVoidGeo = new THREE.BufferGeometry();
  sideVoidGeo.setAttribute('position', new THREE.BufferAttribute(sidePositions, 3));
  const sideVoidMat = new THREE.PointsMaterial({
    color: 0x7087ff,
    size: 0.0072,
    transparent: true,
    opacity: 0.36,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const sideVoidField = new THREE.Points(sideVoidGeo, sideVoidMat);
  sideVoidField.position.set(0.0128, 0, sidePaneW / 2);
  sideVoidField.rotation.y = -Math.PI / 2;
  sideVoidField.renderOrder = 9;
  sideVoidField.userData['voidField'] = true;
  sideVoidField.userData['baseOpacity'] = 0.36;
  sideVoidField.userData['phase'] = 2.7;
  win.add(sideVoidField);

  // Glass panes.
  const backGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(backPaneW, paneH),
    glassMat,
  );
  backGlass.position.set(-backPaneW / 2, 0, -0.004);
  backGlass.renderOrder = 10;
  win.add(backGlass);

  const sideGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(sidePaneW, paneH),
    glassMat,
  );
  sideGlass.rotation.y = -Math.PI / 2;
  sideGlass.position.set(0.004, 0, sidePaneW / 2);
  sideGlass.renderOrder = 10;
  win.add(sideGlass);

  // Pane sheen.
  const backSheen = new THREE.Mesh(
    new THREE.PlaneGeometry(backPaneW, paneH),
    new THREE.MeshBasicMaterial({
      color: 0xdbe8ff,
      transparent: true,
      opacity: 0.055,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  backSheen.position.set(-backPaneW / 2 + 0.025, 0.02, -0.0028);
  backSheen.renderOrder = 11;
  win.add(backSheen);

  const sideSheen = new THREE.Mesh(
    new THREE.PlaneGeometry(sidePaneW, paneH),
    new THREE.MeshBasicMaterial({
      color: 0xdbe8ff,
      transparent: true,
      opacity: 0.05,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  sideSheen.rotation.y = -Math.PI / 2;
  sideSheen.position.set(0.0028, 0.02, sidePaneW / 2 - 0.01);
  sideSheen.renderOrder = 11;
  win.add(sideSheen);

  // Interior sills.
  const sillY = -paneH / 2 - frameT - 0.02;

  const backSill = new THREE.Mesh(
    new THREE.BoxGeometry(backPaneW + 0.1, 0.03, 0.14),
    sillMat,
  );
  backSill.position.set(-backPaneW / 2, sillY, 0.062);
  win.add(backSill);

  const sideSill = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.03, sidePaneW + 0.12),
    sillMat,
  );
  sideSill.position.set(-0.062, sillY, sidePaneW / 2);
  win.add(sideSill);

  addWindowCurtains(win, {
    backPaneW,
    sidePaneW,
    paneH,
    frameT,
  });

  addCornerCactus(win, {
    baseX: -0.056,
    baseY: sillY + 0.034,
    baseZ: 0.22,
  });

  const animatedStars: THREE.Mesh[] = [];
  const animatedNebulae: THREE.Mesh[] = [];
  const animatedFields: THREE.Points[] = [];
  let animatedMoonGlow: THREE.Mesh | null = null;
  let animatedMoon: THREE.Mesh | null = null;

  win.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    if (obj.userData['voidStar']) animatedStars.push(obj);
    if (obj.userData['voidNebula']) animatedNebulae.push(obj);
    if (obj.userData['voidMoonGlow']) animatedMoonGlow = obj;
    if (obj.userData['voidMoon']) animatedMoon = obj;
  });

  win.traverse((obj) => {
    if (obj instanceof THREE.Points && obj.userData['voidField']) {
      animatedFields.push(obj);
    }
  });

  // Animated twinkle/drift gives a subtle desktop-like living void effect.
  win.userData['animateVoid'] = (timeSeconds: number) => {
    for (const star of animatedStars) {
      const seed = (star.userData['twinkleOffset'] as number) ?? 0;
      const twinkle = 0.78 + Math.sin(timeSeconds * 2.9 + seed) * 0.34;
      star.scale.setScalar(twinkle);

      const mat = star.material as THREE.MeshBasicMaterial;
      const baseOpacity = (star.userData['baseOpacity'] as number) ?? mat.opacity;
      mat.opacity = baseOpacity * (0.62 + Math.sin(timeSeconds * 3.9 + seed * 1.37) * 0.38);
    }

    for (const nebula of animatedNebulae) {
      const drift = (nebula.userData['driftOffset'] as number) ?? 0;
      const baseY = (nebula.userData['baseY'] as number) ?? nebula.position.y;
      const baseX = (nebula.userData['baseX'] as number) ?? nebula.position.x;
      const mat = nebula.material as THREE.MeshBasicMaterial;
      const baseOpacity = (nebula.userData['baseOpacity'] as number) ?? mat.opacity;

      nebula.position.y = baseY + Math.sin(timeSeconds * 0.38 + drift) * 0.012;
      nebula.position.x = baseX + Math.sin(timeSeconds * 0.31 + drift * 0.7) * 0.01;
      nebula.rotation.z = Math.sin(timeSeconds * 0.16 + drift) * 0.09;
      mat.opacity = baseOpacity * (0.7 + Math.sin(timeSeconds * 0.9 + drift) * 0.3);
    }

    for (const field of animatedFields) {
      const phase = (field.userData['phase'] as number) ?? 0;
      const baseOpacity = (field.userData['baseOpacity'] as number) ?? 0.35;
      const fieldMat = field.material as THREE.PointsMaterial;

      field.rotation.z = Math.sin(timeSeconds * 0.24 + phase) * 0.16;
      field.rotation.x = Math.sin(timeSeconds * 0.2 + phase * 0.8) * 0.04;
      fieldMat.opacity = baseOpacity * (0.72 + Math.sin(timeSeconds * 1.2 + phase) * 0.28);
      fieldMat.size = 0.0068 + Math.sin(timeSeconds * 0.9 + phase) * 0.0018;
    }

    if (animatedMoonGlow) {
      const moonGlowMat = animatedMoonGlow.material as THREE.MeshBasicMaterial;
      const baseOpacity = (animatedMoonGlow.userData['baseOpacity'] as number) ?? 0.09;
      moonGlowMat.opacity = baseOpacity * (0.72 + Math.sin(timeSeconds * 1.4 + 2.1) * 0.28);
    }

    if (animatedMoon) {
      const pulse = 0.985 + Math.sin(timeSeconds * 0.75 + 0.4) * 0.015;
      animatedMoon.scale.setScalar(pulse);
    }
  };

  // Prevent thin geometry popping at shallow angles.
  win.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.frustumCulled = false;
    }
  });

  return win;
}
