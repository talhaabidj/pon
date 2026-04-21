import * as THREE from 'three';
import type { MachineState } from '../../data/types.js';

export interface AnimMats {
  accentMat: THREE.MeshStandardMaterial;
  labelMat: THREE.MeshStandardMaterial;
}

export interface MachineVisualRefs {
  glassMat: THREE.MeshStandardMaterial;
  ledMat: THREE.MeshStandardMaterial;
  jamLight: THREE.Mesh;
}

const CLEAN_GLASS_COLOR = new THREE.Color(0xf4fbff);
const DIRTY_GLASS_COLOR = new THREE.Color(0x9a8b74);
const CLEAN_GLASS_EMISSIVE = new THREE.Color(0x89b8d6);
const DIRTY_GLASS_EMISSIVE = new THREE.Color(0x241d12);
const CLEAN_PULSE_DURATION = 1.0;
const POWER_PULSE_DURATION = 1.1;

const nowSeconds = () => performance.now() * 0.001;

interface PulseState {
  cleanPulseActive: boolean;
  powerPulseActive: boolean;
}

export function triggerMachineCleanPulse(machine: THREE.Group) {
  machine.userData['cleanPulseUntil'] = nowSeconds() + CLEAN_PULSE_DURATION;
}

export function triggerMachinePowerPulse(machine: THREE.Group) {
  machine.userData['powerPulseUntil'] = nowSeconds() + POWER_PULSE_DURATION;
}

function readPulseState(machine: THREE.Group, time: number): PulseState {
  const cleanPulseUntil = machine.userData['cleanPulseUntil'] as number | undefined;
  const powerPulseUntil = machine.userData['powerPulseUntil'] as number | undefined;

  const cleanPulseActive = cleanPulseUntil !== undefined && time < cleanPulseUntil;
  const powerPulseActive = powerPulseUntil !== undefined && time < powerPulseUntil;

  if (cleanPulseUntil !== undefined && !cleanPulseActive) {
    delete machine.userData['cleanPulseUntil'];
  }
  if (powerPulseUntil !== undefined && !powerPulseActive) {
    delete machine.userData['powerPulseUntil'];
  }

  return { cleanPulseActive, powerPulseActive };
}

export function syncMachineMaintenanceVisuals(
  machine: THREE.Group,
  time: number,
  dt: number,
  state?: MachineState,
) {
  const isClean = state?.cleanliness === 'clean';
  const isDirty = state?.cleanliness === 'dirty';
  const isPoweredNow = state?.isPowered ?? true;
  const isJammedNow = state?.isJammed ?? false;
  const stockLevelNow = state?.stockLevel ?? 'ok';
  const isLowStockNow = stockLevelNow === 'low';
  const isOutOfStockNow = stockLevelNow === 'empty';
  const broken = isJammedNow || !isPoweredNow;

  const pulseState = readPulseState(machine, time);

  const visualRefs = machine.userData['visualRefs'] as MachineVisualRefs[] | undefined;
  if (visualRefs && visualRefs.length > 0) {
    const lerpAlpha = Math.min(1, Math.max(0.06, dt * 7));
    const targetGlassColor = isDirty ? DIRTY_GLASS_COLOR : CLEAN_GLASS_COLOR;
    const targetGlassEmissive = isDirty ? DIRTY_GLASS_EMISSIVE : CLEAN_GLASS_EMISSIVE;
    const targetGlassEmissiveIntensity = isDirty ? 0.03 : 0.14;
    const targetGlassOpacity = isDirty ? 0.36 : 0.11;
    const targetGlassRoughness = isDirty ? 0.58 : 0.04;

    for (const { glassMat, ledMat, jamLight } of visualRefs) {
      glassMat.color.lerp(targetGlassColor, lerpAlpha);
      glassMat.emissive.lerp(targetGlassEmissive, lerpAlpha);
      glassMat.emissiveIntensity = THREE.MathUtils.lerp(
        glassMat.emissiveIntensity,
        targetGlassEmissiveIntensity,
        lerpAlpha,
      );
      glassMat.opacity = THREE.MathUtils.lerp(glassMat.opacity, targetGlassOpacity, lerpAlpha);
      glassMat.roughness = THREE.MathUtils.lerp(glassMat.roughness, targetGlassRoughness, lerpAlpha);

      jamLight.visible = isJammedNow;

      let ledColor = 0x44ff44;
      if (!isPoweredNow) {
        ledColor = 0xff2222;
      } else if (isOutOfStockNow) {
        ledColor = 0xff6f42;
      } else if (isLowStockNow) {
        ledColor = 0xffcf4a;
      }
      ledMat.color.setHex(ledColor);
      ledMat.emissive.setHex(ledColor);

      const powerPulseBoost = pulseState.powerPulseActive && isPoweredNow
        ? 0.55 + Math.abs(Math.sin(time * 24)) * 0.9
        : 0;
      ledMat.emissiveIntensity = 0.8 + powerPulseBoost;
    }
  }

  const mats = machine.userData['animMats'] as AnimMats[] | undefined;
  if (!mats || mats.length === 0) return;

  for (const { accentMat, labelMat } of mats) {
    const cleanBoost = pulseState.cleanPulseActive && isClean
      ? 0.2 + Math.abs(Math.sin(time * 22)) * 0.35
      : 0;
    const powerBoost = pulseState.powerPulseActive && isPoweredNow
      ? 0.15 + Math.abs(Math.sin(time * 26)) * 0.25
      : 0;

    if (broken) {
      // Flicker chaotically.
      const intensity = Math.random() > 0.8 ? 0.8 : 0.1;
      accentMat.emissiveIntensity = intensity;
      labelMat.emissiveIntensity = intensity * 0.5;
    } else if (isClean) {
      // Pulse warmly.
      const intensity = 0.5 + Math.sin(time * 3) * 0.2 + cleanBoost + powerBoost;
      accentMat.emissiveIntensity = Math.min(1.25, intensity);
      labelMat.emissiveIntensity = Math.min(0.8, intensity * 0.45);
    } else {
      // Static baseline.
      accentMat.emissiveIntensity = 0.3 + powerBoost;
      labelMat.emissiveIntensity = 0.15 + powerBoost * 0.5;
    }
  }
}
