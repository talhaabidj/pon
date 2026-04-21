import * as THREE from 'three';
import { tagInteractable } from '../../core/InteractionTags.js';
import type { BuiltShopInteractable } from './types.js';

export type TokenStationStatus =
  | 'ready'
  | 'low_stock'
  | 'out_of_stock'
  | 'no_power'
  | 'jammed'
  | 'dirty';

/**
 * Token Station — ATM/kiosk-style terminal for purchasing gacha tokens.
 *
 * Visually distinct from gacha machines: no glass display, no capsule chamber.
 * Features a large screen, card reader, numpad, and receipt printer slot.
 */
export function buildTokenStation(): BuiltShopInteractable {
  const stationGroup = new THREE.Group();
  stationGroup.name = 'token-station';
  tagInteractable(stationGroup, {
    type: 'token-station',
    prompt: 'Buy Tokens',
  });

  // Materials — dark metallic body, contrasting with glowing accents
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1a1e2a,
    roughness: 0.6,
    metalness: 0.35,
  });
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x2a3040,
    roughness: 0.55,
    metalness: 0.45,
  });
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x8b8f99,
    roughness: 0.35,
    metalness: 0.7,
  });
  const trimGlow = new THREE.MeshStandardMaterial({
    color: 0xb8ecff,
    emissive: 0x74d9ff,
    emissiveIntensity: 0.6,
    roughness: 0.28,
    metalness: 0.42,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x0e1118,
    roughness: 0.92,
  });

  // —— Base pedestal ——
  const basePlinth = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.08, 0.58), metalMat);
  basePlinth.position.set(0, 0.04, 0);
  stationGroup.add(basePlinth);

  // —— Main body (narrower, taller than gacha machines) ——
  const mainBody = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.7, 0.48), bodyMat);
  mainBody.position.set(0, 0.93, 0);
  stationGroup.add(mainBody);

  // —— Slight backward tilt panel for the upper face (ergonomic) ——
  const facePanel = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.85, 0.06), frameMat);
  facePanel.position.set(0, 1.35, 0.22);
  facePanel.rotation.x = -0.08;
  stationGroup.add(facePanel);

  // —— Screen (large, dominant feature) ——
  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 512;
  screenCanvas.height = 384;
  const screenCtx = screenCanvas.getContext('2d');
  const screenTex = new THREE.CanvasTexture(screenCanvas);
  screenTex.colorSpace = THREE.SRGBColorSpace;

  const screenMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: screenTex,
    emissive: 0x7be7ff,
    emissiveIntensity: 0.65,
    roughness: 0.28,
    metalness: 0.05,
  });

  const drawTokenScreen = (title: string, subtitle: string, level = 0x7be7ff) => {
    if (!screenCtx) return;

    // Background
    screenCtx.fillStyle = '#0a1420';
    screenCtx.fillRect(0, 0, screenCanvas.width, screenCanvas.height);

    // Gradient panel
    const grad = screenCtx.createLinearGradient(0, 0, 0, 320);
    grad.addColorStop(0, '#1a3050');
    grad.addColorStop(1, '#0c1e34');
    screenCtx.fillStyle = grad;
    screenCtx.fillRect(16, 16, 480, 352);

    // Header line
    screenCtx.fillStyle = '#50a0cc';
    screenCtx.fillRect(40, 40, 432, 2);

    // Title
    screenCtx.fillStyle = '#a9eeff';
    screenCtx.font = 'bold 26px monospace';
    screenCtx.textAlign = 'center';
    screenCtx.fillText('TOKEN TERMINAL', 256, 72);

    // Main status
    screenCtx.fillStyle = '#e8f6ff';
    screenCtx.font = 'bold 48px monospace';
    screenCtx.fillText(title, 256, 170);

    // Subtitle
    screenCtx.fillStyle = '#c7daec';
    screenCtx.font = '22px monospace';
    screenCtx.fillText(subtitle, 256, 210);

    // Action button
    screenCtx.fillStyle = '#142840';
    screenCtx.fillRect(120, 260, 272, 52);
    screenCtx.strokeStyle = '#4090b0';
    screenCtx.lineWidth = 1.5;
    screenCtx.strokeRect(120, 260, 272, 52);
    screenCtx.fillStyle = '#9fe1ff';
    screenCtx.font = 'bold 20px monospace';
    screenCtx.fillText('INSERT CREDIT', 256, 292);

    // Footer line
    screenCtx.fillStyle = '#50a0cc';
    screenCtx.fillRect(40, 340, 432, 1);

    // Version text
    screenCtx.fillStyle = '#3a5a70';
    screenCtx.font = '12px monospace';
    screenCtx.fillText('CATCHAPON TOKEN SYS v2.1', 256, 362);

    screenTex.needsUpdate = true;
    screenMat.emissive.setHex(level);
  };

  const stationScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.38), screenMat);
  stationScreen.position.set(0, 1.48, 0.255);
  stationScreen.rotation.x = -0.08;
  stationGroup.add(stationScreen);

  // Screen bezel
  const bezelMat = new THREE.MeshStandardMaterial({ color: 0x111520, roughness: 0.8, metalness: 0.3 });
  const bezelTop = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.02, 0.04), bezelMat);
  bezelTop.position.set(0, 1.67, 0.24);
  stationGroup.add(bezelTop);
  const bezelBot = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.02, 0.04), bezelMat);
  bezelBot.position.set(0, 1.29, 0.26);
  stationGroup.add(bezelBot);

  // —— Numpad / input panel area (below screen) ——
  const numpadPanel = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.06), frameMat);
  numpadPanel.position.set(0, 1.05, 0.24);
  numpadPanel.rotation.x = -0.3; // angled for ergonomics
  stationGroup.add(numpadPanel);

  // Individual numpad buttons (3x3 grid + 1 row)
  const btnMat = new THREE.MeshStandardMaterial({ color: 0x3a4058, roughness: 0.5, metalness: 0.4 });
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const btn = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.015), btnMat);
      btn.position.set(-0.1 + col * 0.1, 1.12 - row * 0.065, 0.27 - row * 0.02);
      btn.rotation.x = -0.3;
      stationGroup.add(btn);
    }
  }

  // Enter button (wider, green-tinted)
  const enterBtnMat = new THREE.MeshStandardMaterial({
    color: 0x2a5040,
    emissive: 0x1a4030,
    emissiveIntensity: 0.3,
    roughness: 0.5,
    metalness: 0.4,
  });
  const enterBtn = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.055, 0.015), enterBtnMat);
  enterBtn.position.set(0.05, 0.93, 0.21);
  enterBtn.rotation.x = -0.3;
  stationGroup.add(enterBtn);

  // —— Card reader slot (right side) ——
  const cardSlotFrame = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.04), metalMat);
  cardSlotFrame.position.set(0.22, 0.85, 0.25);
  stationGroup.add(cardSlotFrame);
  const cardSlot = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.005, 0.03), darkMat);
  cardSlot.position.set(0.22, 0.87, 0.27);
  stationGroup.add(cardSlot);

  // Card reader LED
  const cardLed = new THREE.Mesh(
    new THREE.CylinderGeometry(0.006, 0.006, 0.005, 8),
    new THREE.MeshStandardMaterial({ color: 0x44ff44, emissive: 0x22cc22, emissiveIntensity: 0.8 }),
  );
  cardLed.rotation.x = Math.PI / 2;
  cardLed.position.set(0.22, 0.92, 0.27);
  stationGroup.add(cardLed);

  // —— Receipt printer slot (bottom front) ——
  const receiptFrame = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.04), metalMat);
  receiptFrame.position.set(0, 0.35, 0.25);
  stationGroup.add(receiptFrame);
  const receiptSlot = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.005, 0.03), darkMat);
  receiptSlot.position.set(0, 0.35, 0.27);
  stationGroup.add(receiptSlot);

  // —— Top cap with accent trim ——
  const topCap = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.06, 0.54), frameMat);
  topCap.position.set(0, 1.81, 0);
  stationGroup.add(topCap);

  // Glowing accent strips (sides)
  const accentStripGeo = new THREE.BoxGeometry(0.015, 1.2, 0.02);
  const accentL = new THREE.Mesh(accentStripGeo, trimGlow);
  accentL.position.set(-0.325, 1.2, 0.25);
  stationGroup.add(accentL);
  const accentR = new THREE.Mesh(accentStripGeo, trimGlow);
  accentR.position.set(0.325, 1.2, 0.25);
  stationGroup.add(accentR);

  // Top accent strip
  const topAccent = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.015, 0.015), trimGlow);
  topAccent.position.set(0, 1.78, 0.27);
  stationGroup.add(topAccent);

  // Bottom accent strip
  const botAccent = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.015, 0.015), trimGlow);
  botAccent.position.set(0, 0.12, 0.25);
  stationGroup.add(botAccent);

  // —— Initialize screen ——
  drawTokenScreen('READY', 'Terminal Online', 0x7be7ff);

  stationGroup.userData['setStatus'] = (status: TokenStationStatus) => {
    if (status === 'ready') drawTokenScreen('READY', 'Terminal Online', 0x7be7ff);
    if (status === 'low_stock') drawTokenScreen('LOW STOCK', 'Refill recommended', 0xffd189);
    if (status === 'out_of_stock') drawTokenScreen('OUT OF STOCK', 'Restock from crate', 0xffc96b);
    if (status === 'no_power') drawTokenScreen('NO POWER', 'Reconnect station', 0xff6d6d);
    if (status === 'jammed') drawTokenScreen('DISPENSER STUCK', 'Service required', 0xff8b4a);
    if (status === 'dirty') drawTokenScreen('SCREEN DIRTY', 'Wipe terminal glass', 0x9ec2e0);
  };

  stationGroup.userData['pulseGlow'] = () => {
    trimGlow.emissiveIntensity = 1.2;
    screenMat.emissiveIntensity = 0.95;
    setTimeout(() => {
      trimGlow.emissiveIntensity = 0.6;
      screenMat.emissiveIntensity = 0.65;
    }, 450);
  };

  stationGroup.position.set(5.08, 0, 2.62);
  stationGroup.rotation.y = -Math.PI / 2;

  return {
    group: stationGroup,
    interactable: stationGroup,
    collider: { name: 'token-station', x: 5.08, z: 2.62, halfW: 0.36, halfD: 0.3 },
  };
}
