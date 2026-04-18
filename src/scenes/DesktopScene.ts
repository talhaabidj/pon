/**
 * DesktopScene — Fake OS desktop UI.
 *
 * Renders a stylized "operating system" in HTML/CSS with buttons for
 * Start Shift, Profile, Collection, Settings, and Quit.
 * A subtle Three.js background sits behind the UI.
 */

import * as THREE from 'three';
import type { Scene } from '../data/types.js';
import type { Game } from '../core/Game.js';
import { mountDesktopUI, unmountDesktopUI } from '../ui/desktopUI.js';

export class DesktopScene implements Scene {
  private game: Game;
  private scene3d: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  // Animated background elements
  private particles: THREE.Points | null = null;

  constructor(game: Game) {
    this.game = game;
    this.scene3d = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );
    this.camera.position.set(0, 0, 5);
  }

  init() {
    // —— 3D Background: floating particles ——
    this.scene3d.background = new THREE.Color(0x08080f);

    const particleCount = 200;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3),
    );

    const material = new THREE.PointsMaterial({
      color: 0x7c6ef0,
      size: 0.04,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene3d.add(this.particles);

    // —— Mount HTML UI ——
    mountDesktopUI(this.game);

    // —— Handle resize ——
    window.addEventListener('resize', this.onResize);
  }

  update(dt: number) {
    // Slowly rotate particle field
    if (this.particles) {
      this.particles.rotation.y += dt * 0.05;
      this.particles.rotation.x += dt * 0.02;
    }

    // Render
    this.game.renderer.render(this.scene3d, this.camera);
  }

  dispose() {
    unmountDesktopUI();
    window.removeEventListener('resize', this.onResize);

    // Clean up Three.js objects
    if (this.particles) {
      this.particles.geometry.dispose();
      (this.particles.material as THREE.PointsMaterial).dispose();
      this.scene3d.remove(this.particles);
    }
  }

  private onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  };
}
