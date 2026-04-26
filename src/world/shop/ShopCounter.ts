/**
 * ShopCounter — Corner register island for the shop.
 *
 * Builds an L-shaped wood counter, overhead lantern, cat-themed signage,
 * and an L-wrapped curtain set. Decorative only (no interaction).
 */

import * as THREE from 'three';
import type { ShopCollider } from './types.js';

export interface BuiltShopCounter {
  group: THREE.Group;
  collider: ShopCollider;
}

const COUNTER_X = -5.35;
const COUNTER_Z = 2.55;
const COUNTER_HEIGHT = 1.0;
const TOP_THICKNESS = 0.05;
const KICKPLATE_HEIGHT = 0.08;

const MAIN_LENGTH = 2.5; // Z axis
const MAIN_DEPTH = 0.78; // X axis
const RETURN_LENGTH = 1.35; // X axis
const RETURN_DEPTH = 0.86; // Z axis

function createCatSignTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bg.addColorStop(0, '#2a2120');
    bg.addColorStop(1, '#3b2b25');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(255, 230, 180, 0.9)';
    ctx.strokeStyle = 'rgba(255, 230, 180, 0.9)';
    ctx.lineWidth = 8;
    ctx.font = '700 74px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CAT NOOK', canvas.width * 0.5, canvas.height * 0.52);

    // Simple cat face icon on the left.
    ctx.beginPath();
    ctx.arc(140, 160, 54, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(100, 108);
    ctx.lineTo(120, 70);
    ctx.lineTo(140, 110);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(140, 110);
    ctx.lineTo(160, 70);
    ctx.lineTo(180, 108);
    ctx.stroke();
    ctx.fillRect(122, 156, 8, 8);
    ctx.fillRect(150, 156, 8, 8);
    ctx.fillRect(140, 176, 8, 6);

    // Paw motif on the right.
    const pawX = 642;
    const pawY = 160;
    ctx.beginPath();
    ctx.arc(pawX, pawY + 16, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pawX - 28, pawY - 14, 10, 0, Math.PI * 2);
    ctx.arc(pawX - 10, pawY - 28, 10, 0, Math.PI * 2);
    ctx.arc(pawX + 10, pawY - 28, 10, 0, Math.PI * 2);
    ctx.arc(pawX + 28, pawY - 14, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function buildShopCounter(): BuiltShopCounter {
  const group = new THREE.Group();
  group.name = 'shop-counter';

  const woodBodyMat = new THREE.MeshStandardMaterial({
    color: 0x6f4f36,
    roughness: 0.82,
    metalness: 0.05,
  });
  const woodTopMat = new THREE.MeshStandardMaterial({
    color: 0x805a3f,
    roughness: 0.6,
    metalness: 0.08,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x261b16,
    roughness: 0.88,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x4f3625,
    roughness: 0.72,
    metalness: 0.12,
  });
  const registerCreamMat = new THREE.MeshStandardMaterial({
    color: 0xe9dec3,
    roughness: 0.54,
    metalness: 0.1,
  });
  const registerDarkMat = new THREE.MeshStandardMaterial({
    color: 0x1b1c21,
    roughness: 0.44,
    metalness: 0.55,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc09447,
    roughness: 0.34,
    metalness: 0.86,
  });
  const paperMat = new THREE.MeshStandardMaterial({
    color: 0xf4efdf,
    roughness: 0.94,
  });
  const catMat = new THREE.MeshStandardMaterial({
    color: 0xf6f6f6,
    roughness: 0.78,
    metalness: 0.02,
  });
  const catAccentMat = new THREE.MeshStandardMaterial({
    color: 0xc32b3a,
    roughness: 0.6,
  });
  const catInnerMat = new THREE.MeshStandardMaterial({
    color: 0xf2b8c5,
    roughness: 0.72,
  });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x101010,
    roughness: 0.32,
  });
  const curtainMat = new THREE.MeshStandardMaterial({
    color: 0x1f3a64,
    roughness: 0.9,
    metalness: 0.02,
  });
  const curtainBandMat = new THREE.MeshStandardMaterial({
    color: 0xe9dec3,
    roughness: 0.88,
    metalness: 0.02,
  });
  const rodMat = new THREE.MeshStandardMaterial({
    color: 0x2a1a10,
    roughness: 0.9,
  });
  const lanternPaperMat = new THREE.MeshStandardMaterial({
    color: 0xe1d8b9,
    roughness: 0.88,
    emissive: 0xffb86c,
    emissiveIntensity: 0.36,
  });
  const lanternRedMat = new THREE.MeshStandardMaterial({
    color: 0xb52638,
    roughness: 0.72,
  });
  const lanternDarkMat = new THREE.MeshStandardMaterial({
    color: 0x1a0f0b,
    roughness: 0.88,
  });
  const signFrameMat = new THREE.MeshStandardMaterial({
    color: 0x2f211b,
    roughness: 0.82,
  });

  // Main bar counter body.
  const mainBody = new THREE.Mesh(
    new THREE.BoxGeometry(MAIN_DEPTH, COUNTER_HEIGHT - KICKPLATE_HEIGHT, MAIN_LENGTH),
    woodBodyMat,
  );
  mainBody.position.set(
    0,
    KICKPLATE_HEIGHT + (COUNTER_HEIGHT - KICKPLATE_HEIGHT) / 2,
    0,
  );
  group.add(mainBody);

  const mainTop = new THREE.Mesh(
    new THREE.BoxGeometry(MAIN_DEPTH + 0.08, TOP_THICKNESS, MAIN_LENGTH + 0.08),
    woodTopMat,
  );
  mainTop.position.set(0, COUNTER_HEIGHT - TOP_THICKNESS / 2, 0);
  group.add(mainTop);

  const mainKick = new THREE.Mesh(
    new THREE.BoxGeometry(MAIN_DEPTH - 0.08, KICKPLATE_HEIGHT, MAIN_LENGTH - 0.08),
    trimMat,
  );
  mainKick.position.set(0, KICKPLATE_HEIGHT / 2, 0);
  group.add(mainKick);

  const mainAccent = new THREE.Mesh(
    new THREE.BoxGeometry(MAIN_DEPTH + 0.01, 0.036, MAIN_LENGTH - 0.04),
    accentMat,
  );
  mainAccent.position.set(
    MAIN_DEPTH / 2 + 0.005,
    COUNTER_HEIGHT - TOP_THICKNESS - 0.06,
    0,
  );
  group.add(mainAccent);

  // Return leg for L-shape (wraps toward left wall corner).
  const returnCenterX = -MAIN_DEPTH / 2 - RETURN_LENGTH / 2 + 0.02;
  const returnCenterZ = -MAIN_LENGTH / 2 + RETURN_DEPTH / 2 - 0.02;
  const returnBody = new THREE.Mesh(
    new THREE.BoxGeometry(RETURN_LENGTH, COUNTER_HEIGHT - KICKPLATE_HEIGHT, RETURN_DEPTH),
    woodBodyMat,
  );
  returnBody.position.set(
    returnCenterX,
    KICKPLATE_HEIGHT + (COUNTER_HEIGHT - KICKPLATE_HEIGHT) / 2,
    returnCenterZ,
  );
  group.add(returnBody);

  const returnTop = new THREE.Mesh(
    new THREE.BoxGeometry(RETURN_LENGTH + 0.08, TOP_THICKNESS, RETURN_DEPTH + 0.08),
    woodTopMat,
  );
  returnTop.position.set(returnCenterX, COUNTER_HEIGHT - TOP_THICKNESS / 2, returnCenterZ);
  group.add(returnTop);

  const returnKick = new THREE.Mesh(
    new THREE.BoxGeometry(RETURN_LENGTH - 0.08, KICKPLATE_HEIGHT, RETURN_DEPTH - 0.08),
    trimMat,
  );
  returnKick.position.set(returnCenterX, KICKPLATE_HEIGHT / 2, returnCenterZ);
  group.add(returnKick);

  const returnAccent = new THREE.Mesh(
    new THREE.BoxGeometry(RETURN_LENGTH - 0.04, 0.036, 0.045),
    accentMat,
  );
  returnAccent.position.set(
    returnCenterX,
    COUNTER_HEIGHT - TOP_THICKNESS - 0.06,
    returnCenterZ + RETURN_DEPTH / 2 + 0.006,
  );
  group.add(returnAccent);

  // Register.
  const topY = COUNTER_HEIGHT;
  const registerCenter = new THREE.Vector3(0.08, topY, -0.6);
  const registerBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.26, 0.36),
    registerCreamMat,
  );
  registerBody.position.set(registerCenter.x, registerCenter.y + 0.13, registerCenter.z);
  group.add(registerBody);

  const registerScreenHousing = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.1, 0.16),
    registerDarkMat,
  );
  registerScreenHousing.position.set(registerCenter.x, registerCenter.y + 0.32, registerCenter.z - 0.08);
  registerScreenHousing.rotation.x = -0.18;
  group.add(registerScreenHousing);

  const registerScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.28, 0.06),
    new THREE.MeshStandardMaterial({
      color: 0x0f1d17,
      emissive: 0x2e9f74,
      emissiveIntensity: 0.6,
      roughness: 0.24,
    }),
  );
  registerScreen.position.set(registerCenter.x, registerCenter.y + 0.335, registerCenter.z - 0.002);
  registerScreen.rotation.x = -0.18;
  group.add(registerScreen);

  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const key = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.008, 12),
        paperMat,
      );
      key.position.set(
        registerCenter.x - 0.13 + col * 0.072,
        registerCenter.y + 0.265,
        registerCenter.z + 0.11 - row * 0.054,
      );
      group.add(key);
    }
  }
  const totalKey = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.024, 0.01, 14),
    catAccentMat,
  );
  totalKey.position.set(registerCenter.x + 0.16, registerCenter.y + 0.266, registerCenter.z + 0.05);
  group.add(totalKey);

  // Receipt holder.
  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.024, 0.13), trimMat);
  tray.position.set(-0.14, topY + 0.012, 0.1);
  group.add(tray);
  const papers = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.11), paperMat);
  papers.position.set(-0.14, topY + 0.034, 0.1);
  group.add(papers);
  const clip = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.005, 0.017), brassMat);
  clip.position.set(-0.14, topY + 0.044, 0.122);
  group.add(clip);

  // Lucky cat (faces toward the player / store center).
  const catGroup = new THREE.Group();
  catGroup.position.set(-0.19, topY, 0.72);
  catGroup.rotation.y = -Math.PI / 2;
  group.add(catGroup);

  const catBase = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.025, 18), catAccentMat);
  catBase.position.set(0, 0.013, 0);
  catGroup.add(catBase);

  const catBody = new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 14), catMat);
  catBody.scale.set(1.0, 0.95, 0.9);
  catBody.position.set(0, 0.115, 0);
  catGroup.add(catBody);

  const catHead = new THREE.Mesh(new THREE.SphereGeometry(0.094, 18, 14), catMat);
  catHead.position.set(0, 0.27, 0.004);
  catGroup.add(catHead);

  const earGeo = new THREE.ConeGeometry(0.036, 0.08, 8);
  const earL = new THREE.Mesh(earGeo, catMat);
  earL.position.set(-0.055, 0.344, -0.006);
  earL.rotation.z = 0.34;
  catGroup.add(earL);
  const earR = earL.clone();
  earR.position.x = 0.055;
  earR.rotation.z = -0.34;
  catGroup.add(earR);

  const earInGeo = new THREE.ConeGeometry(0.02, 0.05, 8);
  const earInL = new THREE.Mesh(earInGeo, catInnerMat);
  earInL.position.set(-0.05, 0.338, 0.005);
  earInL.rotation.z = 0.34;
  catGroup.add(earInL);
  const earInR = earInL.clone();
  earInR.position.x = 0.05;
  earInR.rotation.z = -0.34;
  catGroup.add(earInR);

  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.011, 10, 8), eyeMat);
  eyeL.position.set(-0.03, 0.278, 0.082);
  catGroup.add(eyeL);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.03;
  catGroup.add(eyeR);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.007, 8, 6), catInnerMat);
  nose.position.set(0, 0.258, 0.094);
  catGroup.add(nose);

  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.092, 0.011, 10, 24), catAccentMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 0.206, 0);
  catGroup.add(collar);
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.017, 12, 10), brassMat);
  bell.position.set(0, 0.19, 0.085);
  catGroup.add(bell);

  const pawArm = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.13, 10), catMat);
  pawArm.position.set(0.082, 0.21, 0.038);
  pawArm.rotation.set(0, 0, -0.38);
  catGroup.add(pawArm);
  const pawRaised = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 10), catMat);
  pawRaised.position.set(0.132, 0.274, 0.038);
  catGroup.add(pawRaised);

  const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.012, 18), brassMat);
  coin.scale.set(1.4, 1, 1);
  coin.rotation.x = Math.PI / 2;
  coin.position.set(-0.058, 0.05, 0.05);
  catGroup.add(coin);
  const pawLeft = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 10), catMat);
  pawLeft.position.set(-0.058, 0.07, 0.05);
  catGroup.add(pawLeft);

  // Lantern.
  const lanternGroup = new THREE.Group();
  const lanternHangY = topY + 1.2;
  lanternGroup.position.set(0.04, lanternHangY, -0.02);
  group.add(lanternGroup);

  const cordLen = 3.2 - lanternHangY - 0.18;
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, cordLen, 6), lanternDarkMat);
  cord.position.set(0, 0.18 + cordLen / 2, 0);
  lanternGroup.add(cord);

  const capTop = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.06, 0.04, 16), lanternDarkMat);
  capTop.position.set(0, 0.16, 0);
  lanternGroup.add(capTop);

  const lanternBody = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 14), lanternPaperMat);
  lanternBody.scale.set(1, 0.78, 1);
  lanternGroup.add(lanternBody);

  const ringTop = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.022, 8, 28), lanternRedMat);
  ringTop.rotation.x = Math.PI / 2;
  ringTop.position.set(0, 0.082, 0);
  ringTop.scale.set(1, 1, 0.45);
  lanternGroup.add(ringTop);
  const ringBottom = ringTop.clone();
  ringBottom.position.y = -0.082;
  lanternGroup.add(ringBottom);

  const capBottom = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.035, 16), lanternDarkMat);
  capBottom.position.set(0, -0.135, 0);
  lanternGroup.add(capBottom);
  const tassel = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.05, 8), lanternRedMat);
  tassel.position.set(0, -0.21, 0);
  lanternGroup.add(tassel);

  const lanternLight = new THREE.PointLight(0xffb066, 0.56, 3.4, 1.6);
  lanternLight.position.set(0, 0, 0);
  lanternGroup.add(lanternLight);

  // L-shaped curtain in the wall corner.
  const wallX = -1.65 + 0.02; // left wall in local space + small offset
  const frontWallZ = 6 - COUNTER_Z;
  const curtainCornerZ = frontWallZ - 0.22;
  const curtainY = 2.16;

  const leftRunLen = 1.34;
  const rodLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, leftRunLen + 0.1, 10), rodMat);
  rodLeft.rotation.x = Math.PI / 2;
  rodLeft.position.set(wallX + 0.03, curtainY, curtainCornerZ - leftRunLen / 2);
  group.add(rodLeft);

  const leftPanelCount = 4;
  const leftPanelW = (leftRunLen - (leftPanelCount - 1) * 0.03) / leftPanelCount;
  for (let i = 0; i < leftPanelCount; i += 1) {
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.56, leftPanelW),
      curtainMat,
    );
    const z = curtainCornerZ - (leftPanelW / 2 + i * (leftPanelW + 0.03));
    panel.position.set(wallX + 0.042, curtainY - 0.31, z);
    group.add(panel);
  }
  const leftBand = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, 0.1, leftRunLen),
    curtainBandMat,
  );
  leftBand.position.set(wallX + 0.044, curtainY - 0.05, curtainCornerZ - leftRunLen / 2);
  group.add(leftBand);

  const frontRunLen = 0.92;
  const rodFront = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, frontRunLen + 0.08, 10), rodMat);
  rodFront.rotation.z = Math.PI / 2;
  rodFront.position.set(wallX + 0.03 + frontRunLen / 2, curtainY, curtainCornerZ + 0.03);
  group.add(rodFront);

  const frontPanelCount = 3;
  const frontPanelW = (frontRunLen - (frontPanelCount - 1) * 0.03) / frontPanelCount;
  for (let i = 0; i < frontPanelCount; i += 1) {
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(frontPanelW, 0.56, 0.012),
      curtainMat,
    );
    const x = wallX + 0.03 + (frontPanelW / 2 + i * (frontPanelW + 0.03));
    panel.position.set(x, curtainY - 0.31, curtainCornerZ + 0.042);
    group.add(panel);
  }
  const frontBand = new THREE.Mesh(
    new THREE.BoxGeometry(frontRunLen, 0.1, 0.014),
    curtainBandMat,
  );
  frontBand.position.set(wallX + 0.03 + frontRunLen / 2, curtainY - 0.05, curtainCornerZ + 0.044);
  group.add(frontBand);

  // Cat-themed framed sign (no strip marks).
  const signFrame = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 1.2), signFrameMat);
  signFrame.position.set(wallX + 0.016, 2.78, curtainCornerZ - 0.62);
  group.add(signFrame);

  const signTex = createCatSignTexture();
  const signFace = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 0.42),
    new THREE.MeshStandardMaterial({
      map: signTex,
      color: 0xffffff,
      emissive: 0x1f1a18,
      emissiveIntensity: 0.12,
      roughness: 0.68,
      metalness: 0.04,
    }),
  );
  signFace.rotation.y = Math.PI / 2;
  signFace.position.set(wallX + 0.052, 2.78, curtainCornerZ - 0.62);
  group.add(signFace);

  group.position.set(COUNTER_X, 0, COUNTER_Z);

  const xMin = Math.min(-MAIN_DEPTH / 2, returnCenterX - RETURN_LENGTH / 2);
  const xMax = Math.max(MAIN_DEPTH / 2, returnCenterX + RETURN_LENGTH / 2);
  const zMin = Math.min(-MAIN_LENGTH / 2, returnCenterZ - RETURN_DEPTH / 2);
  const zMax = Math.max(MAIN_LENGTH / 2, returnCenterZ + RETURN_DEPTH / 2);

  return {
    group,
    collider: {
      name: 'shop-counter',
      x: COUNTER_X + (xMin + xMax) / 2,
      z: COUNTER_Z + (zMin + zMax) / 2,
      halfW: (xMax - xMin) / 2 + 0.06,
      halfD: (zMax - zMin) / 2 + 0.06,
    },
  };
}
