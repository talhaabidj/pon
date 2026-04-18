/**
 * InteractionSystem — Raycaster-based interaction detection.
 *
 * Each frame, casts a ray from the camera center and checks
 * for objects with `userData.interactable === true`.
 * Reports the nearest interactable (if within range) so the
 * scene can show prompts and handle E-press actions.
 */

import * as THREE from 'three';

export interface InteractionTarget {
  object: THREE.Object3D;
  type: string;
  prompt: string;
  distance: number;
}

const INTERACT_RANGE = 2.5; // meters

export class InteractionSystem {
  private raycaster = new THREE.Raycaster();
  private center = new THREE.Vector2(0, 0);
  private interactables: THREE.Object3D[] = [];

  /** Register objects to check against */
  setInteractables(objects: THREE.Object3D[]) {
    this.interactables = objects;
  }

  /**
   * Check what the player is looking at.
   * Returns the nearest interactable within range, or null.
   */
  check(camera: THREE.Camera): InteractionTarget | null {
    this.raycaster.setFromCamera(this.center, camera);
    this.raycaster.far = INTERACT_RANGE;

    // We need to collect all meshes from each interactable group
    const allMeshes: THREE.Mesh[] = [];
    const meshToInteractable = new Map<THREE.Mesh, THREE.Object3D>();

    for (const obj of this.interactables) {
      obj.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          allMeshes.push(child);
          meshToInteractable.set(child, obj);
        }
      });
    }

    const hits = this.raycaster.intersectObjects(allMeshes, false);

    if (hits.length === 0) return null;

    // Find the first hit that maps to an interactable
    for (const hit of hits) {
      const parent = meshToInteractable.get(hit.object as THREE.Mesh);
      if (parent) {
        return {
          object: parent,
          type: (parent.userData['interactType'] as string) ?? 'unknown',
          prompt: (parent.userData['prompt'] as string) ?? 'Interact',
          distance: hit.distance,
        };
      }
    }

    return null;
  }

  dispose() {
    this.interactables = [];
  }
}
