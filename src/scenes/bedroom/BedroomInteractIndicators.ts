import * as THREE from 'three';
import { getInteractType } from '../../core/InteractionTags.js';

export class BedroomInteractIndicators {
  private readonly scene: THREE.Scene;
  private readonly indicators: THREE.Group[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  sync(interactables: THREE.Object3D[]) {
    this.dispose();

    for (const obj of interactables) {
      const type = getInteractType(obj);
      let color = 0x7c6ef0;
      if (type === 'pc') color = 0x6ebeff;
      if (type === 'collection') color = 0xd890ff;
      if (type === 'door') color = 0xffc66e;

      const bounds = new THREE.Box3().setFromObject(obj);
      if (!Number.isFinite(bounds.min.x) || !Number.isFinite(bounds.max.y)) {
        continue;
      }

      const marker = new THREE.Group();
      const glowTex = this.createSoftGlowTexture(color);
      const glowMat = new THREE.MeshBasicMaterial({
        map: glowTex,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.62,
      });
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), glowMat);
      glow.name = 'interact-glow';
      glow.rotation.x = -Math.PI / 2;
      marker.add(glow);

      const beaconMat = new THREE.MeshStandardMaterial({
        color: 0xecf6ff,
        emissive: color,
        emissiveIntensity: 0.9,
        roughness: 0.2,
        metalness: 0.1,
      });
      const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.03, 0), beaconMat);
      beacon.name = 'interact-beacon';
      marker.add(beacon);

      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.007, 0.009, 0.1, 8),
        new THREE.MeshStandardMaterial({
          color: 0xaedfff,
          emissive: color,
          emissiveIntensity: 0.45,
          roughness: 0.35,
          metalness: 0.2,
          transparent: true,
          opacity: 0.85,
        }),
      );
      stem.name = 'interact-stem';
      marker.add(stem);

      const centerX = (bounds.min.x + bounds.max.x) * 0.5;
      const centerZ = (bounds.min.z + bounds.max.z) * 0.5;
      const floorY = bounds.min.y + 0.025;
      const topY = bounds.max.y + 0.17;

      marker.position.set(centerX, 0, centerZ);
      glow.position.y = floorY;
      beacon.position.y = topY;
      stem.position.y = topY - 0.06;

      marker.userData['baseY'] = topY;
      marker.userData['floorY'] = floorY;
      marker.userData['phase'] = this.indicators.length * 0.72;

      this.scene.add(marker);
      this.indicators.push(marker);
    }
  }

  update(timeSeconds: number) {
    this.indicators.forEach((marker) => {
      const baseY = (marker.userData['baseY'] as number | undefined) ?? 1;
      const floorY = (marker.userData['floorY'] as number | undefined) ?? 0.05;
      const phase = (marker.userData['phase'] as number | undefined) ?? 0;

      const bob = Math.sin(timeSeconds * 1.95 + phase) * 0.026;
      const pulse = 0.72 + (Math.sin(timeSeconds * 2.6 + phase) * 0.28);

      const beacon = marker.getObjectByName('interact-beacon') as THREE.Mesh | undefined;
      if (beacon) {
        beacon.position.y = baseY + bob;
        beacon.rotation.y += 0.013;
        const scale = 0.86 + pulse * 0.22;
        beacon.scale.set(scale, scale, scale);
      }

      const stem = marker.getObjectByName('interact-stem') as THREE.Mesh | undefined;
      if (stem) {
        stem.position.y = (baseY - 0.06) + bob * 0.6;
      }

      const glow = marker.getObjectByName('interact-glow') as THREE.Mesh | undefined;
      if (glow) {
        glow.position.y = floorY;
        glow.rotation.z += 0.004;
        const glowScale = 0.92 + pulse * 0.22;
        glow.scale.set(glowScale, glowScale, glowScale);
        if (glow.material instanceof THREE.MeshBasicMaterial) {
          glow.material.opacity = 0.42 + pulse * 0.22;
        }
      }
    });
  }

  dispose() {
    this.indicators.forEach((marker) => {
      marker.removeFromParent();
      marker.traverse((child) => {
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
    this.indicators.length = 0;
  }

  private createSoftGlowTexture(colorHex: number): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const color = new THREE.Color(colorHex);
      const r = Math.round(color.r * 255);
      const g = Math.round(color.g * 255);
      const b = Math.round(color.b * 255);
      const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 56);
      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.92)`);
      grad.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.45)`);
      grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }
}
