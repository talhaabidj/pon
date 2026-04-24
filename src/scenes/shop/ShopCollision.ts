import type * as THREE from 'three';
import { PLAYER_HEIGHT } from '../../core/Config.js';
import type { ShopCollider } from '../../world/ShopFloor.js';

const SHOP_HALF_W = 7.0;
const SHOP_HALF_D = 6.0;

export function clampShopPosition(
  position: THREE.Vector3,
  colliders: readonly ShopCollider[],
) {
  const wallCollisionPadding = 0.34;
  const getColliderPadding = (colliderName: string): number => {
    if (colliderName.includes('wall')) return wallCollisionPadding;
    if (colliderName.includes('shelf')) return 0.12;
    if (colliderName.includes('crate')) return 0.16;
    if (colliderName.startsWith('machine-') || colliderName === 'token-station') return 0.32;
    if (colliderName.includes('counter') || colliderName === 'vending-machine') return 0.28;
    return 0.24;
  };

  const STORE_WIDTH = 4.0;
  const STORE_DEPTH = 3.5;
  const STORE_LEFT_X = SHOP_HALF_W - STORE_WIDTH;
  const STORE_BACK_Z = -SHOP_HALF_D - STORE_DEPTH;

  const inStoreroomXRange =
    position.x > STORE_LEFT_X + 0.02 &&
    position.x < SHOP_HALF_W - 0.02;

  position.x = Math.max(
    -SHOP_HALF_W + wallCollisionPadding,
    Math.min(SHOP_HALF_W - wallCollisionPadding, position.x),
  );

  if (position.z < -SHOP_HALF_D + wallCollisionPadding) {
    if (inStoreroomXRange) {
      position.z = Math.max(STORE_BACK_Z + wallCollisionPadding, position.z);
      position.x = Math.max(
        STORE_LEFT_X + wallCollisionPadding,
        Math.min(SHOP_HALF_W - wallCollisionPadding, position.x),
      );
    } else {
      position.z = -SHOP_HALF_D + wallCollisionPadding;
    }
  } else {
    position.z = Math.min(SHOP_HALF_D - wallCollisionPadding, position.z);
  }

  position.y = PLAYER_HEIGHT;

  for (const collider of colliders) {
    const colliderPadding = getColliderPadding(collider.name);
    const boundX = collider.halfW + colliderPadding;
    const boundZ = collider.halfD + colliderPadding;

    const dx = position.x - collider.x;
    const dz = position.z - collider.z;

    if (Math.abs(dx) < boundX && Math.abs(dz) < boundZ) {
      const overlapX = boundX - Math.abs(dx);
      const overlapZ = boundZ - Math.abs(dz);

      if (overlapX < overlapZ) {
        position.x += Math.sign(dx) * overlapX;
      } else {
        position.z += Math.sign(dz) * overlapZ;
      }
    }
  }
}
