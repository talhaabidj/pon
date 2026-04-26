import * as THREE from 'three';
import type { ActiveTask } from '../../data/types.js';
import { TASK_TEMPLATES } from '../../data/tasks.js';
import { INTERACTION_KEYS, tagInteractable } from '../../core/InteractionTags.js';
import type { ShopCollider } from '../../world/ShopFloor.js';

interface MudSpotState {
  mesh: THREE.Mesh;
  marker: THREE.Group;
  hitsRequired: number;
  hitsDone: number;
  rewardRemaining: number;
  timeRemaining: number;
  isCompleted: boolean;
}

export interface MudMopResult {
  isCompleted: boolean;
  hitsDone: number;
  hitsRequired: number;
  rewardGained: number;
  timeCost: number;
}

const MUD_FLOOR_Y = 0.002;
const SHOP_HALF_WIDTH = 7;
const SHOP_HALF_DEPTH = 6;
const WALL_CLEARANCE = 0.55;

const AISLE_ZONES: Array<{ xMin: number; xMax: number; zMin: number; zMax: number }> = [
  { xMin: -4.9, xMax: 4.9, zMin: -0.8, zMax: 4.0 },
  { xMin: -6.2, xMax: -4.8, zMin: -4.1, zMax: 4.0 },
  { xMin: 4.8, xMax: 6.2, zMin: -4.1, zMax: 3.4 },
  { xMin: -2.8, xMax: 3.0, zMin: -5.1, zMax: -3.2 },
];

export class MudSplashTaskSystem {
  private readonly mudSpots = new Map<string, MudSpotState>();

  constructor(
    private readonly scene3d: THREE.Scene,
    private readonly colliders: readonly ShopCollider[],
    private readonly rng: () => number = Math.random,
  ) {}

  spawn(tasks: readonly ActiveTask[], interactables: THREE.Object3D[]) {
    const floorTasks = tasks.filter((task) => {
      const template = TASK_TEMPLATES.find((t) => t.id === task.templateId);
      return template?.targetType === 'floor';
    });

    floorTasks.forEach((task, idx) => {
      const pos = this.findValidMudSpot(idx);
      const variant = idx + Math.floor(this.rng() * 8);
      const splash = this.createMudSplashMesh(variant);
      const marker = this.createTaskMarker();

      splash.name = task.targetId;
      tagInteractable(splash, {
        type: 'floor-spot',
        prompt: 'Scrub mud splash',
        targetId: task.targetId,
      });
      marker.name = `${task.targetId}-marker`;
      tagInteractable(marker, {
        type: 'floor-spot',
        prompt: 'Scrub mud splash',
        targetId: task.targetId,
      });

      splash.position.set(pos.x, MUD_FLOOR_Y, pos.z);
      splash.rotation.y = this.rng() * Math.PI * 2;

      marker.position.set(pos.x, 0.18, pos.z);

      this.scene3d.add(splash);
      this.scene3d.add(marker);
      interactables.push(splash);
      interactables.push(marker);

      this.mudSpots.set(task.targetId, {
        mesh: splash,
        marker,
        hitsRequired: 3 + Math.floor(this.rng() * 4),
        hitsDone: 0,
        rewardRemaining: -1,
        timeRemaining: -1,
        isCompleted: false,
      });
    });
  }

  mop(targetId: string, baseReward: number, baseTime: number): MudMopResult | null {
    const spot = this.mudSpots.get(targetId);
    if (!spot || spot.isCompleted) return null;

    if (spot.rewardRemaining < 0) {
      spot.rewardRemaining = Math.max(1, Math.floor(baseReward));
    }
    if (spot.timeRemaining < 0) {
      spot.timeRemaining = Math.max(1, Math.floor(baseTime));
    }

    spot.hitsDone += 1;
    const hitsLeft = Math.max(0, spot.hitsRequired - spot.hitsDone);

    const rewardGained = hitsLeft === 0
      ? spot.rewardRemaining
      : Math.max(1, Math.floor(spot.rewardRemaining / (hitsLeft + 1)));
    spot.rewardRemaining = Math.max(0, spot.rewardRemaining - rewardGained);

    const timeCost = hitsLeft === 0
      ? spot.timeRemaining
      : Math.max(1, Math.floor(spot.timeRemaining / (hitsLeft + 1)));
    spot.timeRemaining = Math.max(0, spot.timeRemaining - timeCost);

    const material = spot.mesh.material as THREE.MeshStandardMaterial;
    const progress = spot.hitsDone / spot.hitsRequired;

    // Shrink and flatten the mud as it gets scrubbed away.
    const footprintScale = Math.max(0.58, 1 - (progress * (0.24 + this.rng() * 0.06)));
    const thicknessScale = Math.max(0.45, 1 - progress * 0.62);
    spot.mesh.scale.set(footprintScale, thicknessScale, footprintScale);
    material.opacity = Math.max(0.06, 0.92 - progress * 0.82);

    const setProgress = spot.marker.userData['setProgress'] as
      | ((value: number) => void)
      | undefined;
    setProgress?.(progress);

    if (hitsLeft === 0) {
      spot.isCompleted = true;
      spot.mesh.visible = false;
      spot.mesh.userData[INTERACTION_KEYS.interactable] = false;
      spot.marker.visible = false;
      spot.marker.userData[INTERACTION_KEYS.interactable] = false;
    }

    return {
      isCompleted: hitsLeft === 0,
      hitsDone: spot.hitsDone,
      hitsRequired: spot.hitsRequired,
      rewardGained,
      timeCost,
    };
  }

  dispose() {
    this.mudSpots.forEach((spot) => {
      spot.mesh.geometry.dispose();
      (spot.mesh.material as THREE.Material).dispose();

      spot.marker.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    });
    this.mudSpots.clear();
  }

  private createMudSplashMesh(variantIndex: number): THREE.Mesh {
    const shape = this.createMudShape(variantIndex);
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.028,
      steps: 1,
      curveSegments: 20,
      bevelEnabled: true,
      bevelThickness: 0.006,
      bevelSize: 0.012,
      bevelSegments: 1,
    });

    // Shape is authored in XY; rotate so it lays on the XZ floor with real thickness.
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, 0.002, 0);
    geometry.computeVertexNormals();

    const hue = 0.06 + (this.rng() * 0.02);
    const sat = 0.46 + (this.rng() * 0.08);
    const light = 0.16 + (this.rng() * 0.05);

    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue, sat, light),
      emissive: 0x1a120b,
      emissiveIntensity: 0.22,
      roughness: 0.93,
      metalness: 0.02,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -2,
    });

    return new THREE.Mesh(geometry, material);
  }

  private createMudShape(seed: number): THREE.Shape {
    const shape = new THREE.Shape();
    const points = 12 + (seed % 5);
    const baseRadius = 0.34 + (seed % 4) * 0.04;

    for (let i = 0; i < points; i += 1) {
      const angle = (i / points) * Math.PI * 2;
      const pulse = 0.68 + (this.rng() * 0.58);
      const arm = baseRadius * pulse * (i % 3 === 0 ? 1.14 : 1);
      const x = Math.cos(angle) * arm;
      const y = Math.sin(angle) * arm;

      if (i === 0) {
        shape.moveTo(x, y);
      } else {
        shape.lineTo(x, y);
      }
    }
    shape.closePath();

    return shape;
  }

  private createTaskMarker(): THREE.Group {
    const marker = new THREE.Group();

    const glowTex = this.createMarkerGlowTexture();
    const glowMat = new THREE.MeshBasicMaterial({
      map: glowTex,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.76,
    });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), glowMat);
    glow.rotation.x = -Math.PI / 2;
    marker.add(glow);

    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0xfff4b0,
      emissive: 0xf2d65c,
      emissiveIntensity: 0.95,
      roughness: 0.24,
      metalness: 0.14,
      transparent: true,
      opacity: 0.95,
    });
    const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.03, 0), beaconMat);
    beacon.position.y = 0.058;
    marker.add(beacon);

    const stemMat = new THREE.MeshStandardMaterial({
      color: 0xffef9f,
      emissive: 0xf2d65c,
      emissiveIntensity: 0.45,
      roughness: 0.32,
      metalness: 0.12,
      transparent: true,
      opacity: 0.84,
    });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.008, 0.07, 8), stemMat);
    stem.position.y = 0.035;
    marker.add(stem);

    marker.userData['setProgress'] = (progress: number) => {
      const fade = Math.max(0.08, 1 - progress);
      glowMat.opacity = 0.12 + fade * 0.64;
      beaconMat.opacity = 0.2 + fade * 0.74;
      stemMat.opacity = 0.14 + fade * 0.6;
      beaconMat.emissiveIntensity = 0.2 + fade * 0.75;
      stemMat.emissiveIntensity = 0.12 + fade * 0.45;
    };

    return marker;
  }

  private createMarkerGlowTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 56);
      grad.addColorStop(0, 'rgba(242, 214, 92, 0.95)');
      grad.addColorStop(0.4, 'rgba(242, 214, 92, 0.46)');
      grad.addColorStop(1, 'rgba(242, 214, 92, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  private findValidMudSpot(seedOffset: number): { x: number; z: number } {
    const avoidRadius = 0.66;
    const existingMud = [...this.mudSpots.values()].map((entry) => ({
      x: entry.mesh.position.x,
      z: entry.mesh.position.z,
    }));

    let fallbackX = 0;
    let fallbackZ = 0;

    for (let attempt = 0; attempt < 120; attempt += 1) {
      const zone = AISLE_ZONES[(attempt + seedOffset) % AISLE_ZONES.length]!;
      const x = zone.xMin + this.rng() * (zone.xMax - zone.xMin);
      const z = zone.zMin + this.rng() * (zone.zMax - zone.zMin);

      fallbackX = x;
      fallbackZ = z;

      if (
        x <= -SHOP_HALF_WIDTH + WALL_CLEARANCE ||
        x >= SHOP_HALF_WIDTH - WALL_CLEARANCE ||
        z <= -SHOP_HALF_DEPTH + WALL_CLEARANCE ||
        z >= SHOP_HALF_DEPTH - WALL_CLEARANCE
      ) {
        continue;
      }

      let blocked = false;
      for (const c of this.colliders) {
        if (Math.abs(x - c.x) < c.halfW + avoidRadius && Math.abs(z - c.z) < c.halfD + avoidRadius) {
          blocked = true;
          break;
        }
      }
      if (blocked) continue;

      for (const mud of existingMud) {
        const dx = x - mud.x;
        const dz = z - mud.z;
        if ((dx * dx) + (dz * dz) < 1.0 * 1.0) {
          blocked = true;
          break;
        }
      }
      if (blocked) continue;

      return { x, z };
    }

    return { x: fallbackX, z: fallbackZ };
  }
}
