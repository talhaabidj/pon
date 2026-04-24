import * as THREE from 'three';
import { tagInteractable } from '../../../core/InteractionTags.js';

export interface ShopExitDoorParams {
  exitOpeningWidth: number;
  exitOpeningHeight: number;
  halfDepth: number;
}

export function buildShopExitDoor(params: ShopExitDoorParams): THREE.Group {
  const exitGroup = new THREE.Group();
  exitGroup.name = 'shop-exit';
  tagInteractable(exitGroup, {
    type: 'shop-exit',
    prompt: 'End Shift',
  });

  const exitFrameMat = new THREE.MeshStandardMaterial({
    color: 0x2a2421,
    roughness: 0.78,
    metalness: 0.14,
  });
  const exitTrimMat = new THREE.MeshStandardMaterial({
    color: 0x322a24,
    roughness: 0.72,
    metalness: 0.1,
  });
  const exitHardwareMat = new THREE.MeshStandardMaterial({
    color: 0xc7ced8,
    roughness: 0.34,
    metalness: 0.74,
  });
  const exitDoorMat = new THREE.MeshStandardMaterial({
    color: 0x1b1f26,
    roughness: 0.66,
    metalness: 0.22,
  });
  const exitDoorInsetMat = new THREE.MeshStandardMaterial({
    color: 0x252c36,
    roughness: 0.7,
    metalness: 0.16,
  });
  const exitGlassMat = new THREE.MeshStandardMaterial({
    color: 0xcde6f4,
    emissive: 0x1f2d39,
    emissiveIntensity: 0.08,
    transparent: true,
    opacity: 0.28,
    roughness: 0.12,
    metalness: 0.16,
    depthWrite: false,
  });

  const exitJambL = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 2.7, 0.14),
    exitFrameMat,
  );
  exitJambL.position.set(-0.58, 1.35, 0);
  exitGroup.add(exitJambL);

  const exitJambR = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 2.7, 0.14),
    exitFrameMat,
  );
  exitJambR.position.set(0.58, 1.35, 0);
  exitGroup.add(exitJambR);

  const exitHeader = new THREE.Mesh(
    new THREE.BoxGeometry(1.24, 0.08, 0.14),
    exitFrameMat,
  );
  exitHeader.position.set(0, 2.66, 0);
  exitGroup.add(exitHeader);

  const exitThreshold = new THREE.Mesh(
    new THREE.BoxGeometry(1.12, 0.035, 0.18),
    exitTrimMat,
  );
  exitThreshold.position.set(0, 0.018, 0.03);
  exitGroup.add(exitThreshold);

  const exitDoorWidth = 1.08;
  const exitDoorHeight = 2.58;
  const exitDoorDepth = 0.05;
  const exitDoorLeaf = new THREE.Group();
  exitDoorLeaf.position.set(0, 0.035, 0.05);
  exitGroup.add(exitDoorLeaf);

  const stileWidth = 0.1;
  const topRailHeight = 0.14;
  const midRailHeight = 0.12;
  const bottomRailHeight = 0.28;

  const leftStile = new THREE.Mesh(
    new THREE.BoxGeometry(stileWidth, exitDoorHeight, exitDoorDepth),
    exitDoorMat,
  );
  leftStile.position.set(-exitDoorWidth / 2 + stileWidth / 2, exitDoorHeight / 2, 0);
  exitDoorLeaf.add(leftStile);

  const rightStile = new THREE.Mesh(
    new THREE.BoxGeometry(stileWidth, exitDoorHeight, exitDoorDepth),
    exitDoorMat,
  );
  rightStile.position.set(exitDoorWidth / 2 - stileWidth / 2, exitDoorHeight / 2, 0);
  exitDoorLeaf.add(rightStile);

  const topRail = new THREE.Mesh(
    new THREE.BoxGeometry(exitDoorWidth - stileWidth * 2, topRailHeight, exitDoorDepth),
    exitDoorMat,
  );
  topRail.position.set(0, exitDoorHeight - topRailHeight / 2, 0);
  exitDoorLeaf.add(topRail);

  const midRailY = 0.98;
  const midRail = new THREE.Mesh(
    new THREE.BoxGeometry(exitDoorWidth - stileWidth * 2, midRailHeight, exitDoorDepth),
    exitDoorMat,
  );
  midRail.position.set(0, midRailY, 0);
  exitDoorLeaf.add(midRail);

  const bottomRail = new THREE.Mesh(
    new THREE.BoxGeometry(exitDoorWidth - stileWidth * 2, bottomRailHeight, exitDoorDepth),
    exitDoorMat,
  );
  bottomRail.position.set(0, bottomRailHeight / 2, 0);
  exitDoorLeaf.add(bottomRail);

  const lowerInset = new THREE.Mesh(
    new THREE.BoxGeometry(exitDoorWidth - stileWidth * 2 - 0.08, 0.5, 0.012),
    exitDoorInsetMat,
  );
  lowerInset.position.set(0, 0.57, 0.019);
  exitDoorLeaf.add(lowerInset);

  const glassWidth = exitDoorWidth - stileWidth * 2 - 0.06;
  const glassHeight = 1.36;
  const glassY = 1.72;
  const doorGlass = new THREE.Mesh(
    new THREE.BoxGeometry(glassWidth, glassHeight, 0.012),
    exitGlassMat,
  );
  doorGlass.position.set(0, glassY, 0.008);
  exitDoorLeaf.add(doorGlass);

  const handleGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.7, 12);
  const exitHandleX = 0.34;
  const exitHandleY = 1.02;
  const handle = new THREE.Mesh(handleGeo, exitHardwareMat);
  handle.position.set(exitHandleX, exitHandleY, 0.092);
  exitDoorLeaf.add(handle);

  const mountGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.06, 8);
  mountGeo.rotateX(Math.PI / 2);
  [-0.3, 0.3].forEach((yOffset) => {
    const mount = new THREE.Mesh(mountGeo, exitHardwareMat);
    mount.position.set(exitHandleX, exitHandleY + yOffset, 0.052);
    exitDoorLeaf.add(mount);
  });

  const frontTrimL = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, params.exitOpeningHeight, 0.08),
    exitTrimMat,
  );
  frontTrimL.position.set(-params.exitOpeningWidth / 2, params.exitOpeningHeight / 2, -0.02);
  exitGroup.add(frontTrimL);

  const frontTrimR = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, params.exitOpeningHeight, 0.08),
    exitTrimMat,
  );
  frontTrimR.position.set(params.exitOpeningWidth / 2, params.exitOpeningHeight / 2, -0.02);
  exitGroup.add(frontTrimR);

  const frontTrimTop = new THREE.Mesh(
    new THREE.BoxGeometry(params.exitOpeningWidth + 0.08, 0.06, 0.08),
    exitTrimMat,
  );
  frontTrimTop.position.set(0, params.exitOpeningHeight, -0.02);
  exitGroup.add(frontTrimTop);

  exitGroup.position.set(0, 0, params.halfDepth - 0.06);
  exitGroup.rotation.y = Math.PI;
  return exitGroup;
}
