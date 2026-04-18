/**
 * Bedroom — World builder for the bedroom hub.
 *
 * Assembles room geometry, places all props, and sets up lighting.
 * Returns a THREE.Group that BedroomScene adds to its scene.
 *
 * Room dimensions: 5m × 3m (height) × 4m (depth).
 * Origin is at floor center.
 */

import * as THREE from 'three';
import { createBed } from './props/Bed.js';
import { createDesk } from './props/Desk.js';
import { createChair } from './props/Chair.js';
import { createPCSetup } from './props/PCSetup.js';
import { createDoor } from './props/Door.js';
import { createLadderShelf } from './props/LadderShelf.js';
import { createWindow } from './props/Window.js';
import { createACUnit } from './props/ACUnit.js';
import { createPoster } from './props/Poster.js';
import { createCollectionWall } from './props/CollectionWall.js';
import { createCupboard } from './props/Cupboard.js';

export interface BedroomLayout {
  group: THREE.Group;
  interactables: THREE.Object3D[];
  lights: THREE.Light[];
}

const ROOM_WIDTH = 5;
const ROOM_HEIGHT = 3;
const ROOM_DEPTH = 4;

const HALF_W = ROOM_WIDTH / 2;
const HALF_D = ROOM_DEPTH / 2;

export function buildBedroom(): BedroomLayout {
  const group = new THREE.Group();
  group.name = 'bedroom';

  const interactables: THREE.Object3D[] = [];
  const lights: THREE.Light[] = [];

  // ————————————————————————————————
  // Room shell
  // ————————————————————————————————

  // Floor — warm dark wood
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x2a2218,
    roughness: 0.88,
  });
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH),
    floorMat,
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  // Ceiling
  const ceilingMat = new THREE.MeshStandardMaterial({
    color: 0x16141f,
    roughness: 0.95,
  });
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH),
    ceilingMat,
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = ROOM_HEIGHT;
  group.add(ceiling);

  // Walls
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x1c1a28,
    roughness: 0.9,
  });

  // Back wall (Z = -HALF_D) — contains window
  const backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_HEIGHT),
    wallMat,
  );
  backWall.position.set(0, ROOM_HEIGHT / 2, -HALF_D);
  group.add(backWall);

  // Front wall (Z = +HALF_D) — contains door
  const frontWall = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_HEIGHT),
    wallMat,
  );
  frontWall.position.set(0, ROOM_HEIGHT / 2, HALF_D);
  frontWall.rotation.y = Math.PI;
  group.add(frontWall);

  // Left wall (X = -HALF_W) — contains collection wall
  const leftWall = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM_DEPTH, ROOM_HEIGHT),
    wallMat,
  );
  leftWall.position.set(-HALF_W, ROOM_HEIGHT / 2, 0);
  leftWall.rotation.y = Math.PI / 2;
  group.add(leftWall);

  // Right wall (X = +HALF_W)
  const rightWall = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM_DEPTH, ROOM_HEIGHT),
    wallMat,
  );
  rightWall.position.set(HALF_W, ROOM_HEIGHT / 2, 0);
  rightWall.rotation.y = -Math.PI / 2;
  group.add(rightWall);

  // —— Baseboard trim ——
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x12101a,
    roughness: 0.85,
  });
  const trimGeo = new THREE.BoxGeometry(ROOM_WIDTH, 0.08, 0.02);

  const trimBack = new THREE.Mesh(trimGeo, trimMat);
  trimBack.position.set(0, 0.04, -HALF_D + 0.01);
  group.add(trimBack);

  const trimFront = new THREE.Mesh(trimGeo, trimMat);
  trimFront.position.set(0, 0.04, HALF_D - 0.01);
  group.add(trimFront);

  const trimGeoSide = new THREE.BoxGeometry(0.02, 0.08, ROOM_DEPTH);
  const trimLeft = new THREE.Mesh(trimGeoSide, trimMat);
  trimLeft.position.set(-HALF_W + 0.01, 0.04, 0);
  group.add(trimLeft);

  const trimRight = new THREE.Mesh(trimGeoSide, trimMat);
  trimRight.position.set(HALF_W - 0.01, 0.04, 0);
  group.add(trimRight);

  // ————————————————————————————————
  // Props placement
  // ————————————————————————————————

  // Bed — back-left corner
  const bed = createBed();
  bed.position.set(-1.6, 0, -1.2);
  group.add(bed);

  // Desk — back-right corner, facing left wall
  const desk = createDesk();
  desk.position.set(1.5, 0, -1.2);
  desk.rotation.y = -Math.PI / 2;
  group.add(desk);

  // PC on desk
  const pc = createPCSetup();
  pc.position.set(1.5, 0.78, -1.2);
  pc.rotation.y = -Math.PI / 2;
  group.add(pc);
  interactables.push(pc);

  // Chair — in front of desk
  const chair = createChair();
  chair.position.set(1.1, 0, -1.0);
  chair.rotation.y = Math.PI * 0.6;
  group.add(chair);

  // Door — front wall, center-right
  const door = createDoor();
  door.position.set(0.8, 0, HALF_D - 0.06);
  door.rotation.y = Math.PI;
  group.add(door);
  interactables.push(door);

  // Collection wall — left wall, center
  const collectionWall = createCollectionWall();
  collectionWall.position.set(-HALF_W + 0.04, 1.4, -0.2);
  collectionWall.rotation.y = Math.PI / 2;
  group.add(collectionWall);
  interactables.push(collectionWall);

  // Ladder shelf — back wall, between bed and window
  const ladderShelf = createLadderShelf();
  ladderShelf.position.set(-0.3, 0, -HALF_D + 0.15);
  group.add(ladderShelf);

  // Window — back wall, right of center
  const win = createWindow();
  win.position.set(0.6, 1.6, -HALF_D + 0.02);
  group.add(win);

  // AC unit — right wall, high
  const ac = createACUnit();
  ac.position.set(HALF_W - 0.12, 2.4, -0.5);
  ac.rotation.y = -Math.PI / 2;
  group.add(ac);

  // Cupboard — front-left corner
  const cupboard = createCupboard();
  cupboard.position.set(-1.8, 0, 1.3);
  cupboard.rotation.y = Math.PI;
  group.add(cupboard);

  // Posters — right wall
  const poster1 = createPoster(0);
  poster1.position.set(HALF_W - 0.02, 1.7, 0.5);
  poster1.rotation.y = -Math.PI / 2;
  group.add(poster1);

  const poster2 = createPoster(1);
  poster2.position.set(HALF_W - 0.02, 1.7, 1.2);
  poster2.rotation.y = -Math.PI / 2;
  group.add(poster2);

  // ————————————————————————————————
  // Lighting — cozy night feel
  // ————————————————————————————————

  // Dim ambient
  const ambient = new THREE.AmbientLight(0x1a1530, 0.6);
  group.add(ambient);
  lights.push(ambient);

  // Warm desk lamp (main light)
  const deskLight = new THREE.PointLight(0xffd080, 1.2, 6, 1.5);
  deskLight.position.set(1.4, 1.6, -1.3);
  group.add(deskLight);
  lights.push(deskLight);

  // Monitor glow (cool accent)
  const monitorGlow = new THREE.PointLight(0x6060ff, 0.4, 3, 2);
  monitorGlow.position.set(1.5, 1.1, -1.2);
  group.add(monitorGlow);
  lights.push(monitorGlow);

  // Soft moonlight through window
  const moonlight = new THREE.PointLight(0x4466aa, 0.3, 5, 2);
  moonlight.position.set(0.6, 2.0, -HALF_D + 0.3);
  group.add(moonlight);
  lights.push(moonlight);

  // Ceiling light (dim, warm)
  const ceilingLight = new THREE.PointLight(0xffe8cc, 0.15, 8, 2);
  ceilingLight.position.set(0, 2.8, 0);
  group.add(ceilingLight);
  lights.push(ceilingLight);

  // Collection wall accent light
  const wallLight = new THREE.SpotLight(0x7c6ef0, 0.4, 4, Math.PI / 6, 0.5);
  wallLight.position.set(-HALF_W + 0.5, 2.4, -0.2);
  wallLight.target.position.set(-HALF_W + 0.04, 1.4, -0.2);
  group.add(wallLight);
  group.add(wallLight.target);
  lights.push(wallLight);

  return { group, interactables, lights };
}
