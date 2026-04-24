import * as THREE from 'three';
import { PLAYER_HEIGHT } from '../../core/Config.js';
import { getInteractType } from '../../core/InteractionTags.js';
import type { InteractionSystem } from '../../core/InteractionSystem.js';
import type { ShopCollider } from '../../world/ShopFloor.js';
import type { ShopRuntimeContext } from './ShopRuntimeContext.js';

export interface ShopSceneRuntimeBinding {
  machineGroups: Map<string, THREE.Group>;
  tokenStationGroup: THREE.Group | null;
  colliders: ShopCollider[];
  interactables: THREE.Object3D[];
}

export function bindRuntimeToShopScene(
  scene3d: THREE.Scene,
  interaction: InteractionSystem,
  camera: THREE.PerspectiveCamera,
  runtime: ShopRuntimeContext,
): ShopSceneRuntimeBinding {
  scene3d.add(runtime.layout.group);
  interaction.setInteractables(runtime.layout.interactables);
  camera.position.set(0, PLAYER_HEIGHT, 4);

  const tokenStationObj = runtime.layout.interactables.find(
    (obj) => getInteractType(obj) === 'token-station',
  );

  return {
    machineGroups: runtime.layout.machineGroups,
    tokenStationGroup: (tokenStationObj as THREE.Group | undefined) ?? null,
    colliders: runtime.layout.colliders,
    interactables: runtime.layout.interactables,
  };
}
