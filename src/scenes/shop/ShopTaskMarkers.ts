import * as THREE from 'three';
import type { ActiveTask } from '../../data/types.js';
import { TASK_TEMPLATES } from '../../data/tasks.js';

export interface ShopTaskMarkerInput {
  machineGroups: Map<string, THREE.Group>;
  tokenStationGroup: THREE.Group | null;
  tasks: readonly ActiveTask[];
}

export function updateShopTaskMarkers(input: ShopTaskMarkerInput) {
  input.machineGroups.forEach((group) => {
    const existing = group.getObjectByName('task-indicator');
    existing?.removeFromParent();
  });
  const tokenMarker = input.tokenStationGroup?.getObjectByName('task-indicator');
  tokenMarker?.removeFromParent();

  const pendingMachineTasks = input.tasks.filter((task) => {
    if (task.isCompleted) return false;
    const template = TASK_TEMPLATES.find((tt) => tt.id === task.templateId);
    return template?.targetType === 'machine';
  });

  for (const task of pendingMachineTasks) {
    const machine = input.machineGroups.get(task.targetId)
      ?? (task.targetId === 'token-station' ? input.tokenStationGroup ?? undefined : undefined);
    if (!machine) continue;

    const template = TASK_TEMPLATES.find((tt) => tt.id === task.templateId);
    if (!template) continue;

    let color = 0xf2d65c;
    if (template.type === 'wipe_glass') color = 0x7ac7ff;
    if (template.type === 'restock') color = 0xf2d65c;
    if (template.type === 'fix_jam') color = 0xff8b4a;
    if (template.type === 'rewire') color = 0xff5f5f;

    const marker = new THREE.Group();
    marker.name = 'task-indicator';

    const glowTex = createMarkerGlowTexture(color);
    const floorGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.36, 0.36),
      new THREE.MeshBasicMaterial({
        map: glowTex,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.58,
      }),
    );
    floorGlow.rotation.x = -Math.PI / 2;
    floorGlow.position.set(0, 0.05, 0);
    marker.add(floorGlow);

    const beacon = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.05, 0),
      new THREE.MeshStandardMaterial({
        color: 0xf8fcff,
        emissive: color,
        emissiveIntensity: 0.88,
        roughness: 0.22,
        metalness: 0.12,
      }),
    );
    beacon.position.set(0, 2.14, 0);
    marker.add(beacon);

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.012, 0.12, 8),
      new THREE.MeshStandardMaterial({
        color: 0xd7e9ff,
        emissive: color,
        emissiveIntensity: 0.45,
        roughness: 0.35,
        metalness: 0.18,
      }),
    );
    stem.position.set(0, 2.06, 0);
    marker.add(stem);

    machine.add(marker);
  }
}

function createMarkerGlowTexture(colorHex: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const color = new THREE.Color(colorHex);
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);

    const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 56);
    grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.9)`);
    grad.addColorStop(0.48, `rgba(${r}, ${g}, ${b}, 0.46)`);
    grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
