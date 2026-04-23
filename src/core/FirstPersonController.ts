/**
 * FirstPersonController — Shared FP camera + movement abstraction.
 *
 * Used by BedroomScene and ShopScene alike. Handles:
 * - Pointer lock acquisition and release
 * - Mouse look (pitch/yaw with clamping)
 * - WASD movement relative to camera heading
 * - Configurable speed, sensitivity, invertY
 *
 * Collision bounds will be added in M4 (ShopScene).
 */

import * as THREE from 'three';
import { Input } from './Input.js';
import { requestPointerLockSafely } from './PointerLock.js';
import {
  WALK_SPEED,
  RUN_SPEED,
  MOUSE_SENSITIVITY,
  PITCH_MIN,
  PITCH_MAX,
  PLAYER_HEIGHT,
} from './Config.js';
import { loadGameState } from './Save.js';
import { sanitizePlayerSettings } from './PlayerSettings.js';
import type { PlayerSettings } from '../data/types.js';

const SETTINGS_UPDATED_EVENT = 'catchapon:settings-updated';

export class FirstPersonController {
  private camera: THREE.PerspectiveCamera | null = null;
  private domElement: HTMLElement;
  private input: Input;
  private enabled = false;
  private isPointerLocked = false;
  private cursorFreed = false;
  
  public onPause?: () => void;

  // Current orientation
  private yaw = 0; // rotation around Y-axis
  private pitch = 0; // rotation around X-axis
  private readonly forward = new THREE.Vector3();
  private readonly right = new THREE.Vector3();
  private readonly upAxis = new THREE.Vector3(0, 1, 0);

  // Configuration (can be updated from settings)
  sensitivity = MOUSE_SENSITIVITY;
  invertY = false;

  constructor(domElement: HTMLElement, input: Input) {
    this.domElement = domElement;
    this.input = input;
    this.isPointerLocked = document.pointerLockElement === this.domElement;

    // Load user preferences
    const settings = sanitizePlayerSettings(loadGameState()?.settings);
    this.invertY = settings.invertY;
    this.sensitivity = settings.mouseSensitivity;

    // Pointer lock listeners
    this.domElement.addEventListener('click', this.requestPointerLock);
    document.addEventListener(
      'pointerlockchange',
      this.onPointerLockChange,
    );
    window.addEventListener(
      SETTINGS_UPDATED_EVENT,
      this.onSettingsUpdated as EventListener,
    );
  }

  /** Attach to a camera and start listening */
  attach(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.camera.position.y = PLAYER_HEIGHT;
    this.setEnabled(true);
  }

  /** Detach from camera and stop processing input */
  detach() {
    this.enabled = false;
    this.camera = null;
  }

  setLookAngles(yaw: number, pitch = 0) {
    this.yaw = yaw;
    this.pitch = Math.max(PITCH_MIN, Math.min(PITCH_MAX, pitch));
    this.applyCameraRotation();
  }

  /** Enable or disable the controller (e.g. when a modal opens) */
  setEnabled(value: boolean) {
    this.enabled = value;
    if (!value && document.pointerLockElement === this.domElement) {
      document.exitPointerLock();
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /** Resume play without auto-locking; the next canvas click can lock again. */
  resumeWithFreeCursor() {
    this.cursorFreed = true;
    this.enabled = true;
  }

  /** Temporarily free or re-lock cursor without pausing */
  toggleCursorFree() {
    if (!this.enabled) return;
    this.cursorFreed = !this.cursorFreed;
    
    if (this.cursorFreed) {
      if (document.pointerLockElement === this.domElement) {
        document.exitPointerLock();
      }
    } else {
      this.requestPointerLock();
    }
  }

  /** Called every frame with delta time in seconds */
  update(dt: number) {
    if (!this.enabled || !this.camera) return;

    // —— Mouse look ——
    if (this.isPointerLocked) {
      const mouseDelta = this.input.getMouseDelta();
      this.yaw -= mouseDelta.x * this.sensitivity;
      const pitchDelta = mouseDelta.y * this.sensitivity;
      this.pitch += this.invertY ? pitchDelta : -pitchDelta;
      this.pitch = Math.max(PITCH_MIN, Math.min(PITCH_MAX, this.pitch));
    }

    this.applyCameraRotation();

    // —— Movement ——
    const moveVec = this.input.getMovementVector();
    if (moveVec.x !== 0 || moveVec.z !== 0) {
      const speed = this.input.isRunning() ? RUN_SPEED : WALK_SPEED;
      const distance = speed * dt;

      // Movement direction relative to camera yaw
      this.forward.set(0, 0, -1).applyAxisAngle(this.upAxis, this.yaw);
      this.right.set(1, 0, 0).applyAxisAngle(this.upAxis, this.yaw);

      this.camera.position.addScaledVector(this.forward, -moveVec.z * distance);
      this.camera.position.addScaledVector(this.right, moveVec.x * distance);

      // Keep at player height (no flying)
      this.camera.position.y = PLAYER_HEIGHT;
    }
  }

  // —— Pointer lock ——

  private requestPointerLock = () => {
    if (this.enabled && !this.isPointerLocked) {
      requestPointerLockSafely(this.domElement);
    }
  };

  private applyCameraRotation() {
    if (!this.camera) return;
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  private onPointerLockChange = () => {
    const wasLocked = this.isPointerLocked;
    this.isPointerLocked = document.pointerLockElement === this.domElement;
    
    // If the controller expects pointer lock but it is lost, trigger pause
    if (this.enabled && wasLocked && !this.isPointerLocked && !this.cursorFreed) {
      if (this.onPause) this.onPause();
    }
    
    // If user clicks back in manually, clear freed state
    if (this.isPointerLocked && this.cursorFreed) {
      this.cursorFreed = false;
    }
  };

  private onSettingsUpdated = (
    event: CustomEvent<{ settings?: Partial<PlayerSettings> }>,
  ) => {
    const incoming = event.detail?.settings;
    if (!incoming) return;

    const settings = sanitizePlayerSettings(incoming);
    this.invertY = settings.invertY;
    this.sensitivity = settings.mouseSensitivity;
  };

  dispose() {
    this.domElement.removeEventListener('click', this.requestPointerLock);
    document.removeEventListener(
      'pointerlockchange',
      this.onPointerLockChange,
    );
    window.removeEventListener(
      SETTINGS_UPDATED_EVENT,
      this.onSettingsUpdated as EventListener,
    );
  }
}
