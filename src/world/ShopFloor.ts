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
import { createCapsuleMachine } from './machines/CapsuleMachine.js';

export interface ShopLayout {
  group: THREE.Group;
  machineGroups: Map<string, THREE.Group>;
  interactables: THREE.Object3D[];
}

const SHOP_WIDTH = 14;
const SHOP_HEIGHT = 4;
const SHOP_DEPTH = 12;
const HALF_W = SHOP_WIDTH / 2;
const HALF_D = SHOP_DEPTH / 2;

export function buildShopFloor(
  machines: MachineDefinition[],
  machineStates: Map<string, MachineState>,
): ShopLayout {
  const group = new THREE.Group();
  group.name = 'shop-floor';

  const machineGroups = new Map<string, THREE.Group>();
  const interactables: THREE.Object3D[] = [];

  // ————————————————————————————————
  // Room shell
  // ————————————————————————————————

  // Floor — dark tile pattern
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x18181e,
    roughness: 0.8,
  });
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(SHOP_WIDTH, SHOP_DEPTH),
    floorMat,
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  // Floor grid lines (subtle tile pattern)
  const linesMat = new THREE.MeshStandardMaterial({
    color: 0x222228,
    roughness: 0.9,
  });
  for (let x = -HALF_W; x <= HALF_W; x += 1) {
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(0.01, 0.001, SHOP_DEPTH),
      linesMat,
    );
    line.position.set(x, 0.001, 0);
    group.add(line);
  }
  for (let z = -HALF_D; z <= HALF_D; z += 1) {
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(SHOP_WIDTH, 0.001, 0.01),
      linesMat,
    );
    line.position.set(0, 0.001, z);
    group.add(line);
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
    color: 0x14141c,
    roughness: 0.9,
  });

  // Back wall
  const back = new THREE.Mesh(
    new THREE.PlaneGeometry(SHOP_WIDTH, SHOP_HEIGHT),
    wallMat,
  );
  back.position.set(0, SHOP_HEIGHT / 2, -HALF_D);
  group.add(back);

  // Front wall
  const front = new THREE.Mesh(
    new THREE.PlaneGeometry(SHOP_WIDTH, SHOP_HEIGHT),
    wallMat,
  );
  front.position.set(0, SHOP_HEIGHT / 2, HALF_D);
  front.rotation.y = Math.PI;
  group.add(front);

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

  // ————————————————————————————————
  // Machines
  // ————————————————————————————————

  for (const def of machines) {
    const state = machineStates.get(def.id);
    const machineGroup = createCapsuleMachine(def, state);

    // Wondertrade gets a special interaction type
    if (def.id === 'machine-wondertrade') {
      machineGroup.userData['interactType'] = 'wondertrade';
    }

    group.add(machineGroup);
    machineGroups.set(def.id, machineGroup);
    interactables.push(machineGroup);
  }

  // ————————————————————————————————
  // Checkout counter (back-left)
  // ————————————————————————————————

  const counterMat = new THREE.MeshStandardMaterial({
    color: 0x2a2520,
    roughness: 0.8,
  });
  const counter = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 1.0, 0.6),
    counterMat,
  );
  counter.position.set(-5, 0.5, -4.5);
  group.add(counter);

  // Register on counter
  const registerMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a22,
    roughness: 0.4,
    metalness: 0.5,
  });
  const register = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.25, 0.3),
    registerMat,
  );
  register.position.set(-5, 1.13, -4.45);
  group.add(register);

  // ————————————————————————————————
  // Storage crate (back-right, for restock tasks)
  // ————————————————————————————————

  const crateMat = new THREE.MeshStandardMaterial({
    color: 0x4a3d2e,
    roughness: 0.9,
  });
  const crate = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.6, 0.6),
    crateMat,
  );
  crate.position.set(5.5, 0.3, -4.5);
  group.add(crate);

  // Capsules spilling from crate
  for (let i = 0; i < 5; i++) {
    const spill = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 6, 4),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(i * 0.2, 0.6, 0.5),
        roughness: 0.5,
      }),
    );
    spill.position.set(
      5.3 + Math.random() * 0.5,
      0.04,
      -4.3 + Math.random() * 0.3,
    );
    group.add(spill);
  }

  // ————————————————————————————————
  // Token purchase station (near entrance)
  // ————————————————————————————————
  const stationGroup = new THREE.Group();
  stationGroup.name = 'token-station';
  stationGroup.userData['interactable'] = true;
  stationGroup.userData['interactType'] = 'token-station';
  stationGroup.userData['prompt'] = 'Buy Tokens';

  const stationBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 1.2, 0.4),
    new THREE.MeshStandardMaterial({
      color: 0x2a2a38,
      roughness: 0.5,
      metalness: 0.4,
    }),
  );
  stationBody.position.set(0, 0.6, 0);
  stationGroup.add(stationBody);

  const stationScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.4, 0.3),
    new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      emissive: 0x7c6ef0,
      emissiveIntensity: 0.2,
    }),
  );
  stationScreen.position.set(0, 0.9, 0.201);
  stationGroup.add(stationScreen);

  stationGroup.position.set(5.5, 0, 3);
  group.add(stationGroup);
  interactables.push(stationGroup);

  // ————————————————————————————————
  // Exit door (front wall)
  // ————————————————————————————————
  const exitGroup = new THREE.Group();
  exitGroup.name = 'shop-exit';
  exitGroup.userData['interactable'] = true;
  exitGroup.userData['interactType'] = 'shop-exit';
  exitGroup.userData['prompt'] = 'End Shift';

  const exitFrame = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 2.3, 0.1),
    new THREE.MeshStandardMaterial({ color: 0x2a2218, roughness: 0.8 }),
  );
  exitFrame.position.set(0, 1.15, 0);
  exitGroup.add(exitFrame);

  const exitSign = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.06, 0.01),
    new THREE.MeshStandardMaterial({
      color: 0xff4444,
      emissive: 0xff2222,
      emissiveIntensity: 0.5,
    }),
  );
  exitSign.position.set(0, 2.45, 0);
  exitGroup.add(exitSign);

  exitGroup.position.set(0, 0, HALF_D - 0.06);
  exitGroup.rotation.y = Math.PI;
  group.add(exitGroup);
  interactables.push(exitGroup);

  // ————————————————————————————————
  // Lighting
  // ————————————————————————————————

  // Ambient
  const ambient = new THREE.AmbientLight(0x181830, 0.5);
  group.add(ambient);

  // Ceiling strip lights (fluorescent feel)
  for (let i = 0; i < 4; i++) {
    const stripLight = new THREE.RectAreaLight(
      0xeeeeff,
      1.2,
      2.5,
      0.15,
    );
    stripLight.position.set(-4.5 + i * 3, 3.9, -1);
    stripLight.lookAt(-4.5 + i * 3, 0, -1);
    group.add(stripLight);
  }

  // Back row lights
  for (let i = 0; i < 3; i++) {
    const light = new THREE.PointLight(0xccddff, 0.5, 8, 2);
    light.position.set(-3 + i * 3, 3.5, -3);
    group.add(light);
  }

  // Front row lights (warmer)
  for (let i = 0; i < 3; i++) {
    const light = new THREE.PointLight(0xffeedd, 0.4, 8, 2);
    light.position.set(-3 + i * 3, 3.5, 2);
    group.add(light);
  }

  // Emergency / accent lighting near exit
  const exitLight = new THREE.PointLight(0xff4444, 0.3, 4, 2);
  exitLight.position.set(0, 2.8, HALF_D - 0.5);
  group.add(exitLight);

  return { group, machineGroups, interactables };
}
