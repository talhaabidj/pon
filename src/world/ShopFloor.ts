/**
 * ShopFloor — World builder for the gacha shop.
 *
 * Assembles room geometry, places machines from data,
 * adds checkout counter, storage crate, and overhead lighting.
 *
 * Room: 14m wide × 4m tall × 12m deep.
 */

import * as THREE from 'three';
import type { MachineDefinition, MachineState } from '../data/types.js';
import { tagInteractable } from '../core/InteractionTags.js';
import { createCapsuleMachine } from './machines/CapsuleMachine.js';
import { buildShopSecrets } from './shop/ShopSecrets.js';
import { buildStorageCrate } from './shop/ShopStorageCrate.js';
import { buildTokenCrate } from './shop/ShopTokenCrate.js';
import { buildTokenStation } from './shop/ShopTokenStation.js';
import type { ShopCollider } from './shop/types.js';

export type { ShopCollider } from './shop/types.js';

export interface ShopLayout {
  group: THREE.Group;
  machineGroups: Map<string, THREE.Group>;
  interactables: THREE.Object3D[];
  colliders: ShopCollider[];
}

const SHOP_WIDTH = 14;
const SHOP_HEIGHT = 4;
const SHOP_DEPTH = 12;
const HALF_W = SHOP_WIDTH / 2;
const HALF_D = SHOP_DEPTH / 2;
const EXIT_OPENING_WIDTH = 1.66;
const EXIT_OPENING_HEIGHT = 2.82;

export function buildShopFloor(
  machines: MachineDefinition[],
  machineStates: Map<string, MachineState>,
): ShopLayout {
  const group = new THREE.Group();
  group.name = 'shop-floor';

  const machineGroups = new Map<string, THREE.Group>();
  const interactables: THREE.Object3D[] = [];
  const colliders: ShopCollider[] = [];

  // ————————————————————————————————
  // Room shell
  // ————————————————————————————————

  // Floor — wooden planks
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x4f3a2a,
    roughness: 0.82,
    metalness: 0.04,
  });
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(SHOP_WIDTH, SHOP_DEPTH),
    floorMat,
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  const plankPalette = [0x6a4c34, 0x745238, 0x5f462f, 0x7d5940];
  const plankDepth = 0.34;
  const plankGap = 0.012;
  let plankRow = 0;
  for (let z = -HALF_D + plankDepth / 2; z < HALF_D; z += plankDepth) {
    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(SHOP_WIDTH, 0.006, plankDepth - plankGap),
      new THREE.MeshStandardMaterial({
        color: plankPalette[plankRow % plankPalette.length],
        roughness: 0.86,
        metalness: 0.04,
      }),
    );
    plank.position.set(0, 0.003, z);
    group.add(plank);
    plankRow += 1;
  }

  const plankSeamMat = new THREE.MeshStandardMaterial({
    color: 0x3c2c20,
    roughness: 0.92,
  });
  for (let z = -HALF_D + plankDepth; z < HALF_D; z += plankDepth) {
    const seam = new THREE.Mesh(
      new THREE.BoxGeometry(SHOP_WIDTH, 0.001, 0.006),
      plankSeamMat,
    );
    seam.position.set(0, 0.0062, z - plankGap * 0.5);
    group.add(seam);
  }

  // Ceiling
  const ceilMat = new THREE.MeshStandardMaterial({
    color: 0x111118,
    roughness: 0.95,
  });
  const ceil = new THREE.Mesh(
    new THREE.PlaneGeometry(SHOP_WIDTH, SHOP_DEPTH),
    ceilMat,
  );
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = SHOP_HEIGHT;
  group.add(ceil);

  // Walls
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x1a1d28,
    roughness: 0.88,
    side: THREE.DoubleSide,
  });
  const baseboardMat = new THREE.MeshStandardMaterial({
    color: 0x111118,
    roughness: 0.92,
  });

  // ————————————————————————————————
  // Shared Lighting Materials
  // ————————————————————————————————
  const fixtureCanopyMat = new THREE.MeshStandardMaterial({
    color: 0x5a5e66,
    roughness: 0.6,
    metalness: 0.2,
  });
  const fixtureDiffuserMat = new THREE.MeshStandardMaterial({
    color: 0xfffcf5,
    emissive: 0xffeccc,
    emissiveIntensity: 0.45,
    roughness: 0.2,
    metalness: 0.05,
  });

  // ————————————————————————————————
  // Storeroom constants
  // ————————————————————————————————
  const STORE_WIDTH = 4.0;    // how wide the storeroom is (along X)
  const STORE_DEPTH = 3.5;    // how deep the storeroom extends behind the back wall
  const STORE_HEIGHT = 3.2;   // slightly lower ceiling than main shop
  const ARCHWAY_WIDTH = 1.28;  // opening in the back wall
  const ARCHWAY_HEIGHT = 2.52; // opening height
  // Archway is positioned at the right side of the back wall
  const ARCHWAY_CENTER_X = HALF_W - STORE_WIDTH / 2; // = 7 - 2 = 5
  const STORE_LEFT_X = HALF_W - STORE_WIDTH;  // = 3
  const STORE_RIGHT_X = HALF_W;               // = 7
  const STORE_BACK_Z = -HALF_D - STORE_DEPTH; // = -6 - 3.5 = -9.5

  // —— Back wall (with archway cut-out) ——
  // Left section of back wall (from left edge to archway)
  const backLeftWidth = ARCHWAY_CENTER_X - ARCHWAY_WIDTH / 2 + HALF_W;
  const backLeft = new THREE.Mesh(
    new THREE.PlaneGeometry(backLeftWidth, SHOP_HEIGHT),
    wallMat,
  );
  backLeft.position.set(-HALF_W + backLeftWidth / 2, SHOP_HEIGHT / 2, -HALF_D);
  group.add(backLeft);

  // Right section of back wall (from archway to right edge)
  const backRightWidth = HALF_W - (ARCHWAY_CENTER_X + ARCHWAY_WIDTH / 2);
  if (backRightWidth > 0.01) {
    const backRight = new THREE.Mesh(
      new THREE.PlaneGeometry(backRightWidth, SHOP_HEIGHT),
      wallMat,
    );
    backRight.position.set(HALF_W - backRightWidth / 2, SHOP_HEIGHT / 2, -HALF_D);
    group.add(backRight);
  }

  // Top section above the archway
  const topAboveHeight = SHOP_HEIGHT - ARCHWAY_HEIGHT;
  if (topAboveHeight > 0.01) {
    const backTop = new THREE.Mesh(
      new THREE.PlaneGeometry(ARCHWAY_WIDTH, topAboveHeight),
      wallMat,
    );
    backTop.position.set(ARCHWAY_CENTER_X, ARCHWAY_HEIGHT + topAboveHeight / 2, -HALF_D);
    group.add(backTop);
  }

  // Archway frame (subtle trim around the opening)
  const archFrameMat = new THREE.MeshStandardMaterial({
    color: 0x5f6675,
    roughness: 0.82,
    metalness: 0.05,
  });
  // Left jamb
  const archJambL = new THREE.Mesh(new THREE.BoxGeometry(0.05, ARCHWAY_HEIGHT, 0.06), archFrameMat);
  archJambL.position.set(ARCHWAY_CENTER_X - ARCHWAY_WIDTH / 2, ARCHWAY_HEIGHT / 2, -HALF_D);
  group.add(archJambL);
  // Right jamb
  const archJambR = new THREE.Mesh(new THREE.BoxGeometry(0.05, ARCHWAY_HEIGHT, 0.06), archFrameMat);
  archJambR.position.set(ARCHWAY_CENTER_X + ARCHWAY_WIDTH / 2, ARCHWAY_HEIGHT / 2, -HALF_D);
  group.add(archJambR);
  // Lintel
  const archLintel = new THREE.Mesh(new THREE.BoxGeometry(ARCHWAY_WIDTH + 0.08, 0.06, 0.08), archFrameMat);
  archLintel.position.set(ARCHWAY_CENTER_X, ARCHWAY_HEIGHT + 0.01, -HALF_D);
  group.add(archLintel);

  // Storeroom service door with a proper pivot and tighter opening proportions.
  const storeDoorMat = new THREE.MeshStandardMaterial({
    color: 0x765f49,
    roughness: 0.72,
    metalness: 0.08,
  });
  const storeDoorInsetMat = new THREE.MeshStandardMaterial({
    color: 0x8a7158,
    roughness: 0.76,
    metalness: 0.05,
  });
  const storeDoorMetalMat = new THREE.MeshStandardMaterial({
    color: 0xc1c8d3,
    roughness: 0.34,
    metalness: 0.72,
  });

  const storeDoorWidth = 1.04;
  const storeDoorHeight = 2.32;
  const storeDoorPivot = new THREE.Group();
  storeDoorPivot.position.set(
    ARCHWAY_CENTER_X - ARCHWAY_WIDTH / 2 + 0.02,
    0,
    -HALF_D + 0.02,
  );
  storeDoorPivot.rotation.y = 1.08;
  group.add(storeDoorPivot);

  const storeDoor = new THREE.Mesh(
    new THREE.BoxGeometry(storeDoorWidth, storeDoorHeight, 0.05),
    storeDoorMat,
  );
  storeDoor.position.set(storeDoorWidth / 2, storeDoorHeight / 2, 0);
  storeDoorPivot.add(storeDoor);

  const storeDoorInset = new THREE.Mesh(
    new THREE.BoxGeometry(storeDoorWidth - 0.18, storeDoorHeight - 0.34, 0.012),
    storeDoorInsetMat,
  );
  storeDoorInset.position.set(storeDoorWidth / 2, storeDoorHeight / 2 + 0.02, 0.028);
  storeDoorPivot.add(storeDoorInset);

  const storeDoorKick = new THREE.Mesh(
    new THREE.BoxGeometry(storeDoorWidth - 0.2, 0.24, 0.008),
    storeDoorMetalMat,
  );
  storeDoorKick.position.set(storeDoorWidth / 2, 0.22, 0.03);
  storeDoorPivot.add(storeDoorKick);

  const storeLeverRose = new THREE.Mesh(
    new THREE.CylinderGeometry(0.017, 0.017, 0.01, 14),
    storeDoorMetalMat,
  );
  storeLeverRose.rotation.x = Math.PI / 2;
  storeLeverRose.position.set(storeDoorWidth - 0.14, 1.04, 0.032);
  storeDoorPivot.add(storeLeverRose);

  const storeLeverHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.014, 0.014),
    storeDoorMetalMat,
  );
  storeLeverHandle.position.set(storeDoorWidth - 0.08, 1.04, 0.036);
  storeDoorPivot.add(storeLeverHandle);

  const hingeGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.11, 10);
  [storeDoorHeight - 0.34, storeDoorHeight * 0.5, 0.38].forEach((y) => {
    const hinge = new THREE.Mesh(hingeGeo, storeDoorMetalMat);
    hinge.rotation.x = Math.PI / 2;
    hinge.position.set(0.02, y, -0.018);
    storeDoorPivot.add(hinge);
  });

  // —— Storeroom geometry ——
  const storeWallMat = new THREE.MeshStandardMaterial({
    color: 0x1d2230,
    roughness: 0.92,
    side: THREE.DoubleSide,
  });

  // Storeroom floor
  const storeFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(STORE_WIDTH, STORE_DEPTH),
    new THREE.MeshStandardMaterial({ color: 0x4a3729, roughness: 0.86, metalness: 0.04 }),
  );
  storeFloor.rotation.x = -Math.PI / 2;
  storeFloor.position.set(ARCHWAY_CENTER_X, 0.001, -HALF_D - STORE_DEPTH / 2);
  group.add(storeFloor);

  const storePlankDepth = 0.28;
  let storePlankRow = 0;
  for (let z = -HALF_D - STORE_DEPTH + storePlankDepth / 2; z < -HALF_D; z += storePlankDepth) {
    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(STORE_WIDTH, 0.005, storePlankDepth - 0.01),
      new THREE.MeshStandardMaterial({
        color: plankPalette[storePlankRow % plankPalette.length],
        roughness: 0.86,
        metalness: 0.04,
      }),
    );
    plank.position.set(ARCHWAY_CENTER_X, 0.003, z);
    group.add(plank);
    storePlankRow += 1;
  }

  // Storeroom ceiling
  const storeCeil = new THREE.Mesh(
    new THREE.PlaneGeometry(STORE_WIDTH, STORE_DEPTH),
    new THREE.MeshStandardMaterial({ color: 0x0e1116, roughness: 0.96 }),
  );
  storeCeil.rotation.x = Math.PI / 2;
  storeCeil.position.set(ARCHWAY_CENTER_X, STORE_HEIGHT, -HALF_D - STORE_DEPTH / 2);
  group.add(storeCeil);

  // Storeroom back wall
  const storeBack = new THREE.Mesh(
    new THREE.PlaneGeometry(STORE_WIDTH, STORE_HEIGHT),
    storeWallMat,
  );
  storeBack.position.set(ARCHWAY_CENTER_X, STORE_HEIGHT / 2, STORE_BACK_Z);
  group.add(storeBack);

  // Storeroom left wall
  const storeLeftWall = new THREE.Mesh(
    new THREE.PlaneGeometry(STORE_DEPTH, STORE_HEIGHT),
    storeWallMat,
  );
  storeLeftWall.position.set(STORE_LEFT_X, STORE_HEIGHT / 2, -HALF_D - STORE_DEPTH / 2);
  storeLeftWall.rotation.y = Math.PI / 2;
  group.add(storeLeftWall);

  // Storeroom right wall
  const storeRightWall = new THREE.Mesh(
    new THREE.PlaneGeometry(STORE_DEPTH, STORE_HEIGHT),
    storeWallMat,
  );
  storeRightWall.position.set(STORE_RIGHT_X, STORE_HEIGHT / 2, -HALF_D - STORE_DEPTH / 2);
  storeRightWall.rotation.y = -Math.PI / 2;
  group.add(storeRightWall);

  // Left wall portion behind back wall (connecting main shop left wall to storeroom left wall)
  const storeJoinLeft = new THREE.Mesh(
    new THREE.PlaneGeometry(STORE_DEPTH, SHOP_HEIGHT - STORE_HEIGHT),
    wallMat,
  );
  storeJoinLeft.position.set(STORE_LEFT_X, STORE_HEIGHT + (SHOP_HEIGHT - STORE_HEIGHT) / 2, -HALF_D - STORE_DEPTH / 2);
  storeJoinLeft.rotation.y = Math.PI / 2;
  group.add(storeJoinLeft);

  // Storeroom dim overhead light fixture (bare bulb with cage)
  const storeLightX = ARCHWAY_CENTER_X;
  const storeLightZ = -HALF_D - STORE_DEPTH / 2;
  
  // Fixture base mounted to ceiling
  const storeLightBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.02, 12),
    fixtureCanopyMat
  );
  storeLightBase.position.set(storeLightX, STORE_HEIGHT - 0.01, storeLightZ);
  group.add(storeLightBase);
  
  // Bare bulb
  const storeLightBulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.035, 12, 12),
    new THREE.MeshStandardMaterial({
      color: 0xfff3dd,
      emissive: 0xffddb0,
      emissiveIntensity: 0.8,
    })
  );
  storeLightBulb.position.set(storeLightX, STORE_HEIGHT - 0.08, storeLightZ);
  group.add(storeLightBulb);
  
  // Wire cage
  const cageMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.8,
    metalness: 0.5,
    wireframe: true,
  });
  const storeLightCage = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.06, 0.12, 6, 2),
    cageMat
  );
  storeLightCage.position.set(storeLightX, STORE_HEIGHT - 0.09, storeLightZ);
  group.add(storeLightCage);

  // Actual light emitter
  const storeLight = new THREE.PointLight(0xdde3f0, 0.6, 6, 2);
  storeLight.position.set(storeLightX, STORE_HEIGHT - 0.08, storeLightZ);
  group.add(storeLight);

  // Storeroom shelving (for refill crates)
  const shelfFrameMat = new THREE.MeshStandardMaterial({
    color: 0x3a3f4c,
    roughness: 0.64,
    metalness: 0.52,
  });
  const shelfBoardMat = new THREE.MeshStandardMaterial({
    color: 0x605347,
    roughness: 0.82,
    metalness: 0.06,
  });

  const buildStoreroomShelf = (
    name: string,
    x: number,
    z: number,
    width = 1.18,
    depth = 0.68,
    height = 1.72,
  ) => {
    const shelf = new THREE.Group();
    shelf.name = `${name}-shelf`;

    const postGeo = new THREE.BoxGeometry(0.045, height, 0.045);
    const hx = width / 2 - 0.03;
    const hz = depth / 2 - 0.03;
    const postOffsets: Array<[number, number]> = [
      [-hx, -hz],
      [hx, -hz],
      [-hx, hz],
      [hx, hz],
    ];
    postOffsets.forEach(([px, pz]) => {
      const post = new THREE.Mesh(postGeo, shelfFrameMat);
      post.position.set(px, height / 2, pz);
      shelf.add(post);
    });

    const shelfLevels = [0.2, 0.88, 1.46];
    shelfLevels.forEach((level) => {
      const board = new THREE.Mesh(new THREE.BoxGeometry(width, 0.06, depth), shelfBoardMat);
      board.position.set(0, level, 0);
      shelf.add(board);
    });

    const backBrace = new THREE.Mesh(
      new THREE.BoxGeometry(width - 0.06, 0.32, 0.03),
      shelfFrameMat,
    );
    backBrace.position.set(0, 1.25, -depth / 2 + 0.015);
    shelf.add(backBrace);

    shelf.position.set(x, 0, z);
    group.add(shelf);

    colliders.push({
      name: `${name}-shelf`,
      x,
      z,
      halfW: width / 2,
      halfD: depth / 2,
    });
  };

  buildStoreroomShelf('capsule', 5.25, -9.0);
  buildStoreroomShelf('token', 3.95, -9.0);

  // Storeroom colliders (walls prevent walking through)
  colliders.push({ name: 'store-left-wall', x: STORE_LEFT_X, z: -HALF_D - STORE_DEPTH / 2, halfW: 0.06, halfD: STORE_DEPTH / 2 });
  colliders.push({ name: 'store-right-wall', x: STORE_RIGHT_X, z: -HALF_D - STORE_DEPTH / 2, halfW: 0.06, halfD: STORE_DEPTH / 2 });
  colliders.push({ name: 'store-back-wall', x: ARCHWAY_CENTER_X, z: STORE_BACK_Z, halfW: STORE_WIDTH / 2, halfD: 0.06 });
  // Block areas of back wall adjacent to archway (prevent walking through solid wall sections)
  if (backLeftWidth > 0.5) {
    colliders.push({ name: 'back-wall-left', x: -HALF_W + backLeftWidth / 2, z: -HALF_D, halfW: backLeftWidth / 2, halfD: 0.08 });
  }
  if (backRightWidth > 0.08) {
    colliders.push({ name: 'back-wall-right', x: HALF_W - backRightWidth / 2, z: -HALF_D, halfW: backRightWidth / 2, halfD: 0.08 });
  }

  // Front wall split around the entrance opening.
  const frontSideWidth = (SHOP_WIDTH - EXIT_OPENING_WIDTH) / 2;
  const frontTopHeight = SHOP_HEIGHT - EXIT_OPENING_HEIGHT;

  const frontLeft = new THREE.Mesh(
    new THREE.PlaneGeometry(frontSideWidth, SHOP_HEIGHT),
    wallMat,
  );
  frontLeft.position.set(
    -EXIT_OPENING_WIDTH / 2 - frontSideWidth / 2,
    SHOP_HEIGHT / 2,
    HALF_D,
  );
  frontLeft.rotation.y = Math.PI;
  group.add(frontLeft);

  const frontRight = new THREE.Mesh(
    new THREE.PlaneGeometry(frontSideWidth, SHOP_HEIGHT),
    wallMat,
  );
  frontRight.position.set(
    EXIT_OPENING_WIDTH / 2 + frontSideWidth / 2,
    SHOP_HEIGHT / 2,
    HALF_D,
  );
  frontRight.rotation.y = Math.PI;
  group.add(frontRight);

  if (frontTopHeight > 0.01) {
    const frontTop = new THREE.Mesh(
      new THREE.PlaneGeometry(EXIT_OPENING_WIDTH, frontTopHeight),
      wallMat,
    );
    frontTop.position.set(0, EXIT_OPENING_HEIGHT + frontTopHeight / 2, HALF_D);
    frontTop.rotation.y = Math.PI;
    group.add(frontTop);
  }

  // Left wall
  const left = new THREE.Mesh(
    new THREE.PlaneGeometry(SHOP_DEPTH, SHOP_HEIGHT),
    wallMat,
  );
  left.position.set(-HALF_W, SHOP_HEIGHT / 2, 0);
  left.rotation.y = Math.PI / 2;
  group.add(left);

  // Right wall
  const right = new THREE.Mesh(
    new THREE.PlaneGeometry(SHOP_DEPTH, SHOP_HEIGHT),
    wallMat,
  );
  right.position.set(HALF_W, SHOP_HEIGHT / 2, 0);
  right.rotation.y = -Math.PI / 2;
  group.add(right);

  // Baseboards (thin dark strip along bottom of walls)
  const bbHeight = 0.12;
  const bbGeo = (w: number) => new THREE.BoxGeometry(w, bbHeight, 0.03);
  const bbFrontLeft = new THREE.Mesh(bbGeo(frontSideWidth), baseboardMat);
  bbFrontLeft.position.set(
    -EXIT_OPENING_WIDTH / 2 - frontSideWidth / 2,
    bbHeight / 2,
    HALF_D - 0.01,
  );
  group.add(bbFrontLeft);
  const bbFrontRight = new THREE.Mesh(bbGeo(frontSideWidth), baseboardMat);
  bbFrontRight.position.set(
    EXIT_OPENING_WIDTH / 2 + frontSideWidth / 2,
    bbHeight / 2,
    HALF_D - 0.01,
  );
  group.add(bbFrontRight);
  const bbLeft = new THREE.Mesh(bbGeo(SHOP_DEPTH), baseboardMat);
  bbLeft.position.set(-HALF_W + 0.01, bbHeight / 2, 0);
  bbLeft.rotation.y = Math.PI / 2;
  group.add(bbLeft);
  const bbRight = new THREE.Mesh(bbGeo(SHOP_DEPTH), baseboardMat);
  bbRight.position.set(HALF_W - 0.01, bbHeight / 2, 0);
  bbRight.rotation.y = Math.PI / 2;
  group.add(bbRight);

  // ————————————————————————————————
  // Machines
  // ————————————————————————————————

  for (const def of machines) {
    const state = machineStates.get(def.id);
    const machineGroup = createCapsuleMachine(def, state);

    // Wondertrade gets a special interaction type
    if (def.id === 'machine-wondertrade') {
      tagInteractable(machineGroup, {
        type: 'wondertrade',
        prompt: def.name,
        machineId: def.id,
      });
    }

    group.add(machineGroup);
    machineGroups.set(def.id, machineGroup);
    interactables.push(machineGroup);

    const rotated = Math.abs(def.rotation) % Math.PI > 0.01;
    const machineHalfW = 0.48;
    const machineHalfD = 0.42;
    colliders.push({
      name: `machine-${def.id}`,
      x: def.position[0],
      z: def.position[2],
      halfW: rotated ? machineHalfD : machineHalfW,
      halfD: rotated ? machineHalfW : machineHalfD,
    });
  }

  // ————————————————————————————————
  // Checkout counter (removed for redesign)
  // ————————————————————————————————

  // ————————————————————————————————
  // Storage crate (back-right, for restock tasks)
  // ————————————————————————————————
  const storageCrate = buildStorageCrate();
  group.add(storageCrate.group);
  storageCrate.spillCapsules.forEach((spill) => group.add(spill));
  interactables.push(storageCrate.interactable);
  colliders.push(storageCrate.collider);

  // Dedicated token refill crate near token terminal
  const tokenCrate = buildTokenCrate();
  group.add(tokenCrate.group);
  interactables.push(tokenCrate.interactable);
  colliders.push(tokenCrate.collider);

  // ————————————————————————————————
  // Token purchase station (near entrance)
  // ————————————————————————————————
  const tokenStation = buildTokenStation();
  group.add(tokenStation.group);
  interactables.push(tokenStation.interactable);
  colliders.push(tokenStation.collider);

  // ————————————————————————————————
  // Exit door (front wall)
  // ————————————————————————————————
  const exitGroup = new THREE.Group();
  exitGroup.name = 'shop-exit';
  tagInteractable(exitGroup, {
    type: 'shop-exit',
    prompt: 'End Shift',
  });

  const exitFrameMat = new THREE.MeshStandardMaterial({
    color: 0x939ba6, // Much lighter, removing dark grey
    roughness: 0.6,
    metalness: 0.3,
  });
  const exitTrimMat = new THREE.MeshStandardMaterial({
    color: 0x98a1af,
    roughness: 0.48,
    metalness: 0.2,
  });
  const exitGlassMat = new THREE.MeshStandardMaterial({
    color: 0xdde7f1,
    emissive: 0x4f6980,
    emissiveIntensity: 0.08,
    transparent: true,
    opacity: 0.22,
    roughness: 0.08,
    metalness: 0.08,
    side: THREE.DoubleSide,
  });
  const exitHardwareMat = new THREE.MeshStandardMaterial({
    color: 0xc7ced8,
    roughness: 0.34,
    metalness: 0.74,
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

  const transomGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(0.98, 0.32),
    exitGlassMat,
  );
  transomGlass.position.set(0, 2.35, 0.07);
  exitGroup.add(transomGlass);

  const doorRailTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.94, 0.1, 0.055),
    exitFrameMat,
  );
  doorRailTop.position.set(0, 2.12, 0.035);
  exitGroup.add(doorRailTop);

  const doorRailBottom = new THREE.Mesh(
    new THREE.BoxGeometry(0.94, 0.18, 0.055),
    exitFrameMat,
  );
  doorRailBottom.position.set(0, 0.11, 0.035);
  exitGroup.add(doorRailBottom);

  const doorStileL = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 1.96, 0.055),
    exitFrameMat,
  );
  doorStileL.position.set(-0.425, 1.1, 0.035);
  exitGroup.add(doorStileL);

  const doorStileR = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 1.96, 0.055),
    exitFrameMat,
  );
  doorStileR.position.set(0.425, 1.1, 0.035);
  exitGroup.add(doorStileR);

  const exitGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(0.76, 1.68),
    exitGlassMat,
  );
  exitGlass.position.set(0, 1.2, 0.068);
  exitGroup.add(exitGlass);

  const mullion = new THREE.Mesh(
    new THREE.BoxGeometry(0.028, 1.64, 0.03),
    exitTrimMat,
  );
  mullion.position.set(0, 1.18, 0.05);
  exitGroup.add(mullion);

  // Long vertical brushed metal handle bar
  const handleGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.7, 12);
  const handle = new THREE.Mesh(handleGeo, exitHardwareMat);
  handle.position.set(0.2, 1.05, 0.09);
  exitGroup.add(handle);
  const backHandle = new THREE.Mesh(handleGeo, exitHardwareMat);
  backHandle.position.set(0.2, 1.05, 0.045);
  exitGroup.add(backHandle);
  
  // Handle standoff mounts
  const mountGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.06, 8);
  mountGeo.rotateX(Math.PI / 2);
  [-0.3, 0.3].forEach((yOffset) => {
    const mount = new THREE.Mesh(mountGeo, exitHardwareMat);
    mount.position.set(0.2, 1.05 + yOffset, 0.065);
    exitGroup.add(mount);
  });

  // Door closer removed as requested

  const exitKickPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.74, 0.18, 0.008),
    exitHardwareMat,
  );
  exitKickPlate.position.set(0, 0.22, 0.07);
  exitGroup.add(exitKickPlate);

  const frontTrimL = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, EXIT_OPENING_HEIGHT, 0.08),
    exitTrimMat,
  );
  frontTrimL.position.set(-EXIT_OPENING_WIDTH / 2, EXIT_OPENING_HEIGHT / 2, -0.02);
  exitGroup.add(frontTrimL);

  const frontTrimR = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, EXIT_OPENING_HEIGHT, 0.08),
    exitTrimMat,
  );
  frontTrimR.position.set(EXIT_OPENING_WIDTH / 2, EXIT_OPENING_HEIGHT / 2, -0.02);
  exitGroup.add(frontTrimR);

  const frontTrimTop = new THREE.Mesh(
    new THREE.BoxGeometry(EXIT_OPENING_WIDTH + 0.08, 0.06, 0.08),
    exitTrimMat,
  );
  frontTrimTop.position.set(0, EXIT_OPENING_HEIGHT, -0.02);
  exitGroup.add(frontTrimTop);

  exitGroup.position.set(0, 0, HALF_D - 0.06);
  exitGroup.rotation.y = Math.PI;
  group.add(exitGroup);
  interactables.push(exitGroup);

  // ————————————————————————————————
  // Lighting
  // ————————————————————————————————

  const ambient = new THREE.AmbientLight(0xfff1de, 0.38);
  group.add(ambient);

  // Removed moved materials

  const addCeilingFixture = (x: number, z: number, length = 2.4) => {
    // Flush mount base (was body)
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(length, 0.08, 0.44),
      fixtureCanopyMat,
    );
    base.position.set(x, 3.96, z); // Ceiling is at 4.0
    group.add(base);

    // Main rectangular diffuser
    const diffuser = new THREE.Mesh(
      new THREE.BoxGeometry(length - 0.06, 0.04, 0.38),
      fixtureDiffuserMat,
    );
    diffuser.position.set(x, 3.9, z);
    group.add(diffuser);

    // Warm light emission
    const light = new THREE.PointLight(0xffe6c2, 1.0, 0, 2);
    light.power = 850; // Increased to compensate for warm wrap
    light.position.set(x, 3.8, z);
    group.add(light);
  };

  const fixturePositions: Array<[number, number]> = [
    [-4.8, -2.65],
    [-1.6, -2.65],
    [1.6, -2.65],
    [4.8, -2.65],
    [-4.8, 1.05],
    [-1.6, 1.05],
    [1.6, 1.05],
    [4.95, 2.45],
  ];
  fixturePositions.forEach(([x, z]) => {
    addCeilingFixture(x, z);
  });

  const bounceA = new THREE.PointLight(0xffd7ad, 1.0, 0, 2);
  bounceA.power = 520;
  bounceA.position.set(-4.8, 2.2, -1.9);
  group.add(bounceA);

  const bounceB = new THREE.PointLight(0xffd7ad, 1.0, 0, 2);
  bounceB.power = 500;
  bounceB.position.set(4.3, 2.18, -1.3);
  group.add(bounceB);

  const doorSconceCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.038, 0.038, 0.14, 14),
    new THREE.MeshStandardMaterial({
      color: 0xffe2c1,
      emissive: 0xffc58f,
      emissiveIntensity: 0.32,
      roughness: 0.32,
      metalness: 0.08,
    }),
  );
  doorSconceCore.position.set(0, 2.54, HALF_D - 0.22);
  group.add(doorSconceCore);

  const doorSconceLight = new THREE.PointLight(0xffc48d, 1.0, 0, 2);
  doorSconceLight.power = 590;
  doorSconceLight.position.set(0, 2.42, HALF_D - 0.34);
  group.add(doorSconceLight);

  // ————————————————————————————————
  // Secret Interactables
  // ————————————————————————————————
  const secrets = buildShopSecrets();
  secrets.groups.forEach((secret) => group.add(secret));
  interactables.push(...secrets.interactables);

  return { group, machineGroups, interactables, colliders };
}
